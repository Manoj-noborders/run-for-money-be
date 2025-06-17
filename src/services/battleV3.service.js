//@ts-check
const sequelize = require('sequelize');
const db = require('../database/database');
const models = require('../models');
const { UserInputError } = require('../utils/classes');
const lodash = require('lodash');
const LBService = require('./leaderboard.service');

const s3Uploader = require('../utils/s3Upload');

const {
    battles,
    userLeagues,
    battle_logs,
    users,
    user_money,
    user_battle_reward_logs,
    gacha_reward_settings,
    user_gacha_tickets,
    game_logs,
    rfm_player_config
} = models;

const { Op } = sequelize;

const svcV2 = require('./battle.v2.service');
const aiUserService = require('./aiUser.service');



/**
 * Start a new battle with transaction support
 * @param {Object} battleData Battle initialization data
 * @param {number} participation_fee Fee per player
 */
exports.startNewBattle = async (battleData, participation_fee) => {

    const { hunterIds, runnerIds, roomId } = battleData;

    // Input validation
    if (!hunterIds?.length || !runnerIds?.length || !roomId) {
        throw new UserInputError('Invalid battle data: Missing required fields');
    }

    // Validate array contents
    if (!hunterIds.every(Number) || !runnerIds.every(Number)) {
        throw new UserInputError('Invalid user IDs provided');
    }

    // Check for duplicate IDs
    const allIds = [...hunterIds, ...runnerIds];
    if (new Set(allIds).size !== allIds.length) {
        throw new UserInputError('Duplicate user IDs found');
    }

    // Check if users exist and are active
    const existingUsers = await users.findAll({
        where: {
            id: { [Op.in]: allIds },
            isDeleted: false,
        },
        // transaction
    });

    if (existingUsers.length !== allIds.length) {
        const foundIds = existingUsers.map(u => u.id);
        const missingIds = allIds.filter(id => !foundIds.includes(id));
        throw new UserInputError(`Users not found or inactive: ${missingIds.join(', ')}`);
    }

    // Check if any user is in battle
    const usersInBattle = await getUsersInBattle(allIds,);
    if (usersInBattle.length > 0) {
        const inBattleIds = usersInBattle.map(user => user.userId);
        throw new UserInputError(`Users already in battle: ${inBattleIds.join(', ')}`);
    }

    // const transaction = await db.transaction();

    try {
        // // Deduct participation fee
        // await deductParticipationFeeFromUsers(allIds, participation_fee,);

        // Create battle record
        const newBattle = await battles.create({
            hunter_ids: hunterIds,
            runner_ids: runnerIds,
            room_id: roomId,
            participation_fee_each: participation_fee,
            total_participation_fee: (hunterIds.length + runnerIds.length) * participation_fee,
            start_date: new Date(),
        },
            // { transaction }
        );
        // await transaction.commit();

        for (let i = 0; i < hunterIds.length; i++) {
            const element = hunterIds[i];
            let userLeaguesRes = await userLeagues.findOne({ where: { userId: element } });
            await userLeagues.update({ battles: userLeaguesRes ? userLeaguesRes.battles + 1 : 1 }, { where: { userId: element } });
        }

        for (let i = 0; i < runnerIds.length; i++) {
            const element = runnerIds[i];
            let userLeaguesRes = await userLeagues.findOne({ where: { userId: element } });
            await userLeagues.update({ battles: userLeaguesRes ? userLeaguesRes.battles + 1 : 1 }, { where: { userId: element } });
        }

        // Set users as playing
        await setUsersPlayingState(allIds, true,);

        return newBattle;

    } catch (error) {
        // await transaction.rollback();
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error('Battle start failed:', error);
        throw error;
    }
}

/**
 * End a battle and distribute rewards with transaction support
 * @param {number} battleId Battle ID
 * @param {Object} results Battle results
 */
