const aiUserService = require('../services/aiUser.service');
// const usersService = require('../services/users.service');
// const userAvatarSvc = require('../services/users-avatar.service');
// const battleService = require('../services/battle.service');



/**
* @api {get} /aiUser/get-random-ai-player/:leagueId/:userCount Get Random AI Player
* @apiName GetRandomAIUser
* @apiParam {Number} leagueId League Id
* @apiParam {Number} userCount number of user to be created
* @apiGroup AI User
* @apiDescription This API is used to get random AI user for battle.
*/
module.exports.getRandomAiUser = async (req, res) => {
  try {
    // let freeAiUsersCount = await aiUserService.getFreeUsersCount(req.params.leagueId);
    // console.info(freeAiUsersCount, "---freeAiUsersCount---18")

    // let newLeagueRes, initLeagueData;
    // // this was specifically required by upper heads
    // if (freeAiUsersCount < 30) {
    //   let loopCount = 30;
    //   // let loopCount = (req.params.userCount - freeAiUsersCount);
    //   console.info(loopCount, "---loopCount---21")
    //   let lastAiUser = await aiUserService.getLastAiUser();
    //   for (let i = 0; i < loopCount; i++) {
    //     let playerPayload = {
    //       name: 'Guest' + parseInt(lastAiUser.id + i + 1),
    //       aiStatus: 'notplaying',
    //       isHaveMinFuel: true,
    //       isVerified: true,
    //       isRegister: true,
    //       role: 5,
    //     }
    //     let newAiPlayer = await aiUserService.createAiUser(playerPayload);

    //     let maxRankObj = await usersService.findMaxGlobalRankOverAll();
    //     let db_payload = {
    //       userId: newAiPlayer.id,
    //       leagueId: req.params.leagueId,
    //       global_rank: maxRankObj.maxGlobalRank + 1
    //     }
    //     if (req.params.leagueId === 2) {
    //       db_payload['rating'] = 200
    //       await battleService.createAiUserGold(newAiPlayer.id)
    //     }
    //     newLeagueRes = await aiUserService.createUserLeague(db_payload)
    //     initLeagueData = await usersService.getLeagueById(newLeagueRes.leagueId)
    //   }
    // }

    let findAiUserRes = await aiUserService.findRandomAiUsers(req.params.leagueId, req.params.userCount);
    console.info(findAiUserRes.length, "---freeAiUserRes.length---36")
    if (findAiUserRes.length == 0) {
      return res.status(400).json({ success: false, data: null, msg: 'AI User not found..' });
    }

    let userPayload = [];
    let aiUserIdCheck = [];
    for (let i = 0; i < findAiUserRes.length; i++) {
      const randomAiUser = findAiUserRes[i];
      // const usr = await aiUserService.findAiFreeUserById(randomAiUser.id);
      // console.info(randomAiUser.dataValues.userXetaBalances, "---randomAiUser---48")
      // const usr = await usersService.getUserDetailsByWallet(wallet);
      // const user_avatar = await userAvatarSvc.getUserAvatarByUserId(randomAiUser.id);
      // if (!usr) throw new UserInputError('User Not Found With Given Wallet Address', 404);

      // if (randomAiUser.userLeagues.length === 0) {
      //   let maxRankObj = await usersService.findMaxGlobalRankOverAll();
      // }
      aiUserIdCheck.push(randomAiUser.id)
      const payload = {
        userId: randomAiUser.id,
        userName: randomAiUser.name,
        walletAddress: null,
        email: null,
        tcg_avatar: null,
        // avatar_name: user_avatar ? user_avatar.name : null,
        // avatar_index: user_avatar ? user_avatar.avatar_index : null,
        avatar_name: 'AI User Avatar',
        avatar_index: null,
        goldValue: 0,
        battle_data: {
          rank: randomAiUser['userLeagues.global_rank'],
          // rankByLeague: randomAiUser['userLeagues.rankByLeague'],
          battles: randomAiUser['userLeagues.wins'] + randomAiUser['userLeagues.loose'] + randomAiUser['userLeagues.draw'] || 0,
          wins: randomAiUser['userLeagues.wins'] || 0,
          loses: randomAiUser['userLeagues.loose'] || 0,
          draws: randomAiUser['userLeagues.draw'] || 0,
          isHaveMinFuel: randomAiUser.isHaveMinFuel,
        },
        league_data: {
          leagueId: randomAiUser['userLeagues.league.leaguesDetail.leagueId'] || 1,
          leagueName: randomAiUser['userLeagues.league.name'] || 'Trial',
          leagueGroupId: randomAiUser['userLeagues.league.groupId'] || 1,
          defaultPoint: randomAiUser['userLeagues.league.leaguesDetail.defaultPoint'] || 0,
          mininumPoints: randomAiUser['userLeagues.league.leaguesDetail.min'] || 0,
          maximumPoints: randomAiUser['userLeagues.league.leaguesDetail.max'] || 0,
          playerHp: randomAiUser['userLeagues.league.leaguesDetail.playerHp'] || 0,
          initialManaCost: randomAiUser['userLeagues.league.leaguesDetail.initialManaCost'] || 0,
          increaseManaCount: randomAiUser['userLeagues.league.leaguesDetail.increaseManaCount'] || 0,
        },
        experienceLevel: []
      }

      userPayload.push(payload);
    }

    let aiPlayers = userPayload.map(dt => { return dt.userId })
    await aiUserService.updateAiUserPlayStatus({ aiStatus: 'checked' }, aiPlayers)
    console.log(aiUserIdCheck, "---aiUserIdCheck---93")

    // await aiUserService.createAiUsersMoney(aiPlayers);

    // const userPayload = await aiUserService.getRandomAiUsers(req.params.leagueId, req.params.userCount);
    return res.status(200).json({ success: true, data: userPayload, msg: 'successfully fetched user details' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, data: error, msg: "Internal server error" });
  }
}


/**
 * @api {get} /aiUser/get-ai-player-abilities Get AI Player Details
 * @apiName GetAIPlayerAbilities
 * @apiHeader {String} Authorization Authorization Token
 * @apiGroup AI User
 * @apiDescription This API is used to get AI player abilities.
 */
exports.getAIBasicAbilities = async (req, res) => {
  try {
    let abilities = await aiUserService.getAIBasicAbilities();
    return res.status(200).json({ success: true, data: { ...abilities, captureDelay: 1 }, msg: 'successfully fetched abilities' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, data: error, msg: "Internal server error" });
  }
}