//@ts-check
const sequelize = require('sequelize');

const models = require('../models');

const battles = models.battles;
const userLeagues = models.userLeagues;
const battleHistories = models.battle_logs;
const users = models.users;
const user_money = models.user_money;
const battleRewardLogs = models.user_battle_reward_logs;

const { Op, fn, col, literal } = require('sequelize');
const lodash = require('lodash');
const { UserInputError } = require('../utils/classes');

const LBService = require('./leaderboard.service');
const userPostWorkSvc = require('./users.postwork.service');
const db = require('../database/database');


exports.startNewBattle = async (battleData, participation_fee) => {
    try {

        const { hunterIds, runnerIds, roomId, } = battleData;

        if (lodash.isEmpty(hunterIds) || lodash.isEmpty(runnerIds)) {
            throw new UserInputError('Hunter and Runner ids are required');
        }

        //* check if any user is in battle
        const usersInBattle = await getUsersInBattle([...hunterIds, ...runnerIds]);
        //* if any user is in battle, return error with their ids
        if (!lodash.isEmpty(usersInBattle)) {
            const inBattleIds = usersInBattle.map(user => user.userId);
            throw new UserInputError(`User(s) ${inBattleIds.join(', ')} is/are already in battle`);
        }

        //* deduct participation fee from users
        const deducts = await deductParticipationFeeFromUsers([...hunterIds, ...runnerIds], participation_fee);
        console.log('deducts', deducts);


        //* create new battle
        const newBattle = await createNewBattleRecord({ hunterIds, runnerIds, roomId, participation_fee });
        console.log('newBattle', newBattle);

        //* set all users state to playing
        const setUsersPlaying = await setUsersPlayingState([...hunterIds, ...runnerIds], true);
        // console.log('setUsersPlaying', setUsersPlaying);

        await checkUserExistsInLeaderboard([...hunterIds, ...runnerIds]);

        //* return new battle
        return newBattle;
    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error(error, '\n  Failed to start new battle');
        const { hunterIds, runnerIds, roomId, } = battleData;
        if (!(error instanceof UserInputError)) {
            //* if any error occurs, rollback all changes
            await rollbackBattle([...hunterIds, ...runnerIds], participation_fee);
        }

        throw error;
    }

}

// Example Input
const duelData = {
    duel_id: 1,
    winning_team: 'hunter',
    hunter_data: [
        { user_id: 1, caught_runners: [6, 9] },
        { user_id: 2, caught_runners: [7, 10] },
        { user_id: 3, caught_runners: [8] },
        { user_id: 4, caught_runners: [] },
        { user_id: 5, caught_runners: [] },
    ],
    runner_data: [
        { user_id: 6, is_caught: true, time_survived: 60 },
        { user_id: 7, is_caught: true, time_survived: 150 },
        { user_id: 8, is_caught: true, time_survived: 200 },
        { user_id: 9, is_caught: true, time_survived: 250 },
        { user_id: 10, is_caught: true, time_survived: 290 },
    ],
};