exports.endBattle = async (battleId, results) => {
    const { winning_team, hunter_data, runner_data } = results;

    // Fetch and validate battle
    const battle = await battles.findOne({
        where: { id: battleId },
    });

    if (!battle) {
        throw new UserInputError('Battle not found');
    }

    if (battle.has_ended) {
        throw new UserInputError('Battle already ended');
    }

    // Validate battle participants
    // const hunterIds = battle.hunter_ids;
    // const runnerIds = battle.runner_ids;
    const hunterIds = hunter_data.map(h => h.user_id);
    const runnerIds = runner_data.map(r => r.user_id);

    let forceQuitIds = await validateBattleResults(battle, hunter_data, runner_data);
    console.info(forceQuitIds, "forceQuitIds---150")
    // Calculate rewards
    const battleRewardsData = calculateBattleGoldRewards(results, battle.participation_fee_each, forceQuitIds);
    console.info(battleRewardsData, "battleRewardsData---153")
    try {
        // Distribute gold rewards
        await rewardBattleGoldToUsers(winning_team, battleRewardsData);

        // Distribute gacha tickets
        const gachaTicketRewards = await rewardGachaTicketsAfterBattle([...hunterIds, ...runnerIds], battle.id,);

        const userNames = await users.findAll({
            where: { id: [...hunterIds, ...runnerIds] },
            attributes: ['id', 'name', 'walletAddress', 'avatar'],
            raw: true
        });
        // Add gacha rewards to player data
        //@ts-ignore
        battleRewardsData.hunters = battleRewardsData.hunters.map(hunter => ({
            //@ts-ignore
            ...hunter,
            //@ts-ignore
            caught_runners: hunter_data.find(h => h.user_id === hunter.user_id).caught_runners.length,
            //@ts-ignore
            playerName: userNames.find(u => u.id === hunter.user_id).name || userNames.find(u => u.id === hunter.user_id).walletAddress.slice(0, 6),
            //@ts-ignore
            gacha_reward: gachaTicketRewards[hunter.user_id] || null,
            //@ts-ignore
            avatar: userNames.find(u => u.id === hunter.user_id).avatar
        }));

        //@ts-ignore
        battleRewardsData.runners = battleRewardsData.runners.map(runner => ({
            //@ts-ignore
            ...runner,
            //@ts-ignore
            survival_time: runner_data.find(r => r.user_id === runner.user_id).time_survived,
            //@ts-ignore
            playerName: userNames.find(u => u.id === runner.user_id).name || userNames.find(u => u.id === runner.user_id).walletAddress.slice(0, 6),
            //@ts-ignore
            gacha_reward: gachaTicketRewards[runner.user_id] || null,
            //@ts-ignore
            avatar: userNames.find(u => u.id === runner.user_id).avatar
        }));

        //* reward users for participation
        const PARTICIPATION_BONUS = process.env.PARTICIPATION_BONUS || 20000;

        let eligibleIds = [];
        if (forceQuitIds && forceQuitIds.length) {
            eligibleIds = [...hunterIds, ...runnerIds].filter((id) => !forceQuitIds.includes(id));
        } else {
            eligibleIds = [...hunterIds, ...runnerIds];
        }
        console.info(eligibleIds, "eligibleIds---204")
        const rewards2 = await rewardParticipationGoldToUsers([...eligibleIds], PARTICIPATION_BONUS);
        console.info('rewards', rewards2);

        // Create battle logs
        const finalLogs = await createBattleLogs(battle, results, battleRewardsData, gachaTicketRewards);

        await updateUsersLeaderboard(finalLogs);

        // Update battle record
        await battles.update({
            winning_team,
            has_ended: true,
            results: {
                inputData: results,
                battleRewardsData: battleRewardsData,
                gachaTicketRewards: gachaTicketRewards
            },
            end_date: new Date(),
            total_reward: battleRewardsData.finalTotalRewards,
        }, {
            where: { id: battleId },
        });

        // Set users as not playing
        await setUsersPlayingState([...hunterIds, ...runnerIds], false,);

        //* Update AI players to not playing. dont worry, function will take care of it
        await aiUserService.updateAiUserPlayStatus({ aiStatus: 'notplaying' }, [...hunterIds, ...runnerIds]);

        await rewardUserFor3GamePlays([...hunterIds, ...runnerIds], battleId);

        return {
            hunter_rewards: battleRewardsData.hunters,
            runner_rewards: battleRewardsData.runners,
            winning_team,
            dualId: battleId
        };

    } catch (error) {
        // await transaction.rollback();
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error('Battle end failed:', error);
        throw error;
    }
}

// Helper functions with transaction support
const getUsersInBattle = async (userIds, transaction) => {
    return await userLeagues.findAll({
        where: {
            userId: { [Op.in]: userIds },
            is_playing: true
        },
        include: [{
            model: users,
            where: { role: { [Op.not]: 5 } },
        }]
        // transaction
    });
}

// const calculateBattleGoldRewards = (duelData, participationFee, forceQuitIds) => {
//     const { winning_team, hunter_data, runner_data } = duelData;

//     // Calculate total reward
//     // Winning team reward
//     const teamReward = (participationFee / 2);
//     console.info(teamReward, participationFee, hunter_data.length, runner_data.length, "---teamReward---272")
//     // Initialize results
//     const results = {
//         hunters: [], runners: [],
//         totalReward: participationFee * (hunter_data.length + runner_data.length),
//         finalTotalRewards: 0
//     };

//     if (winning_team === 'hunter') {
//         // Hunters win
//         hunter_data.forEach((hunter) => {
//             if (forceQuitIds && forceQuitIds.length) {
//                 let index = forceQuitIds.findIndex((id) => id === hunter.user_id);
//                 if (index === -1) {
//                     // User is not in force quit list
//                     const caughtRunners = hunter.caught_runners.length;
//                     const personalReward = (participationFee / 2) * caughtRunners;

//                     const total_reward = teamReward + personalReward;       // participationFee removed as it is not being deducted
//                     // const total_reward = teamReward + personalReward + participationFee;
//                     results.finalTotalRewards += total_reward;
//                     //@ts-ignore
//                     results.hunters.push({
//                         user_id: hunter.user_id,
//                         team: 'hunter',
//                         team_reward: teamReward,
//                         personal_reward: personalReward,
//                         own: participationFee,
//                         total_reward: total_reward,
//                     });
//                 } else {
//                     //@ts-ignore
//                     results.hunters.push({
//                         user_id: hunter.user_id,
//                         team: 'hunter',
//                         team_reward: 0,
//                         personal_reward: 0,
//                         own: 0,
//                         total_reward: 0,
//                     });
//                 }
//             } else {
//                 const caughtRunners = hunter.caught_runners.length;
//                 const personalReward = (participationFee / 2) * caughtRunners;

