//@ts-check
const battleService = require('../services/battle.service.js');
const seasonService = require('../services/season.service.js');
const usersService = require('../services/users.service.js');
const { UserInputError } = require('../utils/classes.js');
const battle_utils = require('../utils/battleUtilities.js');
const aiUserService = require('../services/aiUser.service.js');
const { isEmpty } = require('../utils/index.js');
const { default: axios } = require('axios');

const systemFeeFactor = 0;    // factor for deduction: 0 for 0%; 0.1 for 10% & so-on

const svcV2 = require('../services/battle.v2.service.js');
const svcV3 = require('../services/battleV3.service.js');
const leaderboardService = require('../services/leaderboard.service.js');

/**
 * @api {post} /battle/start-new-battle   Start New Battle
 * @apiName Start New Battle
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiBody {Array}  hunterId  array of id of players in team 1 `Mandatory`.
 * @apiBody {Array}  runnerId  array of id of players in team 2 `Mandatory`.
 * @apiBody {NUmber}  seasonId  seasonId if any.
 * @apiDescription  Battle Service..
 */
module.exports.startNewBattle = async (req, res) => {
  try {
    console.info(req.body, "---req.body---24")
    let hunterIds = req.body.hunterId.filter(dt => dt !== 0);
    let runnerIds = req.body.runnerId.filter(dt => dt !== 0);
    console.info(hunterIds, runnerIds, "---hunterIds, runnerIds---26")
    let playerList = await battleService.checkBattleStatus(hunterIds, runnerIds)
    console.info(playerList, "---playerList----28")
    if (playerList && playerList.length) {
      return res.status(200).json({ success: false, data: { playerIds: playerList }, msg: 'Some users are already in a battle' });
    } else {
      let playerArr = [...hunterIds, ...runnerIds];
      for (let i = 0; i < playerArr.length; i++) {
        const userDetails = await usersService.getSingleUserDetails(playerArr[i]);
        if (userDetails && !userDetails.userLeagues && !userDetails.userLeagues[0]) {
          await battleService.createUserLeague({ userId: playerArr[i], leagueId: 1 })
          await battleService.rewardGoldForUser(playerArr[i], 0)
        }
        let userLeagueId = userDetails?.userLeagues[0]?.leagueId ? userDetails?.userLeagues[0]?.leagueId : 1;
        let leagueInfo = await battleService.getLeagueDetailsById(userLeagueId);
        console.info(leagueInfo, "---leagueInfo---46")
        if (userLeagueId !== 1) {
          console.info(userDetails.userXetaBalances, "---userDetails.userXetaBalances---42")
          if (userDetails.userXetaBalances && (userDetails.userXetaBalances[0].balance < leagueInfo.fuelConsumption)) {
            return res.status(200).json({ success: false, data: {}, msg: `User ${userDetails.name} : ${userDetails.id} has insufficient balance` });
          }
          let deductGoldRes = await battleService.deductGoldFromUser(playerArr[i], leagueInfo.fuelConsumption)
          console.info(deductGoldRes, "---deductGoldRes---48")
        }
      }

      let db_payload = {
        hunterId: hunterIds,
        runnerId: runnerIds,
        roomId: req.body.roomId,
        // leagueId: req.body.leagueId,
        seasonId: req.body.seasonId || null,
        duelStartDate: new Date()
      }

      let battleRes = await battleService.createNewBattle(db_payload)
      return res.status(200).json({ success: true, data: battleRes, msg: 'New User Battle Created' });
    }
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error(error)

    let hunterIds = req.body.hunterId;
    let runnerIds = req.body.runnerId;
    console.info(hunterIds, runnerIds, "---hunterIds, runnerIds---26")
    let playerArr = [...hunterIds, ...runnerIds];
    for (let i = 0; i < playerArr.length; i++) {
      const userDetails = await usersService.getSingleUserDetails(playerArr[i]);
      let userLeagueId = userDetails?.userLeagues[0]?.leagueId ? userDetails?.userLeagues[0]?.leagueId : 1;
      let leagueInfo = await battleService.getLeagueDetailsById(userLeagueId);
      console.info(leagueInfo, "---leagueInfo---76")
      if (userLeagueId !== 1) {
        console.info(userDetails.userXetaBalances, "---userDetails.userXetaBalances---42")
        let isGoldDeduction = await battleService.checkDeductionIn20Secs(playerArr[i])
        if (isGoldDeduction) {
          let refundGoldRes = await battleService.refundGoldToUser(playerArr[i], leagueInfo.fuelConsumption)
          console.info(refundGoldRes, "---refundGoldRes---82")
        }
      }
    }

    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


/**
 * @api {post} /battle/end-user-battle  End User Battle
 * @apiName  End User Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiGroup Battle
 * @apiBody {Number} dualId duelId of team's battle
 * @apiBody {Array}  hunterId  array of id of players in team 1 `Mandatory`.
 * @apiBody {Array}  runnerId  array of id of players in team 2 `Mandatory`.
 * @apiBody {String=WIN,LOOSE} hunter_battleStatus battleStatus of users
 * @apiBody {String=WIN,LOOSE} runner_battleStatus battleStatus of opponents
 * @apiBody {String} runnerData  runner team game data
 * @apiBody {String} hunterData  hunter team game data
 * @apiBody {Boolean} [is_glitch=false] Bool status if duel has ended due to glitch
 * @apiDescription  This Api ends players Duel/battle and updates data on both blockchain and DB.
 */
exports.endUserBattle = async (req, res) => {
  try {
    const { dualId, hunter_battleStatus, runner_battleStatus, is_glitch = false } = req.body;

    let hunterId = req.body.hunterId.filter(dt => dt !== 0);
    let runnerId = req.body.runnerId.filter(dt => dt !== 0);

    let hunterData = req.body.hunterData.filter(dt => dt.userId !== 0);
    let runnerData = req.body.runnerData.filter(dt => dt.userId !== 0);

    // Fetch existing duel
    const duel_db = await usersService.getUserDualById(dualId);

    if (!duel_db) return res.status(400).json({ success: false, data: null, message: 'User duel has not started.' });
    if (duel_db.has_ended) return res.status(200).json({ success: false, data: null, message: 'User duel has already ended.' });

    // Validate player IDs in hunter and runner teams
    const validatePlayerIds = (dbIds, reqIds, teamName) => {
      dbIds.forEach(dt => {
        if (!reqIds.includes(dt)) {
          throw new Error(`Player ID mismatch in ${teamName}.`);
        }
      });
    };

    function validatePlayerData(playerIds, playerData, team) {
      playerIds.forEach(id => {
        const data = playerData.find(data => data.userId === id);
        if (!data) {
          throw new Error(` ${team} Data for player ID ${id} not found.`);
        }
      });
    }

    validatePlayerIds(duel_db.hunterId, hunterId, 'Hunters');
    validatePlayerIds(duel_db.runnerId, runnerId, 'Runners');

    validatePlayerData(hunterId, hunterData, 'Hunters');
    validatePlayerData(runnerId, runnerData, 'Runners');
    // Calculate total participation fee
    let totalParticipationFee = (runnerData.length + hunterData.length) * 100;  // per user fee is 100
    const eligiblePool = totalParticipationFee - (totalParticipationFee * systemFeeFactor);
    const winningTeamPool = eligiblePool * 0.3;
    const personalRewardPool = eligiblePool * 0.7;

    const duel_update_obj = {
      duelEndDate: new Date(), winnerId: 0, loserId: 0, is_draw: false, has_ended: true,
      fuel_win_percentage: 90, seasonId: null, fuel_won: eligiblePool  //eligiblePool after system fee deduction
    };

    // Determine win/lose/draw status
    if (hunter_battleStatus === runner_battleStatus) {
      throw new Error('Invalid battle status, can\'t be same.');
    }
    if (hunter_battleStatus === 'WIN' && runner_battleStatus === 'LOOSE') {
      duel_update_obj.winnerId = hunterId;
      duel_update_obj.loserId = runnerId;
    } else if (hunter_battleStatus === 'LOOSE' && runner_battleStatus === 'WIN') {
      duel_update_obj.winnerId = runnerId;
      duel_update_obj.loserId = hunterId;
    } else if (hunter_battleStatus === 'DRAW' && runner_battleStatus === 'DRAW') {
      duel_update_obj.is_draw = true;
    } else {
      console.info({ hunter_battleStatus, runner_battleStatus }, "---{ hunter_battleStatus, runner_battleStatus }---161");
    }

    // Get current season
    const curr_season = await seasonService.getCurrentSeason();
    if (curr_season) {
      duel_update_obj.seasonId = curr_season.seasonId;
    }

    //* Update AI players to not playing. dont worry, function will take care of it
    await aiUserService.updateAiUserPlayStatus({ aiStatus: 'notplaying' }, [...hunterId, ...runnerId]);

    //* Calculate rewards for each player
    const calculateReward = async (teamData, teamIds, isHunter, team_battleStatus) => {
      let allRewards = [];
      for (let i = 0; i < teamIds.length; i++) {
        const playerId = teamIds[i];
        const userDetails = await usersService.getSingleUserDetails(playerId);
        const playerData = teamData.find(dt => dt.userId === playerId);
        const username = (userDetails && userDetails.name) ? userDetails.name : (userDetails?.walletAddress?.length ? userDetails?.walletAddress.substring(0, 6) : '');
        // const username = (userDetails && userDetails.name) ? userDetails.name : (!isEmpty(userDetails?.walletAddress) ? userDetails?.walletAddress.substring(0, 6) : '');

        let reward = 0;
        if (userDetails && userDetails.userLeagues && userDetails.userLeagues[0]?.leagueId > 1) {
          (winningTeamPool / teamIds.length);
          if (isHunter) {
            if (team_battleStatus === 'WIN') {
              reward += (playerData.catches > 0) ? ((personalRewardPool / teamIds.length) * (playerData.catches) + (winningTeamPool / teamIds.length)) : (winningTeamPool / teamIds.length);
            }
          } else {
            if (team_battleStatus === 'WIN') {
              reward += playerData.isEscaped ? ((personalRewardPool / teamData.filter(dt => dt.isEscaped).length) + (winningTeamPool / teamIds.length)) : (winningTeamPool / teamIds.length);
            }
          }
        }
        allRewards.push({ playerId, reward: Math.max(reward, 0), playerName: username })
      }
      return allRewards;
    };

    const hunterRewards = await calculateReward(hunterData, hunterId, true, hunter_battleStatus);
    const runnerRewards = await calculateReward(runnerData, runnerId, false, runner_battleStatus);
    const allLeaguesName = await usersService.get_all_leagues_v2();

    const hunterGroup = await usersService.getMultiplayerData(hunterId);
    const runnerGroup = await usersService.getMultiplayerData(runnerId);

    //* Update players leagues and history
    for (let i = 0; i < hunterGroup.length; i++) {
      const player = hunterGroup[i];
      updatePlayerLeagueAndHistory(dualId, player, allLeaguesName, hunter_battleStatus, curr_season);
    }
    for (let i = 0; i < runnerGroup.length; i++) {
      const player = runnerGroup[i];
      updatePlayerLeagueAndHistory(dualId, player, allLeaguesName, runner_battleStatus, curr_season);
    }

    let rewardByIds = [...hunterRewards, ...runnerRewards];
    for (let i = 0; i < rewardByIds.length; i++) {
      const element = rewardByIds[i];
      const ulID = [...hunterGroup, ...runnerGroup].find(x => x.id === element.playerId).userLeagues[0]?.leagueId;
      if (ulID !== 1) {
        // @ts-ignore
        await battleService.rewardGoldForUser(element.playerId, element.reward)
      }
    }

    //* Update duel in database halfway
    await usersService.updateUserDual(duel_update_obj, dualId);

    // * update global rankings after battle.
    battle_utils.updateGlobalRankings_V2();

    res.status(200).json({
      success: true,
      data: { hunter_rewards: hunterRewards, runner_rewards: runnerRewards, dualId },
      message: 'User duel ended successfully'
    });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error('Error in ending user battle:', error);
    res.status(500).json({ success: false, data: null, message: error.message });
  }
};


/**
 * @api {post} /battle/start   Start New Battle V2
 * @apiName Start New BattleV2
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiBody {Array}  hunterIds  array of id of players in team 1 `Mandatory`.
 * @apiBody {Array}  runnerIds  array of id of players in team 2 `Mandatory`.
 * @apiBody {NUmber}  [roomId]  room ID if any.
 * @apiDescription  Battle Service..
 */
module.exports.startBattleV2 = async (req, res) => {
  try {
    const body = req.body;
    let leagueInfo = await battleService.getLeagueDetailsById(1);
    const participationFee = leagueInfo.fuelConsumption;
    const result = await svcV2.startNewBattle(body, participationFee);
    return res.status(200).json({ success: true, data: result, msg: 'New User Battle Created' });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
  }
}

/**
 * @api {post} /battle/v3/start   Start New Battle V3
 * @apiName Start New BattleV3
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiBody {Array}  hunterIds  array of id of players in team 1 `Mandatory`.
 * @apiBody {Array}  runnerIds  array of id of players in team 2 `Mandatory`.
 * @apiBody {NUmber}  [roomId]  room ID if any.
 * @apiDescription  Battle Service..
 */
module.exports.startBattleV3 = async (req, res) => {
  try {
    const body = req.body;
    let leagueInfo = await battleService.getLeagueDetailsById(1);
    const participationFee = leagueInfo.fuelConsumption;
    const result = await svcV3.startNewBattle(body, participationFee);
    return res.status(200).json({ success: true, data: result, msg: 'New User Battle Created' });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
  }
}




/**
 * @api {post} /battle/end End Battle V2
 * @apiName EndBattleV2
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiBody {Number} battleId The ID of the battle.
 * @apiBody {String='hunter','runner'} winning_team The winning team.
 * @apiBody {Array} hunter_data The hunter team game data.
 * @apiBody {Array} runner_data The runner team game data.
 * @apiDescription This API ends a battle and updates data on both blockchain and DB.
 * @apiExample {json} Request-Example:
 *  {
 *  battleId: 1,
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
 * }
 * @apiSuccess {Object} result The result of the battle.
 * @apiError UserInputError Invalid input data.
 * @apiError (500) InternalServerError Internal server error.
 */
exports.endBattleV2 = async (req, res) => {
  try {
    const { battleId, winning_team, hunter_data, runner_data } = req.body;
    const result = await svcV2.endBattle(battleId, { winning_team, hunter_data, runner_data });
    return res.status(200).json({ success: true, data: result, msg: 'Battle ended successfully' });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error('Error in ending battle:', error);
    if (error instanceof UserInputError) {
      return res.status(400).json({ success: false, data: null, msg: error.message });
    }
    return res.status(500).json({ success: false, data: null, msg: 'Internal server error' });
  }
};


/**
 * @api {post} /battle/v3/end End Battle V3
 * @apiName EndBattleV3
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiBody {Number} battleId The ID of the battle.
 * @apiBody {String='hunter','runner'} winning_team The winning team.
 * @apiBody {Array} hunter_data The hunter team game data.
 * @apiBody {Array} runner_data The runner team game data.
 * @apiDescription This API ends a battle and updates data on both blockchain and DB.
 * @apiExample {json} Request-Example:
 *  {
 *  battleId: 1,
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
 * }
 * @apiSuccess {Object} result The result of the battle.
 * @apiError UserInputError Invalid input data.
 * @apiError (500) InternalServerError Internal server error.
 */
exports.endBattleV3 = async (req, res) => {
  try {
    const { battleId, winning_team, hunter_data, runner_data } = req.body;
    const result = await svcV3.endBattle(battleId, { winning_team, hunter_data, runner_data });
    return res.status(200).json({ success: true, data: result, msg: 'Battle ended successfully' });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error('Error in ending battle:', error);
    if (error instanceof UserInputError) {
      return res.status(400).json({ success: false, data: null, msg: error.message });
    }
    return res.status(500).json({ success: false, data: null, msg: 'Internal server error' });
  }
};

/**
 * @api {get} /battle/leaderboard  Get Leaderboard
 * @apiName GetLeaderboard
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String='daily','weekly'} type The type of leaderboard.
 * @apiParam {Number} page The page number.
 * @apiParam {Number} limit The number of items per page.
 * @apiDescription This API fetches the leaderboard.
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const { type, page, limit } = req.query;
    console.info(type, page, limit, "---type, page, limit---");
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = Number(page) * Number(limit) - 1;
    console.info(startIndex, endIndex, "---startIndex, endIndex---");
    const result = await svcV3.getLeaderboarRedis(startIndex, endIndex, type);
    return res.status(200).json({ success: true, data: result, msg: 'Leaderboard fetched successfully' });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error('Error in fetching leaderboard:', error);
    return res.status(500).json({ success: false, data: null, msg: 'Internal server error' });
  }
};


async function updatePlayerLeagueAndHistory(duelId, player, allLeaguesData, battleStatus, curr_season) {
  if (!player) {
    throw new Error('User not found');
  }

  let new_league = {}
  const getPlayerLeagueId = async (rating) => {
    let leagueId = 1;
    allLeaguesData.map(dt => {
      if ((rating >= dt['leaguesDetail.min']) && (rating <= dt['leaguesDetail.max'])) {
        leagueId = dt.id
        new_league = dt;
      }
    })
    return leagueId
  }
  const {
    leagueId: oldLeagueId = player.userLeagues[0].id,
    rating,
    battles,
    wins,
    loose,
    draw,
    maxStreak
  } = player.userLeagues[0] || {};

  const currentLeague = allLeaguesData.find(league => league.id === player.userLeagues[0].leagueId) || allLeaguesData[0];
  let playerBattleData = {
    leagueId: await getPlayerLeagueId(rating),
    leagueName: new_league.name,
    leaguePoint: new_league['leaguesDetail.defaultPoint'],
    leagueMinLP: new_league['leaguesDetail.min'],
    rating,
    battles,
    wins,
    loose,
    draw,
    maxStreak,
    battle_result: battleStatus,
    rewards: battleStatus === 'WIN' ? player.userLeagues[0].rewards : 0,
  };

  // Calculate LP and streak bonus
  let new_p_data = await battle_utils.calculateLPandStreakBonus_v2(playerBattleData, battleStatus);

  // Create new player league data object
  let newPlayerLeagueData = await battle_utils.createNewObj(
    new_p_data.leagueId,
    new_p_data.rating,
    new_p_data.battles,
    new_p_data.wins,
    new_p_data.maxStreak,
    new_p_data.rewards,
    new_p_data.loose,
    new_p_data.draw,
    player.id
  );

  if (curr_season) { newPlayerLeagueData.seasonId = curr_season.seasonId; }

  // Update player league data
  await usersService.updateUserLeague(playerBattleData, player.id);
  await battleService.updateUserBattleExp(playerBattleData.battle_result, player.id)

  // Determine league ID based on LP
  let leagueByLP = (player?.role === 5) ? { leagueId: oldLeagueId } : await battleService.getLeagueDetailByRating(playerBattleData.rating);
  playerBattleData.leagueId = (!curr_season || leagueByLP?.leagueId <= oldLeagueId) ? oldLeagueId : leagueByLP.leagueId;

  // Add duel history
  await battle_utils.addUserDuelHistory(player.id, duelId, battleStatus, curr_season ? curr_season.seasonId : null, player.name);

  return playerBattleData;
}



exports.forcefullyEndBattle = async (duelData) => {
  try {
    const { dualId, hunter_battleStatus, runner_battleStatus, is_glitch = false } = duelData;

    let hunterId = duelData.hunterId.filter(dt => dt !== 0);
    let runnerId = duelData.runnerId.filter(dt => dt !== 0);

    let hunterData = duelData.hunterData.filter(dt => dt.userId !== 0);
    let runnerData = duelData.runnerData.filter(dt => dt.userId !== 0);

    // Fetch existing duel
    const duel_db = await usersService.getUserDualById(dualId);
    console.info(duel_db, "---  fetching existing duel ---308");
    if (duel_db.has_ended) return { success: false, data: null, message: 'User duel has already ended.' };

    // Validate player IDs in hunter and runner teams
    const validatePlayerIds = (dbIds, reqIds, teamName) => {
      dbIds.forEach(dt => {
        if (!reqIds.includes(dt)) {
          throw new Error(`Player ID mismatch in ${teamName}.`);
        }
      });
    };

    function validatePlayerData(playerIds, playerData, team) {
      playerIds.forEach(id => {
        const data = playerData.find(data => data.userId === id);
        if (!data) {
          throw new Error(` ${team} Data for player ID ${id} not found.`);
        }
      });
    }

    validatePlayerIds(duel_db.hunterId, hunterId, 'Hunters');
    validatePlayerIds(duel_db.runnerId, runnerId, 'Runners');

    validatePlayerData(hunterId, hunterData, 'Hunters');
    validatePlayerData(runnerId, runnerData, 'Runners');
    // Calculate total participation fee
    let totalParticipationFee = (runnerData.length + hunterData.length) * 100;  // per user fee is 100
    const eligiblePool = totalParticipationFee - (totalParticipationFee * systemFeeFactor);
    const winningTeamPool = eligiblePool * 0.3;
    const personalRewardPool = eligiblePool * 0.7;

    const duel_update_obj = {
      duelEndDate: new Date(), winnerId: [null], loserId: [null], is_draw: false, has_ended: true,
      fuel_win_percentage: 90, seasonId: null, fuel_won: eligiblePool  //eligiblePool after system fee deduction
    };

    // Determine win/lose/draw status
    if ((hunter_battleStatus === 'WIN' && runner_battleStatus === 'WIN') || (hunter_battleStatus === 'LOOSE' && runner_battleStatus === 'LOOSE')) {
      throw new Error('Invalid battle status, can\'t be same.');
    }
    if (hunter_battleStatus === 'WIN' && runner_battleStatus === 'LOOSE') {
      duel_update_obj.winnerId = hunterId;
      duel_update_obj.loserId = runnerId;
    } else if (hunter_battleStatus === 'LOOSE' && runner_battleStatus === 'WIN') {
      duel_update_obj.winnerId = runnerId;
      duel_update_obj.loserId = hunterId;
    } else if (hunter_battleStatus === 'DRAW' && runner_battleStatus === 'DRAW') {
      duel_update_obj.is_draw = true;
    } else {
      console.info({ hunter_battleStatus, runner_battleStatus }, "---{ hunter_battleStatus, runner_battleStatus }---370");
    }

    // Get current season
    const curr_season = await seasonService.getCurrentSeason();
    if (curr_season) {
      duel_update_obj.seasonId = curr_season.seasonId;
    }

    //* Update AI players to not playing. dont worry, function will take care of it
    await aiUserService.updateAiUserPlayStatus({ aiStatus: 'notplaying' }, [...hunterId, ...runnerId]);

    //* Calculate rewards for each player
    const calculateReward = async (teamData, teamIds, isHunter, team_battleStatus) => {
      let allRewards = [];
      for (let i = 0; i < teamIds.length; i++) {
        const playerId = teamIds[i];
        const userDetails = await usersService.getSingleUserDetails(playerId);
        const playerData = teamData.find(dt => dt.userId === playerId);
        const username = (userDetails && userDetails.name) ? userDetails.name : (userDetails?.walletAddress?.length ? userDetails?.walletAddress.substring(0, 6) : '');
        // const username = (userDetails && userDetails.name) ? userDetails.name : (!isEmpty(userDetails?.walletAddress) ? userDetails?.walletAddress.substring(0, 6) : '');

        let reward = 0;
        if (userDetails && userDetails.userLeagues && userDetails.userLeagues[0]?.leagueId > 1) {
          (winningTeamPool / teamIds.length);
          if (isHunter) {
            if (team_battleStatus === 'WIN') {
              reward += (playerData.catches > 0) ? ((personalRewardPool / teamIds.length) * (playerData.catches) + (winningTeamPool / teamIds.length)) : (winningTeamPool / teamIds.length);
            }
          } else {
            if (team_battleStatus === 'WIN') {
              reward += playerData.isEscaped ? ((personalRewardPool / teamData.filter(dt => dt.isEscaped).length) + (winningTeamPool / teamIds.length)) : (winningTeamPool / teamIds.length);
            }
          }
        }
        allRewards.push({ playerId, reward: Math.max(reward, 0), playerName: username })
      }
      return allRewards;
    };

    const hunterRewards = await calculateReward(hunterData, hunterId, true, hunter_battleStatus);
    const runnerRewards = await calculateReward(runnerData, runnerId, false, runner_battleStatus);
    const allLeaguesName = await usersService.get_all_leagues_v2();

    const hunterGroup = await usersService.getMultiplayerData(hunterId);
    const runnerGroup = await usersService.getMultiplayerData(runnerId);

    //* Update players leagues and history
    for (let i = 0; i < hunterGroup.length; i++) {
      const player = hunterGroup[i];
      updatePlayerLeagueAndHistory(dualId, player, allLeaguesName, hunter_battleStatus, curr_season);
    }
    for (let i = 0; i < runnerGroup.length; i++) {
      const player = runnerGroup[i];
      updatePlayerLeagueAndHistory(dualId, player, allLeaguesName, runner_battleStatus, curr_season);
    }

    let rewardByIds = [...hunterRewards, ...runnerRewards];
    for (let i = 0; i < rewardByIds.length; i++) {
      const element = rewardByIds[i];
      if (element.playerId > 0) {
        const ulID = [...hunterGroup, ...runnerGroup].find(x => x.id === element.playerId)?.userLeagues[0]?.leagueId;
        if (ulID !== 1) {
          // @ts-ignore
          await battleService.rewardGoldForUser(element.playerId, element.reward)
        }
      }
    }

    //* Update duel in database halfway
    await usersService.updateUserDual(duel_update_obj, dualId);

    // * update global rankings after battle.
    battle_utils.updateGlobalRankings_V2();

    return {
      success: true,
      data: { hunter_rewards: hunterRewards, runner_rewards: runnerRewards, dualId },
      message: 'User duel ended successfully'
    };
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error('Error in ending user battle:', error);
    return { success: false, data: null, message: error.message };
  }
};


/**
 * @api {post} /battle/user-battle-quit   User Quit From Battle
 * @apiName  User Quit From Battle
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiBody {Number} userId  id of user to be removed from battle
 * @apiDescription  Battle Service..
 */
module.exports.removeUserFromBattle = async (req, res) => {
  try {
    let userId = req.body.userId;
    let userLatestBattle = await battleService.getUserLatestRunningBattles(userId);
    let battleRes = await battleService.checkRemoveUserInBattles(userId);

    let userLeagueRes = await battleService.findUserLeague(userId)
    console.info(userLeagueRes, userLeagueRes.battles, "---userLeagueRes---469")
    if (userLeagueRes) {
      // await battleService.updateUserLeague({ battles: userLeagueRes.battles + 1, loose: userLeagueRes.loose + 1 }, userId)

      const allLeaguesName = await usersService.get_all_leagues_v2();
      const playerGroup = await usersService.getMultiplayerData([userId]);
      const player = playerGroup[0];
      const curr_season = await seasonService.getCurrentSeason();
      updatePlayerLeagueAndHistory(userLatestBattle.id, player, allLeaguesName, 'LOOSE', curr_season);
    }

    if (battleRes) {
      return res.status(200).json({ success: true, data: {}, msg: 'Given user removed from battle' });
    } else {
      return res.status(200).json({ success: false, data: {}, msg: 'Given user not found in battle' });
    }
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


/**
 * @api {post} /battle/create-dummy-user   Create Dummy User for Battle
 * @apiName  Create Dummy User for Battle
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiBody {String} leagueName  league name
 * @apiBody {String} latencyRegion  latency region
 * @apiBody {Number} latencyCount  latency count in given region
 * @apiBody {String} queueName  queue name
 * @apiBody {String} titleId  Title ID
 * @apiBody {Number} giveUpAfterSeconds  Give up time in seconds
 * @apiDescription  Battle Service..
 */
module.exports.createPlayFabDummyUser = async (req, res) => {
  let api_payload = req.body;
  try {
    let final_resp = await makePlayFabRequest(api_payload);

    if (final_resp.data.code === 429 && final_resp.data.status === "TooManyRequests") {
      setTimeout(async () => {
        final_resp = await makePlayFabRequest(api_payload);
      }, final_resp.data.retryAfterSeconds);
    }

    return res.status(200).json({ success: true, data: final_resp.data.data, msg: 'TicketID generated from PlayFab' });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};

async function makePlayFabRequest(api_payload) {
  const { leagueName, latencyRegion, latencyCount, queueName, titleId, giveUpAfterSeconds } = api_payload;
  console.info(api_payload, "---api_payload---492")
  //create play fab login
  let url_01 = `https://${titleId}.playfabapi.com/Client/LoginWithCustomID`
  let dummyPlayerName = "Test_" + new Date().getTime();
  let payload_01 = {
    "CustomId": dummyPlayerName,
    "CreateAccount": true,
    "TitleId": titleId
  }
  console.info(payload_01, "---payload---500")
  let dummyUserRes = await axios.post(url_01, payload_01)
  if (dummyUserRes.data.code === 429 && dummyUserRes.data.status === "TooManyRequests") {
    return dummyUserRes
  }
  let dummyResp = dummyUserRes.data.data;
  console.info(dummyResp, "---dummyResp---503")
  //create match making ticket
  let url_02 = `https://${titleId}.playfabapi.com/Match/CreateMatchmakingTicket`
  let payload_02 = {
    Creator: {
      Attributes: {
        DataObject: {
          LeagueName: leagueName,
          Latencies: [{
            region: latencyRegion,
            latency: latencyCount
          }],
          PlayerCount: 1
        },
        EscapedDataObject: null
      },
      Entity: {
        Id: dummyResp.EntityToken.Entity.Id,
        Type: dummyResp.EntityToken.Entity.Type
      }
    },
    CustomTags: null,
    GiveUpAfterSeconds: giveUpAfterSeconds,
    MembersToMatchWith: null,
    QueueName: queueName,
    AuthenticationContext: null
  }
  console.info(payload_02, "---payload_02---529")
  const headers = {
    "X-EntityToken": dummyResp.EntityToken.EntityToken
  }
  let matchMakeRes = await axios.post(url_02, payload_02, { headers: headers })
  console.info(matchMakeRes, "---matchMakeRes---534")
  return matchMakeRes
}


/**
 * @api {post} /battle/check-user-running-battle  Check User Running Battle
 * @apiName  Check User Running Battle
 * @apiGroup Battle
 * @apiBody {Number} userId  id of user to be removed from battle
 * @apiDescription  Battle Service..
 */
module.exports.checkUserBattleRunningState = async (req, res) => {
  try {
    let userId = req.body.userId;
    let battleRes = await battleService.checkUserRunningBattles(userId)

    if (battleRes) {
      return res.status(200).json({ success: true, data: { isBattleRunning: true }, msg: 'User is in a running battle' });
    } else {
      return res.status(200).json({ success: false, data: { isBattleRunning: false }, msg: 'User not found in battle' });
    }
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


/**
 * @api {post} /battle/v2/check-user-running-battle  Check User Running Battle V2
 * @apiName  Check User Running Battle V2
 * @apiGroup Battle
 * @apiBody {Number} userId  id of user to be removed from battle
 * @apiDescription  Battle Service..
 */
module.exports.checkUserBattleRunningStateV2 = async (req, res) => {
  try {
    let userId = req.body.userId;
    let battleRes = await svcV2.isUserInOngoingBattle(userId);

    if (battleRes) {
      return res.status(200).json({ success: true, data: { isBattleRunning: true }, msg: 'User is in a running battle' });
    } else {
      return res.status(200).json({ success: false, data: { isBattleRunning: false }, msg: 'User not found in battle' });
    }
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};



/**
 * @api {post} /battle/v2/user-battle-quit   User Quit From Battle V2
 * @apiName  User Quit From BattleV2
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiBody {Number} userId  id of user to be removed from battle
 * @apiDescription  Battle Service..
 */
module.exports.removeUserFromBattleV2 = async (req, res) => {
  try {
    const userId = req.body.userId;
    const result = await svcV2.quitUserFromBattle(userId);
    if (!result) return res.status(200).json({ success: true, data: {}, msg: 'User not found in battle' });
    return res.status(200).json({ success: true, data: result, msg: 'User removed from battle' });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error(error)
    return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
  }
};

/**
 * @api {get} /battle/get-battle-results/:battleId  Get Battle Results
 * @apiName  Get Battle Results
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {Number} battleId  id of battle
 * @apiDescription  This api gives custom response for results of a battle..
 */
exports.getBattleResults = async (req, res) => {
  try {
    const { battleId } = req.params;
    const result = await svcV3.getBattleResultById(battleId);
    return res.status(200).json({ success: true, data: result, msg: 'Battle results fetched successfully' });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error('Error in fetching battle results:', error);
    return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
  }
}

/**
 * @api {post} /battle/upload-game-logs Upload Game Logs with Details
 * @apiName UploadGameLogsWithDetails
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String} userId The ID of the user uploading the logs.
 * @apiParam {String} duelId The ID of the duel.
 * @apiParam {String='USER','SERVER'} entityType The type of entity.
 * @apiParam {File} logFile The log file to be uploaded.
 * @apiDescription Upload game logs with additional details.
 */
exports.uploadGameLogsWithDetails = async (req, res) => {
  try {
    const { userId, duelId, entityType } = req.body;
    const file = req.files.logFile;
    console.info(file)
    const result = await svcV3.uploadGameLogs(file, userId, duelId, entityType);
    return res.status(200).json({ success: true, data: result, msg: 'Game logs uploaded successfully' });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error('Error in uploading game logs:', error);
    return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
  }
}


/**
 * @api {get} /battle/game-logs/:duelId Get Game Logs by Battle
 * @apiName GetGameLogsByBattle
 * @apiGroup Battle
 * @apiHeader {String} Authorization  unique access-key.
 * @apiParam {String} duelId The ID of the duel.
 * @apiParam {String} [userId] The ID of the user (optional).
 * @apiDescription Fetch game logs by battle ID.
 */
exports.getGameLogsByBattle = async (req, res) => {
  try {
    const { duelId } = req.params;
    const { userId } = req.query;

    const logs = await svcV3.getGameLogsByBattleId(duelId, userId);

    return res.status(200).json({ success: true, data: logs, msg: 'Game logs fetched successfully' });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error('Fetch Logs Error:', error);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
};


/**
 * @api {post} /battle/set-game-player-config  Set Game Player Config
 * @apiName Set Game Player Config
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiBody {NUmber} hunterCount  hunter count for game
 * @apiBody {NUmber} runnerCount  runner count for game
 * @apiBody {NUmber} hunterSpeed  hunter speed for game
 * @apiBody {NUmber} runnerSpeed  runner speed for game
 * @apiDescription  Set game player config for next game.
 */
exports.setGamePlayerConfigFxn = async (req, res) => {
  try {
    const { hunterCount, runnerCount, hunterSpeed, runnerSpeed } = req.body;

    if (!hunterCount || !runnerCount || !hunterSpeed || !runnerSpeed) {
    return res.status(200).json({ success: false, data: {}, msg: 'Game player config data missing' });
    }

    const result = await svcV3.setGamePlayerConfigData({ hunterCount, runnerCount, hunterSpeed, runnerSpeed });
    return res.status(200).json({ success: true, data: { hunterCount, runnerCount, hunterSpeed, runnerSpeed }, msg: 'Game player config set' });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error('Error in uploading game logs:', error);
    return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
  }
}


/**
 * @api {get} /battle/get-game-player-config  Get Game Player Config
 * @apiName Get Game Player Config
 * @apiGroup Battle
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiDescription  Get game player config for next game.
 */
exports.getGamePlayerConfigFxn = async (req, res) => {
  try {
    const result = await svcV3.getGamePlayerConfigData();
    return res.status(200).json({ success: true, data: result, msg: 'Game player config fetched' });
  } catch (error) {
    console.error('Error logged for time: ', new Date(), '& timeStamp: ', new Date().getTime());
    console.error('Error in uploading game logs:', error);
    return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
  }
}