exports.endBattle = async (battleId, results) => {
    let battleData;
    try {
        const { winning_team, hunter_data, runner_data } = results;
        //* fetch existing battle data
        const battle = await battles.findOne({ where: { id: battleId }, raw: true });
        if (!battle) throw new UserInputError('Battle not found');
        battleData = battle;
        if (battle.has_ended) throw new UserInputError('Battle has already ended');

        //* check if hunterIds and runnerIds data are correct in input results
        let hunterIds = battle.hunter_ids;
        let runnerIds = battle.runner_ids;
        const hunterIdsInResults = hunter_data.map(hunter => hunter.user_id);
        const runnerIdsInResults = runner_data.map(runner => runner.user_id);
        const missingHunterIds = lodash.differenceBy(hunterIdsInResults, hunterIds);
        const missingRunnerIds = lodash.differenceBy(runnerIdsInResults, runnerIds);
        if (missingHunterIds.length > 0) {
            console.log('Hunter ids in results do not match with start battle data');
            // fetch the mising IDs and check the battle log if he has quit for this battle_id
            const battleRecords = await battleHistories.findAll({ where: { user_id: { [Op.in]: lodash.differenceBy(hunterIds, hunterIdsInResults) }, battle_id: battleId, force_quit: true }, raw: true });
            if (battleRecords.length !== missingHunterIds.length) {
                console.log('Some hunters have quit the battle');
                hunterIds = hunterIdsInResults;
            } else {
                throw new UserInputError('Hunter ids in results do not match with start battle data');
            }
        }
        if (missingRunnerIds.length > 0) {
            console.log('Runner ids in results do not match with start battle data');
            // fetch the mising IDs and check the battle log if he has quit for this battle_id
            const battleRecords = await battleHistories.findAll({ where: { user_id: { [Op.in]: lodash.differenceBy(runnerIds, runnerIdsInResults) }, battle_id: battleId, force_quit: true }, raw: true });
            if (battleRecords.length !== missingRunnerIds.length) {
                console.log('Some runners have quit the battle');
                runnerIds = runnerIdsInResults;
            } else {
                throw new UserInputError('Runner ids in results do not match with start battle data');
            }
        }

        //* calculate battle rewards
        const battleRewardsData = calculateBattleGoldRewards(results, battle.participation_fee_each);
        console.log('battleRewardsData', battleRewardsData);


        const userNames = await users.findAll({
            where: { id: [...hunterIds, ...runnerIds] },
            attributes: ['id', 'name', 'walletAddress'],
            raw: true
        });

        // //* create battle history of all users in bulk
        // add survival_time in battleRewardsData.runners data array
        // battleRewardsData.runners = battleRewardsData.runners.map((runner, index) => {
        for (const runner of battleRewardsData.runners) {
            //@ts-ignore
            runner.survival_time = runner_data.find(r => r.user_id === runner.user_id).time_survived;
            //@ts-ignore
            runner.playerName = userNames.find(u => u.id === runner.user_id).name;
            //@ts-ignore
            if (!runner.playerName) {
                // assign 6 first chars of wallet address as name
                //@ts-ignore
                runner.playerName = userNames.find(u => u.id === runner.user_id).walletAddress.slice(0, 6);
            }

            // return runner;
        };

        // add caught_runners count in battleRewardsData.hunters data array
        // battleRewardsData.hunters = battleRewardsData.hunters.map((hunter, index) => {
        for (const hunter of battleRewardsData.hunters) {
            //@ts-ignore
            hunter.caught_runners = hunter_data.find(h => h.user_id === hunter.user_id).caught_runners.length;
            //@ts-ignore
            hunter.playerName = userNames.find(u => u.id === hunter.user_id).name;
            //@ts-ignore
            if (!hunter.playerName) {
                // assign 6 first chars of wallet address as name
                //@ts-ignore
                hunter.playerName = userNames.find(u => u.id === hunter.user_id).walletAddress.slice(0, 6);
            }
            // return hunter;
        };

        // //* update battle record
        // const updatedBattle = await battles.update({
        //     winning_team,
        //     has_ended: true,
        //     results: { inputData: results, battleRewardsData: battleRewardsData },
        //     end_date: new Date(),
        //     total_reward: battleRewardsData.finalTotalRewards,
        // }, { where: { id: battleId }, returning: true });

        // console.log('updatedBattle', updatedBattle[0]);

        /**  
         * POSTWORK SECTION STARTS HERE
         * THESE FUNCTION CALLS CAN BE MADE ASYNC */
        await setUsersPlayingState([...hunterIds, ...runnerIds], false);

        await updateUsersLeaderboard([...battleRewardsData.hunters, ...battleRewardsData.runners]);

        await rewardUserFor3GamePlays([...hunterIds, ...runnerIds], battleId);

        //* reward users
        const rewards = await rewardBattleGoldToUsers(winning_team, battleRewardsData);

        //* reward users for participation
        const PARTIFICATION_BONUS = process.env.PARTIFICATION_BONUS || 80000;
        const rewards2 = await rewardParticipationGoldToUsers([...hunterIds, ...runnerIds], PARTIFICATION_BONUS);
        console.log('rewards', rewards2[1]);


        let aiPlayerIds = await users.findAll({ where: { role: 5, id: [...hunterIds, ...runnerIds] }, attributes: ['id'], raw: true });
        aiPlayerIds = aiPlayerIds.map(ai => ai.id);

        const combinedLogs = [
            ...hunter_data
                .filter(hunter => !aiPlayerIds.includes(hunter.user_id)) // Exclude AI players
                .map(hunter => ({
                    battle_id: battleId,
                    user_id: hunter.user_id,
                    role: 'hunter',
                    battle_result: winning_team === 'hunter' ? 'win' : 'lose',
                    caught_runners: hunter.caught_runners,
                    //@ts-ignore
                    gold_earned: battleRewardsData.hunters.find(h => h.user_id === hunter.user_id).personal_reward,
                    //@ts-ignore
                    team_reward: battleRewardsData.hunters.find(h => h.user_id === hunter.user_id).team_reward,
                    participation_fee_deducted: battle.participation_fee_each,
                })),
            ...runner_data
                .filter(runner => !aiPlayerIds.includes(runner.user_id)) // Exclude AI players
                .map(runner => ({
                    battle_id: battleId,
                    user_id: runner.user_id,
                    role: 'runner',
                    battle_result: winning_team === 'runner' ? 'win' : 'lose',
                    is_caught: runner.is_caught,
                    time_survived: runner.time_survived,
                    //@ts-ignore
                    gold_earned: battleRewardsData.runners.find(r => r.user_id === runner.user_id).personal_reward,
                    //@ts-ignore
                    team_reward: battleRewardsData.runners.find(r => r.user_id === runner.user_id).team_reward,
                    participation_fee_deducted: battle.participation_fee_each,
                }))
        ];

        const battleLogs = await battleHistories.bulkCreate(combinedLogs);
        console.log('battleLogs', battleLogs.length);

        //* reward gacha tickets after battle
        const gachaTicketRewards = await rewardGachaTicketsAfterBattle([...hunterIds, ...runnerIds], battleId);
        console.info('gachaTicketRewards', gachaTicketRewards);

        // Add gacha rewards to hunter and runner data
        // @ts-ignore
        battleRewardsData.hunters = battleRewardsData.hunters.map(hunter => ({
            // @ts-ignore
            ...hunter,
            // @ts-ignore
            gacha_reward: gachaTicketRewards[hunter.user_id] || null
        }));

        // @ts-ignore
        battleRewardsData.runners = battleRewardsData.runners.map(runner => ({
            // @ts-ignore
            ...runner,
            // @ts-ignore
            gacha_reward: gachaTicketRewards[runner.user_id] || null
        }));

        // Update battle record with complete results
        // @ts-ignore
        const updatedBattle = await battles.update({
            winning_team,
            has_ended: true,
            results: {
                inputData: results,
                battleRewardsData: battleRewardsData,
                gachaTicketRewards: gachaTicketRewards
            },
            end_date: new Date(),
            total_reward: battleRewardsData.finalTotalRewards,
        }, { where: { id: battleId }, returning: true });

        /**  POSTWORK SECTION ENDS HERE */

        return { hunter_rewards: battleRewardsData.hunters, runner_rewards: battleRewardsData.runners, winning_team, dualId: battleId };

    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error(error, '\n  Failed to end battle');

        if (!(error instanceof UserInputError)) {
            //* if any error occurs, rollback all changes
            await rollbackBattle([...battleData.hunter_ids, ...battleData.runner_ids], battleData.participation_fee_each);
        }

        throw error;
    }
}