//                 const total_reward = teamReward + personalReward;       // participationFee removed as it is not being deducted
//                 // const total_reward = teamReward + personalReward + participationFee;
//                 results.finalTotalRewards += total_reward;
//                 //@ts-ignore
//                 results.hunters.push({
//                     user_id: hunter.user_id,
//                     team: 'hunter',
//                     team_reward: teamReward,
//                     personal_reward: personalReward,
//                     own: participationFee,
//                     total_reward: total_reward,
//                 });

//                 //@ts-ignore
//                 results.hunters.push({
//                     user_id: hunter.user_id,
//                     team: 'hunter',
//                     team_reward: 0,
//                     personal_reward: 0,
//                     own: 0,
//                     total_reward: 0,
//                 });
//             }
//         });

//         runner_data.forEach((runner) => {
//             //@ts-ignore
//             results.runners.push({
//                 user_id: runner.user_id,
//                 team: 'runner',
//                 team_reward: 0,
//                 personal_reward: 0,
//                 total_reward: 0,
//             });
//         });
//     } else if (winning_team === 'runner') {
//         // Runners win
//         runner_data.forEach((runner) => {
//             if (forceQuitIds && forceQuitIds.length) {
//                 let index = forceQuitIds.findIndex((id) => id === runner.user_id);
//                 if (index === -1) {
//                     // const personalReward = runner.is_caught ? 0 : participationFee / 2;
//                     const personalReward = runner.is_caught ? 0 : runner.time_survived * 100;

//                     const total_reward = personalReward + teamReward;       // participationFee removed as it is not being deducted
//                     // const total_reward = personalReward + teamReward + participationFee;
//                     results.finalTotalRewards += total_reward;
//                     //@ts-ignore
//                     results.runners.push({
//                         user_id: runner.user_id,
//                         team: 'runner',
//                         team_reward: teamReward,
//                         personal_reward: personalReward,
//                         own: participationFee,
//                         total_reward: total_reward,
//                     });
//                 } else {
//                     //@ts-ignore
//                     results.runners.push({
//                         user_id: runner.user_id,
//                         team: 'runner',
//                         team_reward: 0,
//                         personal_reward: 0,
//                         own: 0,
//                         total_reward: 0,
//                     });
//                 }
//             } else {
//                 // const personalReward = runner.is_caught ? 0 : participationFee / 2;
//                 const personalReward = runner.is_caught ? 0 : runner.time_survived * 100;

//                 const total_reward = personalReward + teamReward;       // participationFee removed as it is not being deducted
//                 // const total_reward = personalReward + teamReward + participationFee;
//                 results.finalTotalRewards += total_reward;
//                 //@ts-ignore
//                 results.runners.push({
//                     user_id: runner.user_id,
//                     team: 'runner',
//                     team_reward: teamReward,
//                     personal_reward: personalReward,
//                     own: participationFee,
//                     total_reward: total_reward,
//                 });

//                 //@ts-ignore
//                 results.runners.push({
//                     user_id: runner.user_id,
//                     team: 'runner',
//                     team_reward: 0,
//                     personal_reward: 0,
//                     own: 0,
//                     total_reward: 0,
//                 });
//             }
//         });

//         hunter_data.forEach((hunter) => {
//             let index = forceQuitIds.findIndex((id) => id === hunter.user_id);
//             if (index === -1) {
//                 const personal_reward = hunter.caught_runners.length * participationFee / 2;
//                 const total_reward = personal_reward
//                 results.finalTotalRewards += total_reward;
//                 //@ts-ignore
//                 results.hunters.push({
//                     user_id: hunter.user_id,
//                     team: 'hunter',
//                     team_reward: 0,
//                     personal_reward: personal_reward,
//                     total_reward: total_reward,
//                 });
//             } else {
//                 //@ts-ignore
//                 results.hunters.push({
//                     user_id: hunter.user_id,
//                     team: 'hunter',
//                     team_reward: 0,
//                     personal_reward: 0,
//                     total_reward: 0,
//                 });
//             }
//         });
//     }
//     console.info(results, "---results---343")
//     return results;
// };

const calculateBattleGoldRewards = (duelData, participationFee, forceQuitIds = []) => {
    const { winning_team, hunter_data, runner_data } = duelData;
    const teamReward = participationFee / 2;

    const results = {
        hunters: [],
        runners: [],
        totalReward: participationFee * (hunter_data.length + runner_data.length),
        finalTotalRewards: 0,
    };

    const isForceQuit = (userId) => forceQuitIds.includes(userId);

    const pushReward = (arr, userId, team, teamReward, personalReward, own, totalReward) => {
        arr.push({ user_id: userId, team, team_reward: teamReward, personal_reward: personalReward, own, total_reward: totalReward });
        results.finalTotalRewards += totalReward;
    };

    const pushZeroReward = (arr, userId, team) => {
        arr.push({ user_id: userId, team, team_reward: 0, personal_reward: 0, own: 0, total_reward: 0 });
    };

    if (winning_team === 'hunter') {
        hunter_data.forEach((hunter) => {
            const { user_id, caught_runners = [] } = hunter;
            if (!isForceQuit(user_id)) {
                const personalReward = teamReward * caught_runners.length;
                const totalReward = teamReward + personalReward;
                pushReward(results.hunters, user_id, 'hunter', teamReward, personalReward, participationFee, totalReward);
            } else {
                pushZeroReward(results.hunters, user_id, 'hunter');
            }
        });

        runner_data.forEach(({ user_id }) => {
            pushZeroReward(results.runners, user_id, 'runner');
        });

    } else if (winning_team === 'runner') {
        runner_data.forEach((runner) => {
            const { user_id, is_caught, time_survived } = runner;
            if (!isForceQuit(user_id)) {
                const personalReward = is_caught ? 0 : time_survived * 100;
                const totalReward = teamReward + personalReward;
                pushReward(results.runners, user_id, 'runner', teamReward, personalReward, participationFee, totalReward);
            } else {
                pushZeroReward(results.runners, user_id, 'runner');
            }
        });

        hunter_data.forEach(({ user_id, caught_runners = [] }) => {
            if (!isForceQuit(user_id)) {
                const personalReward = teamReward * caught_runners.length;
                pushReward(results.hunters, user_id, 'hunter', 0, personalReward, 0, personalReward);
            } else {
                pushZeroReward(results.hunters, user_id, 'hunter');
            }
        });
    }

    console.info(results, "---results---");
    return results;
};


/**
 * Reward battle gold to winning team with transaction support
 * @param {string} winning_team Team that won the battle ('hunter' or 'runner')
 * @param {Object} battleRewardsData Calculated reward data
 */
const rewardBattleGoldToUsers = async (winning_team, battleRewardsData,) => {
    try {
        const { hunters, runners } = battleRewardsData;
        console.info(winning_team, hunters, runners, "---winning_team---355")
        const winners = winning_team === 'hunter' ? hunters : runners;
        const results = [];

        // Validate reward data
        if (!winners?.length) {
            throw new Error('Invalid reward data: No winners found');
        }

        // Get all user money records in one query
        const userMoneyRecords = await user_money.findAll({
            where: {
                user_id: { [Op.in]: winners.map(w => w.user_id) }
            },
            // transaction
        });

        // Create money records for users who don't have them
        const existingUserIds = userMoneyRecords.map(record => record.user_id);
        const missingUserIds = winners.filter(w => !existingUserIds.includes(w.user_id))
            .map(w => w.user_id);
        console.info(missingUserIds, existingUserIds, winners, "---missingUserIds---376")
        if (missingUserIds.length > 0) {
            await user_money.bulkCreate(
                missingUserIds.map(userId => ({
                    user_id: userId,
                    gold: 0,
                    jewels: 0
                })),
                // { transaction }
            );
        }

        // Increment gold for all winners in bulk
        for (const winner of winners) {
            if (!winner.total_reward) continue; // Skip if no reward
            console.info(winner, "---winner---391")
            const [numRows, rows] = await user_money.increment(
                ['gold'],
                {
                    by: winner.total_reward,
                    where: { user_id: winner.user_id },
                    returning: true,
                    // transaction
                }
            );

            if (numRows === 0) {
                throw new Error(`Failed to reward gold to user ${winner.user_id}`);
            }

            results.push(rows[0]);
        }

        // // List of AI user IDs
        // const aiUserIds = await getNonAiUsers(winners.map(w => w.user_id), transaction);

        // // Filter out AI users before creating reward logs
        // const nonAiWinners = winners.filter(winner => !aiUserIds.includes(winner.user_id));



        return results;

    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error('Failed to reward battle gold:', error);
        throw error;
    }
}


const getNonAiUsers = async (userIds, transaction) => {
    return await users.findAll({
        attributes: ['id', 'name', 'walletAddress'],
        where: {
            id: { [Op.in]: userIds },
            role: { [Op.not]: 5 }
        },
        raw: true,
    }, { transaction });
}


const deductParticipationFeeFromUsers = async (userIds, fee, transaction) => {
    const userMoneyRecords = await user_money.findAll({
        where: { user_id: { [Op.in]: userIds } },
        // transaction
    });

    // Validate all users have sufficient balance
    for (const record of userMoneyRecords) {
        if (record.gold < fee) {
            throw new UserInputError(`User ${record.user_id} has insufficient funds`);
        }
    }

    // Deduct fee from all users
    await user_money.decrement('gold', {
        by: fee,
        where: { user_id: { [Op.in]: userIds } },
        // transaction
    });
}

const setUsersPlayingState = async (userIds, isPlaying, transaction) => {
    const leaguesupdated = await userLeagues.update(
        { is_playing: isPlaying },
        {
            where: { userId: { [Op.in]: userIds } },
            // transaction
        }
    );
    console.log('leagues playing updated to :', isPlaying, ' of ', leaguesupdated);
    // Update AI players if any
    const aiUpdated = await users.update(
        { aiStatus: isPlaying ? 'playing' : 'notplaying' },
        {
            where: {
                id: { [Op.in]: userIds },
                role: 5
            },
            // transaction
        }
    );
    console.log('AI playing status updated to :', isPlaying, ' of ', aiUpdated);
}