const rewardGachaTicketsAfterBattle = async (userIds, battleId) => {
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



exports.getLeaderboards = async (startIndex, endIndex, type) => {
    try {
        // Correcting limit handling by calculating end index
        console.log('startIndex', startIndex, 'endIndex', endIndex, 'type', type);
        const scoreboard = await LBService.getLeaderboard(startIndex, endIndex, type);
        console.info(scoreboard)

        const totalUsers = await LBService.getLeaderboardCount(type);

        if (lodash.isEmpty(scoreboard)) {
            return { count: totalUsers, rows: [] };
        };

        const userIds = scoreboard.map(user => user.user_id);

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
        })

        // console.info('usrStatsFromDb', usrStatsFromDb);

        const userNames = await users.findAll({ where: { id: userIds }, attributes: ['id', 'name', 'walletAddress'], raw: true });

        const userDetails = scoreboard.map(user => {
            const { user_id, score, userRank } = user;
            const uBC = usrStatsFromDb.find(count => count.user_id === user_id);
            const ud = userNames.find(u => u.id === Number(user_id));
            return {
                user_id,
                name: ud.name ? ud.name : ud.walletAddress?.slice(0, 6) || `GUEST_${user_id}`,
                rank: userRank,
                score,
                battles: Number(uBC?.battles) || 0,
                wins: Number(uBC?.wins) || 0,
                losses: Number(uBC?.losses) || 0,
            };
        });


        return { count: totalUsers, rows: userDetails };
    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error('Failed to get leaderboard:', error);
        throw error;
    }
}