const rewardGachaTicketsAfterBattle = async (userIds, battleId,) => {
    try {
        const nonAiUsers = await getNonAiUsers(userIds);
        const nonAiUserIds = nonAiUsers.map(user => user.id);

        const rewardSettings = await models.gacha_reward_settings.findAll({
            where: { is_active: true },
            include: [{
                model: models.gachas,
                attributes: ['name']
            }],
            raw: true
        }, {
            // transaction
        });

        const userTicketRewards = {};

        for (const userId of nonAiUserIds) {
            // Randomly select one reward setting
            const randomSetting = rewardSettings[Math.floor(Math.random() * rewardSettings.length)];
            let shouldReward = false;

            if (randomSetting.is_guaranteed) {
                shouldReward = true;
            } else {
                // Roll for probability-based reward
                const roll = Math.random() * 100;
                shouldReward = (roll <= randomSetting.probability);
            }

            if (shouldReward) {
                // Create ticket
                await models.user_gacha_tickets.create({
                    user_id: userId,
                    gacha_id: randomSetting.gacha_id,
                    quantity: randomSetting.quantity,
                    purchase_id: battleId // battleId is used as purchase_id for reward tickets
                }, {
                    // transaction
                });

                userTicketRewards[userId] = {
                    gacha_id: randomSetting.gacha_id,
                    gacha_name: randomSetting['gacha.name'],
                    quantity: randomSetting.quantity
                };
            }

            // * below code gives multiple type of rewards to user, but commented for now
            // const rewards = [];

            // for (const setting of rewardSettings) {
            //     if (setting.is_guaranteed) {
            //         // Guaranteed rewards
            //         rewards.push({
            //             gacha_id: setting.gacha_id,
            //             quantity: setting.quantity
            //         });
            //     } else {
            //         // Probability-based rewards
            //         const roll = Math.random() * 100;
            //         if (roll <= setting.probability) {
            //             rewards.push({
            //                 gacha_id: setting.gacha_id,
            //                 quantity: setting.quantity
            //             });
            //         }
            //     }
            // }

            // userTicketRewards[userId] = rewards;

            // // Add tickets to user's inventory
            // for (const reward of rewards) {
            //     await models.user_gacha_tickets.create({
            //         user_id: userId,
            //         gacha_id: reward.gacha_id,
            //         quantity: reward.quantity,
            //         purchase_id: 0
            //     });
            // }
        }

        return userTicketRewards;

    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error(error, '\n  Failed to reward gacha tickets after battle');
        throw error;
    }
}


const createBattleLogs = async (battle, results, rewardsData, gachaRewards, transaction) => {
    const { hunter_data, runner_data, winning_team } = results;

    let aiPlayerIds = await users.findAll({ where: { role: 5, id: [...battle.hunter_ids, ...battle.runner_ids] }, attributes: ['id'], raw: true });
    aiPlayerIds = aiPlayerIds.map(ai => ai.id);

    const combinedLogs = [
        ...hunter_data
            .filter(hunter => !aiPlayerIds.includes(hunter.user_id)) // Exclude AI players
            .map(hunter => ({
                battle_id: battle.id,
                user_id: hunter.user_id,
                role: 'hunter',
                battle_result: winning_team === 'hunter' ? 'win' : 'lose',
                caught_runners: hunter.caught_runners,
                //@ts-ignore
                gold_earned: rewardsData.hunters.find(h => h.user_id === hunter.user_id).personal_reward,
                //@ts-ignore
                team_reward: rewardsData.hunters.find(h => h.user_id === hunter.user_id).team_reward,
                participation_fee_deducted: battle.participation_fee_each,
            })),
        ...runner_data
            .filter(runner => !aiPlayerIds.includes(runner.user_id)) // Exclude AI players
            .map(runner => ({
                battle_id: battle.id,
                user_id: runner.user_id,
                role: 'runner',
                battle_result: winning_team === 'runner' ? 'win' : 'lose',
                is_caught: runner.is_caught,
                time_survived: runner.time_survived,
                //@ts-ignore
                gold_earned: rewardsData.runners.find(r => r.user_id === runner.user_id).personal_reward,
                //@ts-ignore
                team_reward: rewardsData.runners.find(r => r.user_id === runner.user_id).team_reward,
                participation_fee_deducted: battle.participation_fee_each,
                gacha_reward: gachaRewards[runner.user_id] || null,
            }))
    ];


    await battle_logs.bulkCreate(combinedLogs, {
        // transaction
    });

    return combinedLogs;
}

const validateBattleResults = async (battle, hunter_data, runner_data) => {
    const hunterIdsInResults = hunter_data.map(h => h.user_id);
    const runnerIdsInResults = runner_data.map(r => r.user_id);
    console.info(hunterIdsInResults, runnerIdsInResults, "hunterIdsInResults, runnerIdsInResults---629")
    // Check for missing or extra hunters/runners
    const missingHunters = battle.hunter_ids.filter(id => !hunterIdsInResults.includes(id));
    const missingRunners = battle.runner_ids.filter(id => !runnerIdsInResults.includes(id));
    const extraHunters = hunterIdsInResults.filter(id => !battle.hunter_ids.includes(id));
    const extraRunners = runnerIdsInResults.filter(id => !battle.runner_ids.includes(id));
    console.info(missingHunters, missingRunners, "missingHunters, missingRunners---635")
    console.info(extraHunters, extraRunners, "extraHunters, extraRunners---636")
    if (missingHunters.length || missingRunners.length || extraHunters.length || extraRunners.length) {
        // check if battle logs if any of those users have force quit record for same battle
        const forceQuitUsers = await battle_logs.findAll({
            where: {
                battle_id: battle.id,
                user_id: { [Op.or]: [...missingHunters, ...missingRunners, ...extraHunters, ...extraRunners] },
                force_quit: true
            },
            raw: true
        });
        console.info(forceQuitUsers, "forceQuitUsers---644")
        if (forceQuitUsers.length) {
            console.log('Force quit users found:', forceQuitUsers);
            //* add them to relevent array of ids
            // const forceQuitIds = forceQuitUsers.map(user => user.user_id);
            return forceQuitUsers.map(user => user.user_id);
        } else throw new UserInputError('Battle results do not match initial battle data');
    }
}

const updateUsersLeaderboard = async (rewardsData) => {
    try {
        // const playerIds = rewardsData.map(player => player.user_id);
        // const realPlayers = await getNonAiUsers(playerIds);

        // for (const pid of realPlayers) {
        for (const player of rewardsData) {
            // const player = rewardsData.find(p => p.user_id === pid.id);
            // if (player) {
            // await LBService.updateLeaderboard(player.user_id, player.personal_reward);
            // await LBService.updateLeaderboardV2(player.user_id, player.gold_earned, player.battle_result);
            await LBService.updateLeaderboardV2(player.user_id, player.gold_earned, player.team_reward, player.battle_result);

            // } else {
            //     console.log('Player not found in rewardsData:', pid);
            // }
            console.log('Leaderboard updated for player:=>> ', player.user_id, 'reward :', player.gold_earned);
        }

    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error(error)
    }
}


const rewardUserFor3GamePlays = async (playerIds, battleId, transaction) => {
    try {
        const REWARD_COUNTER = process.env.BATTLE_BONUS_COUNTER || 3;
        const REWARD_AMOUNT = process.env.BATTLE_BONUS_AMOUNT || 20000;
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        const startOfTomorrow = new Date().setHours(24, 0, 0, 0);

        const nonAiPlayers = await users.findAll({
            attributes: ['id', 'name'],
            where: { id: { [Op.in]: playerIds }, role: { [Op.not]: 5 } },
            raw: true
        });

        const userIds = nonAiPlayers.map(player => player.id);

        // Fetch all reward logs for these users for today
        const rewardLogs = await user_battle_reward_logs.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                reward_type: '3WIN',
                created_at: {
                    [Op.gte]: startOfToday,
                    [Op.lt]: startOfTomorrow
                }
            }
        });

        // Get users already rewarded
        const rewardedUserIds = new Set(rewardLogs.map(log => log.user_id));
        console.info(rewardedUserIds, "rewardedUserIds---709")
        // Fetch all battle logs for these users for today
        const battleLogs = await battle_logs.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                created_at: {
                    [Op.gte]: startOfToday,
                    [Op.lt]: startOfTomorrow
                }
            }
        });

        // Group battle logs by user
        const userBattleCounts = battleLogs.reduce((acc, log) => {
            acc[log.user_id] = (acc[log.user_id] || 0) + 1;
            return acc;
        }, {});
        console.info(userBattleCounts, "userBattleCounts---726")
        // Find eligible users
        const eligibleUserIds = userIds.filter(userId =>
            !rewardedUserIds.has(userId) &&
            (userBattleCounts[userId] || 0) >= REWARD_COUNTER
        );
        console.info(eligibleUserIds, "eligibleUserIds---732")
        if (eligibleUserIds.length === 0) {
            console.info('No users eligible for rewards');
            return [];
        }

        // Increment gold for eligible users in bulk
        await user_money.increment('gold', {
            by: REWARD_AMOUNT,
            where: { user_id: { [Op.in]: eligibleUserIds } },
            transaction
        });

        // Create reward logs in bulk
        const newRewardLogs = eligibleUserIds.map(userId => ({
            user_id: userId,
            reward_type: '3WIN',
            reward_value: REWARD_AMOUNT,
            battle_id: battleId
        }));

        const createdRewardLogs = await user_battle_reward_logs.bulkCreate(newRewardLogs);

        console.log('Rewards successfully distributed');
        return createdRewardLogs;
    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        throw error;
    }
}


const rewardParticipationGoldToUsers = async (playerIds, amount,) => {
    // let btlrwrds;
    const data = await user_money.increment('gold', {
        by: amount,
        where: { user_id: { [Op.in]: playerIds } },
        // returning: true,
        // transaction
    });

    if (data[0] === 0) {
        throw new Error('Failed to reward gold to users');
    }

    return data;
}