// Function to get daily battle counts for each user
const getDailyBattleCountsByUser = async (userIds) => {
    try {
        const dailyCounts = await battleHistories.findAll({
            attributes: [
                'user_id',
                [fn('DATE', col('created_at')), 'date'],
                [fn('COUNT', col('id')), 'count']
            ],
            where: {
                user_id: { [Op.in]: userIds },
                created_at: { [Op.gte]: new Date().setHours(0, 0, 0, 0) }
            },
            group: ['user_id', literal('DATE(created_at)')],
            raw: true
        });

        return dailyCounts;
    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error('Failed to get daily battle counts by user:', error);
        throw error;
    }
};

// Function to get weekly battle counts for each user
const getWeeklyBattleCountsByUser = async (userIds) => {
    try {
        const weeklyCounts = await battleHistories.findAll({
            attributes: [
                'user_id',
                [fn('DATE_TRUNC', 'week', col('created_at')), 'week'],
                [fn('COUNT', col('id')), 'count']
            ],
            where: { user_id: { [Op.in]: userIds } },
            group: ['user_id', literal('DATE_TRUNC(\'week\', created_at)')],
            raw: true
        });

        return weeklyCounts;
    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error('Failed to get weekly battle counts by user:', error);
        throw error;
    }
};

const updateUsersLeaderboard = async (rewardsData) => {
    try {
        const playerIds = rewardsData.map(player => player.user_id);
        const realPlayers = await getNonAiUsers(playerIds);

        for (const pid of realPlayers) {
            const player = rewardsData.find(p => p.user_id === pid.id);
            if (player) {
                await LBService.updateLeaderboard(player.user_id, player.personal_reward);
            } else {
                console.log('Player not found in rewardsData:', pid);
            }
            console.log('Leaderboard updated for player:=>> ', player.user_id, 'reward :', player.personal_reward);
        }

    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error(error)
    }
}




const getNonAiUsers = async (userIds) => {
    return await users.findAll({
        attributes: ['id', 'name', 'walletAddress'],
        where: {
            id: { [Op.in]: userIds },
            role: { [Op.not]: 5 }
        },
        raw: true,
    });
}

const checkUserExistsInLeaderboard = async (userIds) => {
    try {

        const realPlayers = await getNonAiUsers(userIds);
        const realPlayerIds = realPlayers.map(player => player.id);
        for (const userId of realPlayerIds) {
            //* check if user exists in leaderboard
            const userExistsInLB = await LBService.checkIfUserExistsInLB(userId);
            console.log('userExistsInLB', userExistsInLB);
            if (userExistsInLB[0] === null) {
                //* get users sum of earned gold for today from battle logs
                const userTodayGold = await battleHistories.sum('gold_earned', {
                    where: {
                        user_id: userId,
                        created_at: { [Op.gte]: new Date().setHours(0, 0, 0, 0) }
                    }
                });

                const userBattleLogsOfToday = await battleHistories.findAll({
                    where: { user_id: userId, created_at: { [Op.gte]: new Date().setHours(0, 0, 0, 0) } },
                    attributes: ['battle_result'],
                    raw: true
                });

                const wins = userBattleLogsOfToday.filter(log => log.battle_result === 'win').length;
                const losses = userBattleLogsOfToday.filter(log => log.battle_result === 'lose').length;

                //* add user to leaderboard daily
                // await LBService.addToLeaderboard(userId, userTodayGold || 0);
                await LBService.addToLeaderboardV2(userId);
            }

            if (userExistsInLB[1] === null) {
                //* get users sum of earned gold for this week from battle logs
                const userWeekGold = await battleHistories.sum('gold_earned', {
                    where: {
                        user_id: userId,
                        created_at: { [Op.gte]: new Date().setHours(0, 0, 0, 0) }
                    }
                });

                // const userBattleLogsOfWeek = await 


                //* add user to leaderboard weekly
                // await LBService.addToLeaderboard(userId, userWeekGold || 0);
                await LBService.addToLeaderboardV2(userId);
            }

        }
    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error(error, '\n  Failed to check user exists in leaderboard');
        throw error;
    }
}