exports.getBattleResultById = async (battleId) => {
    try {
        const battle = await battles.findOne({ where: { id: battleId }, raw: true });
        if (!battle) throw new UserInputError('Battle not found/Invalid battle ID');

        const battleResults = battle.results?.battleRewardsData;
        if (!battleResults) throw new UserInputError('Battle results not found');

        const userProfiles = await users.findAll({
            where: { id: [...battle.hunter_ids, ...battle.runner_ids], role: { [Op.not]: 5 } },
            attributes: ['id', 'name', 'avatar'],
            raw: true,
        });
        console.info(userProfiles, "---userProfiles---791")
        const response = {
            duelID: battle.id,
            hasEnded: battle.has_ended,
            RunnerWin: battle.has_ended ? battle.winning_team === 'runner' : null,
            hunterRewards: battleResults?.hunters?.map(hunter => {
                let dt = {
                    user_id: hunter.user_id,
                    total_reward: hunter.total_reward,
                    caught_runners: hunter.caught_runners,
                    playerName: hunter.playerName,
                    personal_reward: hunter.personal_reward,
                    gacha_reward: {
                        gacha_name: hunter.gacha_reward?.gacha_name || null,
                        quantity: hunter.gacha_reward?.quantity || null
                    },
                    avatar_url: userProfiles.find(u => u.id === hunter.user_id)?.avatar || null
                }

                if (battle.winning_team === 'hunter') {
                    dt['team_reward'] = (battle.participation_fee_each / 2)
                }

                return dt;
            }),
            runner_rewards: battleResults?.runners?.map(runner => {
                let dt = {
                    user_id: runner.user_id,
                    total_reward: runner.total_reward,
                    surviveTime: runner.survival_time,
                    playerName: runner.playerName,
                    personal_reward: runner.personal_reward,
                    gacha_reward: {
                        gacha_name: runner.gacha_reward?.gacha_name || null,
                        quantity: runner.gacha_reward?.quantity || null
                    },
                    avatar_url: userProfiles.find(u => u.id === runner.user_id)?.avatar || null
                }

                if (battle.winning_team === 'runner') {
                    dt['team_reward'] = (battle.participation_fee_each / 2)
                }

                return dt;
            }),
        }

        return response;
    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error('Error getting battle result after end:', error);
        throw error;
    }
}


exports.uploadGameLogs = async (file, userId, duelId, entityType) => {
    // check if user logs already exists
    const userLogs = await game_logs.findOne({ where: { userId: userId, duelId: duelId, entityType } });
    if (userLogs) {
        // throw new UserInputError('User logs already exists for this battle');
    }

    // Upload file to S3
    const fileUrl = await s3Uploader.uploadFile(file, userId, duelId);
    console.log('fileUrl', fileUrl);
    // Save log entry to database
    const gameLog = await game_logs.create({
        userId: parseInt(userId),
        duelId: parseInt(duelId),
        entityType,
        fileUrl
    });

    return {
        logId: gameLog.id,
        fileUrl,
    }
}

exports.getGameLogsByBattleId = async (duelId, userId) => {
    const whereCondition = { duelId: parseInt(duelId) };

    if (userId) {
        whereCondition.userId = parseInt(userId);
    }

    return await game_logs.findAll({
        where: whereCondition,
        order: [['createdAt', 'DESC']],
        raw: true,
    });
}

exports.getLeaderboard = async (page = 1, limit = 10, period = 'daily') => {
    const offset = (page - 1) * limit;

    const timeFilter = period === 'daily'
        ? 'bl.created_at >= CURRENT_DATE'
        : 'bl.created_at >= DATE_TRUNC(\'week\', CURRENT_DATE)';


    const countQuery = `
          SELECT COUNT(*) 
          FROM (
            SELECT u.id
            FROM users u
            LEFT JOIN rfm_battle_logs bl ON u.id = bl.user_id
            WHERE ${timeFilter}
            GROUP BY u.id
            -- HAVING COUNT(DISTINCT bl.battle_id) > 0
          ) as player_count
        `;

    //     `SELECT 
    //           u.name,
    //           u.id as uid,
    //           SUM(COALESCE(bl.gold_earned, 0)) as total_score,
    //           COUNT(DISTINCT bl.battle_id) as match_count,
    //           COUNT(CASE WHEN bl.battle_result = 'win' THEN 1 END) as wins,
    //           COUNT(CASE WHEN bl.battle_result = 'lose' THEN 1 END) as losses,
    //           CASE 
    //             WHEN COUNT(DISTINCT bl.battle_id) = 0 THEN 0
    //             ELSE CAST(COUNT(CASE WHEN bl.battle_result = 'win' THEN 1 END) AS FLOAT) / 
    //                NULLIF(COUNT(DISTINCT bl.battle_id), 0)
    //           END as win_ratio
    //         FROM users u
    //         LEFT JOIN rfm_battle_logs bl ON u.id = bl.user_id
    //         WHERE ${timeFilter}
    //         GROUP BY u.id, u.name
    //         HAVING COUNT(DISTINCT bl.battle_id) > 0
    // `

    const query = `
      WITH player_stats AS (
         SELECT 
            u.name,
            u.id as uid,
            SUM(COALESCE(bl.gold_earned, 0)) as total_score,
            COUNT(DISTINCT bl.battle_id) as match_count,
            COUNT(CASE WHEN bl.battle_result = 'win' THEN 1 END) as wins,
            COUNT(CASE WHEN bl.battle_result = 'lose' THEN 1 END) as losses,
            CASE 
              WHEN COUNT(DISTINCT bl.battle_id) = 0 THEN 0
              ELSE CAST(COUNT(CASE WHEN bl.battle_result = 'win' THEN 1 END) AS FLOAT) / 
                   NULLIF(COUNT(DISTINCT bl.battle_id), 0)
            END as win_ratio
          FROM users u
          LEFT JOIN rfm_battle_logs bl ON u.id = bl.user_id 
            AND ${timeFilter}  
          GROUP BY u.id, u.name
      )
      SELECT 
        ROW_NUMBER() OVER (
          ORDER BY 
            total_score DESC,           -- 1st tiebreaker: score
            win_ratio DESC,             -- 2nd tiebreaker: win ratio
            match_count DESC            -- 3rd tiebreaker: number of games played
        ) as "rank",
        uid as user_id,
        name,
        total_score as score,
        match_count as battles,
        wins,
        losses,
        CAST((win_ratio * 100) as NUMERIC(10,2)) as win_ratio
      FROM player_stats
      ORDER BY total_score DESC
        OFFSET ${offset}
        LIMIT ${limit};
    `;

    const [[{ count }], results] = await Promise.all([
        db.query(countQuery, {
            type: sequelize.QueryTypes.SELECT,
            raw: true,
            logging: false,
        }),
        db.query(query, {
            type: sequelize.QueryTypes.SELECT,
            raw: true,
            logging: false,
        })
    ])

    return { count: parseInt(count), rows: results };
};


async function getUsersBattleStats(userIds, type) {
    const dateFilter = type === 'daily'
        ? 'CURRENT_DATE'
        : "CURRENT_DATE - INTERVAL '7 DAYS'";

    // const dailyCounts = await getDailyBattleCountsByUser(userIds);
    const usrStatsFromDb = await db.query(`
                SELECT
                    user_id,
                    COUNT(*) AS battles,
                    SUM(CASE WHEN battle_result = 'win' THEN 1 ELSE 0 END) AS wins,
                    SUM(CASE WHEN battle_result = 'lose' THEN 1 ELSE 0 END) AS losses,
                    SUM(CASE WHEN battle_result = 'draw' THEN 1 ELSE 0 END) AS draws,
                    COALESCE(SUM(gold_earned), 0) AS total_earned
                FROM rfm_battle_logs
                WHERE user_id IN (${userIds.join(',')}) AND created_at >= ${dateFilter}
                GROUP BY user_id
                `, {
        type: sequelize.QueryTypes.SELECT,
        raw: true
    });

    console.info(usrStatsFromDb);

    return usrStatsFromDb;

}


exports.getLeaderboarRedis = async (startIndex, endIndex, type) => {
    try {
        console.info('startIndex, endIndex, type', startIndex, endIndex, type);
        const scoreboard = await LBService.getLeaderboardV2(startIndex, endIndex, type);
        console.info('scoreboard', scoreboard);
        const totalUsers = await LBService.getLeaderboardCountV2(type);
        console.info('totalUsers', totalUsers);

        if (lodash.isEmpty(scoreboard)) {
            return { count: totalUsers, rows: [] };
        }

        const userIds = scoreboard.map(user => user.user_id);

        // We only need to fetch user names since stats now come from Redis
        const userNames = await users.findAll({
            where: { id: userIds, isDeleted: false, deletedAt: null },
            attributes: ['id', 'name', 'walletAddress', 'avatar', 'profilePicUrl'],
            raw: true
        });
console.info(userNames, "---userNames---1189")
        const userDetails = scoreboard.map(user => {
            const {
                user_id,
                score,
                userRank,
                wins,
                losses,
                gamesPlayed,
                winRatio
            } = user;
console.info(user, "---user---1200")
            const ud = userNames.find(u => u.id === Number(user_id));
console.info(ud, "---ud---1202")
            return {
                user_id,
                name: (ud && ud.name) ? ud.name : ud?.walletAddress?.slice(0, 6) || `GUEST_${user_id}`,
                avatar: ud && ud.avatar ? ud.avatar : null,
                profilePicUrl: ud && ud.profilePicUrl ? ud.profilePicUrl : null,
                rank: userRank,
                score: score,
                battles: gamesPlayed,
                wins,
                losses,
                winRatio: (winRatio * 100).toFixed(2) + '%' // Format as percentage
            };
        });

        return { count: totalUsers, rows: userDetails };
    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error('Failed to get leaderboard:', error);
        throw error;
    }
};


exports.setGamePlayerConfigData = async (data) => {
    let resp = await rfm_player_config.findOne();

    if (!resp) {
        return await rfm_player_config.create(data);
    } else {
        return await rfm_player_config.update({ ...data }, { where: { id: resp.id } });
    }
}

exports.getGamePlayerConfigData = async () => {
    return await rfm_player_config.findOne();
}