const rewardUserFor3GamePlays = async (playerIds, battleId) => {
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
        const rewardLogs = await battleRewardLogs.findAll({
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

        // Fetch all battle logs for these users for today
        const battleLogs = await battleHistories.findAll({
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

        // Find eligible users
        const eligibleUserIds = userIds.filter(userId =>
            !rewardedUserIds.has(userId) &&
            (userBattleCounts[userId] || 0) >= REWARD_COUNTER
        );

        if (eligibleUserIds.length === 0) {
            console.log('No users eligible for rewards');
            return [];
        }

        // Increment gold for eligible users in bulk
        await user_money.increment('gold', {
            by: REWARD_AMOUNT,
            where: { user_id: { [Op.in]: eligibleUserIds } }
        });

        // Create reward logs in bulk
        const newRewardLogs = eligibleUserIds.map(userId => ({
            user_id: userId,
            reward_type: '3WIN',
            reward_value: REWARD_AMOUNT,
            battle_id: battleId
        }));

        const createdRewardLogs = await battleRewardLogs.bulkCreate(newRewardLogs);

        console.log('Rewards successfully distributed');
        return createdRewardLogs;

    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        throw error;
    }
}

const rewardBattleGoldToUsers = async (winning_team, battleRewardsData) => {
    try {
        const { hunters, runners } = battleRewardsData;
        const winners = winning_team === 'hunter' ? hunters : runners;
        const results = [];
        for (const winner of winners) {
            const incr = await user_money.increment(['gold', 'alltime_gold'], {
                by: winner.total_reward,
                where: { user_id: winner.user_id },
                returning: true,
            });
            console.log(' user gold incremented with alltime gold', incr);
            results.push(incr);
        }

        return results;

    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error(error, '\n  Failed to reward battle gold to users');
        throw error;
    }
}

const calculateBattleGoldRewards = (duelData, participationFee) => {
    const { winning_team, hunter_data, runner_data } = duelData;

    // Calculate total reward

    // Winning team reward
    const teamReward = (participationFee / 2);

    // Initialize results
    const results = {
        hunters: [], runners: [],
        totalReward: participationFee * (hunter_data.length + runner_data.length),
        finalTotalRewards: 0
    };

    if (winning_team === 'hunter') {
        // Hunters win
        hunter_data.forEach((hunter) => {
            const caughtRunners = hunter.caught_runners.length;
            const personalReward = (participationFee / 2) * caughtRunners;

            const total_reward = teamReward + personalReward + participationFee;
            results.finalTotalRewards += total_reward;
            //@ts-ignore
            results.hunters.push({
                user_id: hunter.user_id,
                team: 'hunter',
                team_reward: teamReward,
                personal_reward: personalReward,
                own: participationFee,
                total_reward: total_reward,
            });
        });

        runner_data.forEach((runner) => {
            //@ts-ignore
            results.runners.push({
                user_id: runner.user_id,
                team: 'runner',
                team_reward: 0,
                personal_reward: 0,
                total_reward: 0,
            });
        });
    } else if (winning_team === 'runner') {
        // Runners win
        runner_data.forEach((runner) => {
            // const personalReward = runner.is_caught ? 0 : participationFee / 2;
            const personalReward = runner.is_caught ? 0 : runner.time_survived * 100;


            const total_reward = personalReward + teamReward + participationFee;
            results.finalTotalRewards += total_reward;
            //@ts-ignore
            results.runners.push({
                user_id: runner.user_id,
                team: 'runner',
                team_reward: teamReward,
                personal_reward: personalReward,
                own: participationFee,
                total_reward: total_reward,
            });
        });

        hunter_data.forEach((hunter) => {
            const personal_reward = hunter.caught_runners.length * participationFee / 2;
            const total_reward = personal_reward
            results.finalTotalRewards += total_reward;
            //@ts-ignore
            results.hunters.push({
                user_id: hunter.user_id,
                team: 'hunter',
                team_reward: 0,
                personal_reward: personal_reward,
                total_reward: total_reward,
            });
        });
    }

    return results;
};

const rollbackBattle = async (userIds, participation_fee) => {
    try {
        //* set all users state to not playing
        const setUsersPlaying = await setUsersPlayingState(userIds, false);
        console.log('setUsersPlaying', setUsersPlaying[1]);

        //* check users who had deductions
        let time20Secs = new Date(Date.now() - 5000);
        const userDeductions = await user_money.findAll({
            where: {
                user_id: userIds,
                updated_at: { [Op.gte]: time20Secs }
            }
        })

        //* if any user had deduction in last 20 seconds, give back their gold
        if (!lodash.isEmpty(userDeductions)) {
            console.log('Some users had deduction in last 5 seconds, returning their gold');
            const returns = await user_money.increment('gold', {
                by: participation_fee,
                where: {
                    user_id: userIds
                },
                returning: true,
            })
            // console.log('returns', returns);

        } else {
            console.log('No user had deduction in last 5 seconds, not retuning anything to anyone');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error(error, '\n  Failed to rollback battle start');
        throw error;
    }
}


const setUsersPlayingState = async (userIds, isPlaying) => {
    try {
        console.log('setUsersPlayingState', userIds, isPlaying);
        const userStates = await userLeagues.update(
            { is_playing: isPlaying },
            {
                where: { userId: { [Op.in]: userIds } },
                returning: true,
            }
        )
        console.log('userStates', userStates);

        const status = isPlaying ? 'playing' : 'notplaying';
        const updated = await users.update({ aiStatus: status }, {
            where: { id: { [Op.in]: userIds }, role: 5 },
            returning: true,
        });
        console.log('updated users playing status :', status, updated[0]);

        if (userStates[0] !== userIds.length) {
            let missingUserIds = lodash.difference(userIds, userStates[1].map(user => user.userId));
            console.log('Failed to set user state to playing. User Ids: ' + missingUserIds.join(', '));
        }

        return userStates;

    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error(error, '\n  Failed to set user state to playing');
        // throw error;
    }
}

const createNewBattleRecord = async ({ hunterIds, runnerIds, roomId, participation_fee }) => {
    return await battles.create({
        hunter_ids: hunterIds,
        runner_ids: runnerIds,
        room_id: roomId,
        participation_fee_each: participation_fee,
        total_participation_fee: (hunterIds.length + runnerIds.length) * participation_fee,
        start_date: new Date(),
    });
}

const getUsersInBattle = async (userIds) => {
    return await userLeagues.findAll({
        where: {
            userId: { [Op.in]: userIds },
            is_playing: true
        }
    });
}

const rewardParticipationGoldToUsers = async (userIds, gamePartBonus) => {
    try {
        const userMoney = await user_money.findAll({
            where: {
                user_id: { [Op.in]: userIds }
            },
            raw: true,
        });

        if (userMoney.length !== userIds.length) {
            let missingUserIds = lodash.difference(userIds, userMoney.map(user => user.user_id));
            console.log('One or more users does not have money details. User Ids: ' + missingUserIds.join(', '));
            // create money record for missing users
            for (const missingUserId of missingUserIds) {
                await user_money.findOrCreate({
                    where: { user_id: missingUserId },
                    defaults: { gold: 60000 }
                });
            }
        }

        let rewards = await user_money.increment('gold', {
            by: gamePartBonus,
            where: {
                user_id: { [Op.in]: userIds }
            },
            returning: true,
        });
        rewards = rewards[0];      // bcz sequelize returns array of array

        if (rewards[1] !== userIds.length) {
            let missingUserIds = lodash.difference(userIds, rewards[0].map(user => user.user_id));
            throw new Error('Failed to reward participation fee to users. User Ids: ' + missingUserIds.join(', '));
        }

        return rewards;

    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error(error, '\n  Failed to reward participation fee to users');
        throw error;
    }
}

const deductParticipationFeeFromUsers = async (userIds, participation_fee) => {
    try {
        const userMoney = await user_money.findAll({
            where: {
                user_id: { [Op.in]: userIds }
            },
            raw: true,
        });

        if (userMoney.length !== userIds.length) {
            let missingUserIds = lodash.difference(userIds, userMoney.map(user => user.user_id));
            console.log('One or more users does not have money details. User Ids: ' + missingUserIds.join(', '));
            // create money record for missing users
            for (const missingUserId of missingUserIds) {
                await userPostWorkSvc.giveBonusMoneyOnRegistration(missingUserId, 60000);
            }
        }

        // Check User Balances
        const usersWithInsufficientBalance = userMoney.filter(user => user.gold < participation_fee);
        if (usersWithInsufficientBalance.length > 0) {
            const insufficientUsers = usersWithInsufficientBalance.map(user => ({
                user_id: user.user_id,
                gold: user.gold
            }));
            console.info('Insufficient balance for some users:', insufficientUsers);
            console.info('participation_fee:', participation_fee);
            throw new UserInputError(`Insufficient balance for some users  ==>>  ${insufficientUsers.map(e => e.user_id)}`, 400);
        }

        let deductions = await user_money.decrement('gold',
            {
                by: participation_fee,
                where: {
                    user_id: {
                        [Op.in]: userIds
                    }
                },
                returning: true,
            }
        );

        deductions = deductions[0];      // bcz sequelize returns array of array [[[rows], count], shit]

        if (deductions[1] !== userIds.length) {
            console.log(deductions)
            let missingUserIds = lodash.difference(userIds, deductions[0].map(user => user.user_id));
            throw new Error('Failed to deduct participation fee from users. User Ids: ' + missingUserIds.join(', '));
        }

        return deductions;

    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error(error, '\n  Failed to deduct participation fee from users');
        throw error;
    }

}

exports.isUserInOngoingBattle = async (userId) => {
    try {
        let ongoingBattles = await battles.findAll({
            where: {
                [Op.or]: [
                    { hunter_ids: { [Op.overlap]: [userId] } },
                    { runner_ids: { [Op.overlap]: [userId] } }
                ],
                has_ended: false,
                end_date: null
            }
        });
        // console.info(ongoingBattles)
        return ongoingBattles.length > 0;
    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error('Error checking ongoing battles:', error);
        throw error;
    }
};


exports.quitUserFromBattle = async (userId) => {
    try {
        let ongoingBattles = await battles.findOne({
            where: {
                [Op.or]: [
                    { hunter_ids: { [Op.overlap]: [userId] } },
                    { runner_ids: { [Op.overlap]: [userId] } }
                ],
                has_ended: false,
                end_date: null
            }
        });
console.info('ongoingBattles', ongoingBattles);
        if (!ongoingBattles) {
            // throw new UserInputError('User is not in any ongoing battle');
            return null;
        }

        // set is_playing to false
        let userLeaguesUpdate = await userLeagues.update({ is_playing: false }, {
            where: { userId: userId }
        });
console.info('userLeaguesUpdate', userLeaguesUpdate);
        // set user status to not playing
        let userUpdate = await users.update({ aiStatus: 'notplaying' }, {
            where: { id: userId, }
        });
console.info('userUpdate', userUpdate);
        // determine users role in battle
        let role = ongoingBattles.hunter_ids.includes(userId) ? 'hunter' : 'runner';

        // create battle history
        let battleHistory = await battleHistories.create({
            battle_id: ongoingBattles.id,
            user_id: userId,
            role: role,
            force_quit: true,
        });

        // remove users id from battle
        let updatedBattle;
        if (role === 'hunter') {
            updatedBattle = await battles.update({
                hunter_ids: sequelize.fn('array_remove', sequelize.col('hunter_ids'), userId)
            }, {
                where: { id: ongoingBattles.id },
                returning: true
            });
        } else {
            updatedBattle = await battles.update({
                runner_ids: sequelize.fn('array_remove', sequelize.col('runner_ids'), userId)
            }, {
                where: { id: ongoingBattles.id },
                returning: true
            });
        }

        return battleHistory;

    } catch (error) {
        console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
        console.error('Error quitting user from battle:', error);
        throw error;
    }
}


