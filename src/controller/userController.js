//@ts-check

const userService = require('../services/users.service');
const deviceTokenService = require('../services/user-device-token.service.js');
const usersService = require('../services/users.service');
const { UserInputError } = require('../utils/classes');
const userAvatarSvc = require('../services/users-avatar.service.js');
const battle_utils = require('../utils/battleUtilities.js');
const { isEmpty } = require('../utils/index.js');



/**
 * @api {post} /users/set-name   Set Name
 * @apiName Set Name
 * @apiGroup User
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String}  name  Name of user `Mandatory`.
 * @apiDescription  User Service..
 */
module.exports.setName = async (req, res) => {
  try {
    let userId = req.decoded.id;
    let upateUserRes = await userService.updateUser(userId, {
      name: req.body.name
    });
    if (upateUserRes && upateUserRes[0] && upateUserRes[0] == 1)
      return res.status(200).json({
        success: true,
        data: null,
        msg: 'User name updated successfully'
      });
    else
      return res.status(400).json({
        success: false,
        data: null,
        msg: 'Error occurs during user name updation'
      });
  } catch (error) {
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


/**
 * @api {post} /users/update-profile-image Update User Profile Photo
 * @apiName UpdateUserProfilePhoto
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String}  image_url Image Url of User Profile Photo `Mandatory`.
 * @apiGroup User
 * @apiDescription  User Service..
 */
module.exports.updateUserProfile = async (req, res) => {
  try {
    let userId = req.decoded.id;
    let updateAvatarRes = await userService.updateUser(userId, {
      avatar: req.body.image_url
    });
    if (updateAvatarRes && updateAvatarRes[0] && updateAvatarRes[0] == 1) {
      return res.status(200).json({
        success: true,
        data: null,
        msg: 'User avatar updated successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        data: null,
        msg: 'Error occurs during avatar updation'
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};
/**
 * @api {post} /users/set-device-token  Set Device Token
 * @apiName Set Device Token
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String}  deviceToken  Device Token of User `Mandatory`.
 * @apiGroup User
 * @apiDescription  User Service..
 */
module.exports.setDeviceToken = async (req, res) => {
  try {
    let userId = req.decoded.id;
    let tokenRes = await deviceTokenService.getDeviceToken(userId, req.body.deviceToken);
    if (!tokenRes) {
      // create token for the user
      let createTokenRes = await deviceTokenService.createDeviceToken({
        userId: userId,
        token: req.body.deviceToken
      });
      if (!createTokenRes)
        return res.status(400).json({
          success: false,
          data: null,
          msg: 'Error occurs during adding device token'
        });
      else
        return res.status(200).json({
          success: true,
          data: null,
          msg: 'Device token added successfully'
        });
    } else {
      return res.status(200).json({
        success: true,
        data: null,
        msg: 'Device token already saved for this device'
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


/**
 * @api {get} /users/get-users-global-rank/:pageNumber/:pageSize  Get All User Global Rank
 * @apiName GetAllUserGlobalRank
 * @apiParam {Number} pageNumber Page Number
 * @apiParam {Number} pageSize Page Size
 * @apiGroup User
 * @apiDescription  This Api gives list of users global rank..
 */
module.exports.getUsersUniversalRank = async (req, res) => {
  try {
    const page = parseInt(req.params.pageNumber) || 1;
    const pageSize = parseInt(req.params.pageSize) || 100;

    let resultList = await userService.getUserUniversalRanks(page, pageSize);
    return res.status(200).json({
      success: true, data: resultList, msg: 'User Ranks By League fetched successfully'
    });
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};

/**
 * @api {put} /users/set-rfm-first-login-to-false Set RFM First Login to False
 * @apiName Set RFM First Login to False
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiGroup User
 * @apiDescription  This Api sets RFM_first_login to false for user..
 */
module.exports.setRfmFirstLoginToFalse = async (req, res) => {
  try {
    const user = await usersService.getUserById(req.decoded.id);
    if (!user) throw new UserInputError('Invalid User Id')
    await usersService.updateUser(user.id, { rfm_first_login: false })
    return res.status(200).json({ success: true, data: null, msg: 'successfully set RFM_first_login to false' })
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error.stack, error: error, message: error.message || 'Internal server error.' });
  }
}

/**
 * @api {put} /users/set-rfm-first-login Set RFM First Login
 * @apiName SetRfmFirstLogin
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {Boolean} new_login Set new_login value of User
 * @apiGroup User
 * @apiDescription  This Api sets rfm_first_login to true or false for user..
 */
module.exports.setRfmFirstLogin = async (req, res) => {
  try {
    const user = await usersService.getUserById(req.decoded.id);
    if (!user) throw new UserInputError('Invalid User Id')
    await usersService.updateUser(user.id, { rfm_first_login: req.body.new_login })
    return res.status(200).json({ success: true, data: null, msg: `successfully set rfm_first_login to ${req.body.new_login}` })
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error.stack, error: error, message: error.message || 'Internal server error.' });
  }
}



/**
 * @api {post} /users/set-user-avatar Set User's Avatar Data
 * @apiName SetUsersAvatarData
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiBody {String} name Name of Avatar `Optional`
 * @apiBody {Number} index Index of Avatar `Mandatory`
 * @apiGroup User
 * @apiDescription  This Api sets avatar data for user..
 */
module.exports.setAvatarData = async (req, res) => {
  try {
    const user = await usersService.getUserById(req.decoded.id);
    if (!user) throw new UserInputError('Invalid User Id')
    await userAvatarSvc.createOrUpdateUserAvatar(user.id, { name: req.body.name, avatar_index: req.body.index })
    return res.status(200).json({ success: true, data: null, msg: 'successfully set avatar data' })
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error.stack, error: error, message: error.message || 'Internal server error.' });
  }
}


/**
 * @api {delete} /users/remove-user-avatar Remove User's Avatar Data
 * @apiName RemoveUsersAvatarData
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiGroup User
 * @apiDescription  This Api removes avatar data for user..
 */
module.exports.removeAvatarData = async (req, res) => {
  try {
    const user = await usersService.getUserById(req.decoded.id);
    if (!user) throw new UserInputError('Invalid User Id')
    await userAvatarSvc.removeUserAvatarByUserId(user.id);
    return res.status(200).json({ success: true, data: null, msg: 'successfully removed avatar data' })
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error.stack, error: error, message: error.message || 'Internal server error.' });
  }
}


exports.recalcUserGlobalRanks = async (req, res) => {
  try {
    const bleh = await battle_utils.updateGlobalRankings_V2();
    return res.status(200).json({ success: true, data: bleh, msg: 'successfully recalculated global ranks' });
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error.stack, error: error, message: error.message || 'Internal server error.' });
  }
}


/**
 * @api {get} /users/get-user Get User Details
 * @apiName Get User Details
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiGroup User
 * @apiDescription  This Api gets user details address..
 */
exports.getUser = async (req, res) => {
  try {
    let userId = req.decoded.id;
    const userDetails = await usersService.getSingleUserDetails(userId);

    if (!userDetails) throw new UserInputError('User Not Found', 404);
    const user_avatar = await userAvatarSvc.getUserAvatarByUserId(userDetails.id);

    let newLeagueRes, initLeagueData;
    if (userDetails.userLeagues.length === 0) {
      let maxRankObj = await userService.findMaxGlobalRankOverAll();
      newLeagueRes = await userService.createUserLeague({ userId: userDetails.id, leagueId: 1, global_rank: 0 })
      initLeagueData = await usersService.getLeagueById(newLeagueRes.leagueId)
    }

    const username = userDetails.name ? userDetails.name : (!isEmpty(userDetails.walletAddress) ? userDetails.walletAddress.substring(0, 6) : '');
    const payload = {
      userId: userDetails.id,
      userName: username,
      walletAddress: userDetails.walletAddress,
      email: userDetails.email,
      profileImg: userDetails.avatar ? userDetails.avatar : '',
      profileIconColor: userDetails.profileIconColor ? userDetails.profileIconColor : '',
      tcg_avatar: userDetails.tcgAvatar,
      avatar_name: user_avatar ? user_avatar.name : null,
      avatar_index: user_avatar ? user_avatar.avatar_index : null,
      goldValue: userDetails?.userXetaBalances[0]?.balance ? userDetails?.userXetaBalances[0]?.balance : 0,
      battle_data: {
        rank: userDetails?.userLeagues[0]?.global_rank && userDetails?.userLeagues[0]?.global_rank > 0 ? userDetails.userLeagues[0].global_rank : (newLeagueRes && newLeagueRes.global_rank > 0 ? newLeagueRes.global_rank : 0),
        // rankByLeague: userDetails['userLeagues.rankByLeague'],
        rating: userDetails.userLeagues[0]?.rating ? userDetails.userLeagues[0].rating : 0,
        battles: userDetails.userLeagues[0]?.wins + userDetails.userLeagues[0]?.loose + userDetails.userLeagues[0]?.draw || 0,
        wins: userDetails.userLeagues[0]?.wins || 0,
        loses: userDetails.userLeagues[0]?.loose || 0,
        draws: userDetails.userLeagues[0]?.draw || 0,
        winStreak: userDetails['userLeagues.league.id'] == 1 ? '-' : userDetails.userLeagues[0]?.maxStreak || 0,
        isHaveMinFuel: (userDetails?.userXetaBalances[0]?.balance > 100) ? true : false,
      },
      league_data: {
        leagueId: userDetails.userLeagues[0]?.leagueId ? userDetails.userLeagues[0]?.leagueId : newLeagueRes.leagueId,
        leagueName: userDetails.userLeagues[0]?.league?.name ? userDetails.userLeagues[0]?.league?.name : initLeagueData.name,
        leagueGroupId: userDetails.userLeagues[0]?.league?.groupId ? userDetails.userLeagues[0]?.league?.groupId : initLeagueData.groupId,
        defaultPoint: userDetails.userLeagues[0]?.league?.leaguesDetail?.defaultPoint ? userDetails.userLeagues[0].league.leaguesDetail.defaultPoint : initLeagueData.leaguesDetail.defaultPoint,
        mininumPoints: (userDetails.userLeagues[0]?.league?.leaguesDetail?.min || userDetails.userLeagues[0]?.league?.leaguesDetail?.min === 0) ? userDetails.userLeagues[0].league.leaguesDetail.min : initLeagueData.leaguesDetail.min,
        maximumPoints: userDetails.userLeagues[0]?.league?.leaguesDetail?.max ? userDetails.userLeagues[0]?.league?.leaguesDetail?.max : initLeagueData.leaguesDetail.max,
        playerHp: userDetails.userLeagues[0]?.league?.hp ? userDetails.userLeagues[0]?.league?.hp : initLeagueData?.hp,
        initialManaCost: userDetails.userLeagues[0]?.initialManaCost ? userDetails.userLeagues[0]?.initialManaCost : initLeagueData?.initialManaCost,
        increaseManaCount: userDetails.userLeagues[0]?.increaseManaCount ? userDetails.userLeagues[0]?.increaseManaCount : initLeagueData?.increaseManaCount,
      },
      experienceLevel: userDetails.userExperiences
    }

    return res.status(200).json({ success: true, data: payload, msg: 'successfully fetched user details' });
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error.stack, error: error, message: error.message || 'Internal server error.' });
  }
}


/**
 * @api {get} /users/get-xeta-balance  Get User Xeta Balance
 * @apiName Get User Xeta Balance
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiGroup User
 * @apiDescription  User Service..
 */
module.exports.getUserXetaBalance = async (req, res) => {
  try {
    let userId = req.decoded.id;
    let userXetaBalance = await userService.getXetaBalanceByUserId(userId)

    if (userXetaBalance) {
      return res.status(200).json({ success: true, data: { userId: userId, xetaBalance: userXetaBalance.balance }, msg: 'successfully fetched user xeta balance' });
    } else {
      return res.status(200).json({ success: true, data: {}, msg: 'record not found' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};



/**
 * @api {get} /users/get-user-data-on-wallet/:walletAddress  Get User Details By Wallet Address
 * @apiName Get User Details By Wallet Address
 * @apiParam walletAddress wallet address of user
 * @apiGroup User
 * @apiDescription  This Api gets user details address..
 */
exports.getUserDataByWalletAddress = async (req, res) => {
  try {
    let userWallet = req.params.walletAddress;
    const userDetails = await usersService.getUserAllDataByWallet(userWallet);

    if (!userDetails) throw new UserInputError('User Not Found', 404);
    const user_avatar = await userAvatarSvc.getUserAvatarByUserId(userDetails.id);

    let newLeagueRes, initLeagueData;
    if (userDetails.userLeagues.length === 0) {
      let maxRankObj = await userService.findMaxGlobalRankOverAll();
      newLeagueRes = await userService.createUserLeague({ userId: userDetails.id, leagueId: 1, global_rank: 0 })
      initLeagueData = await usersService.getLeagueById(newLeagueRes.leagueId)
    }
    // console.info(userDetails.userLeagues)
    const payload = {
      userId: userDetails.id,
      userName: userDetails.name,
      walletAddress: userDetails.walletAddress,
      email: userDetails.email,
      tcg_avatar: userDetails.tcgAvatar,
      avatar_name: user_avatar ? user_avatar.name : null,
      avatar_index: user_avatar ? user_avatar.avatar_index : null,
      goldValue: userDetails?.userXetaBalances[0]?.balance ? userDetails?.userXetaBalances[0]?.balance : 0,
      battle_data: {
        rank: userDetails?.userLeagues[0]?.global_rank ? userDetails.userLeagues[0].global_rank : 0,
        // rankByLeague: userDetails['userLeagues.rankByLeague'],
        battles: userDetails.userLeaguesHistories[0]?.wins + userDetails.userLeaguesHistories[0]?.loose + userDetails.userLeaguesHistories[0]?.draw || 0,
        wins: userDetails.userLeaguesHistories[0]?.wins || 0,
        loses: userDetails.userLeaguesHistories[0]?.loose || 0,
        draws: userDetails.userLeaguesHistories[0]?.draw || 0,
        winStreak: userDetails['userLeagues.league.id'] == 1 ? '-' : userDetails.userLeagues[0].maxStreak,
        isHaveMinFuel: (userDetails?.userXetaBalances[0]?.balance > 100) ? true : false,
      },
      league_data: {
        leagueId: userDetails.userLeagues[0]?.leagueId ? userDetails.userLeagues[0]?.leagueId : newLeagueRes.leagueId,
        leagueName: userDetails.userLeagues[0]?.league?.name ? userDetails.userLeagues[0]?.league?.name : initLeagueData.name,
        leagueGroupId: userDetails.userLeagues[0]?.league?.groupId ? userDetails.userLeagues[0]?.league?.groupId : initLeagueData.groupId,
        defaultPoint: userDetails.userLeagues[0]?.league?.leaguesDetail?.defaultPoint ? userDetails.userLeagues[0].league.leaguesDetail.defaultPoint : initLeagueData.leaguesDetail.defaultPoint,
        mininumPoints: (userDetails.userLeagues[0]?.league?.leaguesDetail?.min || userDetails.userLeagues[0]?.league?.leaguesDetail?.min === 0) ? userDetails.userLeagues[0].league.leaguesDetail.min : initLeagueData.leaguesDetail.min,
        maximumPoints: userDetails.userLeagues[0]?.league?.leaguesDetail?.max ? userDetails.userLeagues[0]?.league?.leaguesDetail?.max : initLeagueData.leaguesDetail.max,
        playerHp: userDetails.userLeagues[0]?.league?.hp ? userDetails.userLeagues[0]?.league?.hp : initLeagueData?.hp,
        initialManaCost: userDetails.userLeagues[0]?.initialManaCost ? userDetails.userLeagues[0]?.initialManaCost : initLeagueData?.initialManaCost,
        increaseManaCount: userDetails.userLeagues[0]?.increaseManaCount ? userDetails.userLeagues[0]?.increaseManaCount : initLeagueData?.increaseManaCount,
      }
    }

    return res.status(200).json({ success: true, data: payload, msg: 'successfully fetched user details' });
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error.stack, error: error, message: error.message || 'Internal server error.' });
  }
}


/**
 * @api {post} /users/set-user-abilities  Set User Abilities
 * @apiName Set User Abilities
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String}  abilityName  Ability of User `Mandatory`.
 * @apiGroup User
 * @apiDescription  User Service..
 */
module.exports.setUserAbilities = async (req, res) => {
  try {
    let userId = req.decoded.id;
    const { abilityName } = req.body;
    let abilityRes = await usersService.getUserAbilityByName(userId, abilityName)

    if (!abilityRes) {
      let createRes = await usersService.createUserAbility({ userId, abilityName })
      return res.status(200).json({
        success: true,
        data: createRes,
        msg: 'User ability created'
      });
    } else {
      let db_payload = {
        count: abilityRes.count + 1
      }
      let [updateRes, [updatedRec]] = await usersService.updateUserAbility(db_payload, abilityRes.id)
      return res.status(200).json({
        success: true,
        data: updatedRec,
        msg: 'User ability updated'
      });
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


/**
 * @api {get} /users/get-user-abilities  Get User Abilities
 * @apiName Get User Abilities
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiGroup User
 * @apiDescription  User Service..
 */
module.exports.getUserAbilities = async (req, res) => {
  try {
    let userId = req.decoded.id;
    let abilityRes = await usersService.getUserAbilityByUserId(userId)

    return res.status(200).json({
      success: true,
      data: abilityRes,
      msg: 'User ability fetched'
    });
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


/**
 * @api {put} /users/remove-user-abilities  Remove User Abilities
 * @apiName Remove User Abilities
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String}  abilityName  Ability of User `Mandatory`.
 * @apiGroup User
 * @apiDescription  User Service..
 */
module.exports.removeUserAbilities = async (req, res) => {
  try {
    let userId = req.decoded.id;
    const { abilityName } = req.body;
    let abilityRes = await usersService.getUserAbilityByName(userId, abilityName)

    if (abilityRes) {
      if (abilityRes.count === 1) {
        let removeRes = await usersService.removeUserAbility(userId, abilityName)
        return res.status(200).json({
          success: true,
          data: removeRes,
          msg: 'User ability removed'
        });
      } else {
        let db_payload = {
          count: abilityRes.count - 1
        }
        let [updateRes, [updatedRec]] = await usersService.updateUserAbility(db_payload, abilityRes.id)
        return res.status(200).json({
          success: true,
          data: updatedRec,
          msg: 'User ability used'
        });
      }
    } else {
      return res.status(200).json({
        success: false,
        data: {},
        msg: 'User ability not found'
      });
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


/**
 * @api {get} /users/get-asset-json/:id  Get Cloth Asset JSON
 * @apiName Get Cloth Asset JSON
 * @apiParam {Number} id id of json
 * @apiGroup User
 * @apiDescription  This Api gives list of users global rank..
 */
module.exports.getClothAssetJson = async (req, res) => {
  try {
    let resultList = await userService.getUserClothJsonData(req.params.id);

    if (!resultList) {
      return res.status(200).json({
        success: true, data: {}, msg: 'Invalid Asset Id'
      });
    }
    return res.status(200).json({
      success: true, data: resultList, msg: 'User Occupied asset fetched successfully'
    });
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};

/**
 * @api {get} /users/v2/get-asset-json/:id  Get Cloth Asset JSON V2
 * @apiName Get Cloth Asset JSON V2
 * @apiParam {Number} id id of json
 * @apiGroup User
 * @apiDescription  This Api gives list of users global rank..
 */
module.exports.getClothAssetJsonV2 = async (req, res) => {
  try {
    let resultList = await userService.getUserClothJsonData(req.params.id);

    if (!resultList) {
      const randomAsset = await userService.getAiClothAssetJsonData(req.params.id);
      return res.status(200).json({ success: true, data: randomAsset, msg: 'Random Cloth Asset fetched successfully' });
    }
    return res.status(200).json({
      success: true, data: resultList, msg: 'User Occupied asset fetched successfully'
    });
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


/**
 * @api {get} /users/get-asset-json-by-creator/:userId  Get Cloth Asset JSON By Creator
 * @apiName Get Cloth Asset JSON By Creator
 * @apiParam {Number} id id of json
 * @apiGroup User
 * @apiDescription  This API fetches the cloth asset json data by creator id..
 */
module.exports.getClothAssetJsonByCreatorFxn = async (req, res) => {
  try {
    let resultList = await userService.getUserClothJsonDataByCreator(req.params.userId);

    return res.status(200).json({ success: true, data: resultList, msg: 'User Occupied asset fetched successfully' });
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


/**
 * @api {put} /users/update-first-login Update First Login
 * @apiName Update First Login
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiGroup User
 * @apiDescription  This Api updates first login for user and sets it to FALSE. it is `MANDATORY` to run this API from client..
 */
exports.setFirstLoginFalse = async (req, res) => {
  try {
    let userId = req.decoded.id;
    await usersService.updateUser(userId, { rfm_first_login: false })
    return res.status(200).json({ success: true, data: null, msg: 'successfully set first_login to false' })
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error.stack, error: error, message: error.message || 'Internal server error.' });
  }
}

/**
 * @api {get} /users/get-home-screen-data  Get Home Screen Data
 * @apiName Get Home Screen Data
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiGroup User
 * @apiDescription  This Api gives list of users home screen data..
 */
exports.getHomeScreenData = async (req, res) => {
  try {
    const userId = req.decoded.id;
    const result = await userService.getHomeScreenDetailsOfUser(userId);
    return res.status(200).json({ success: true, data: result, msg: 'Home Screen Data fetched successfully' });
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error.stack, error: error, message: error.message || 'Internal server error.' });
  }
}


/**
 * @api {get} /users/v2/get-home-screen-data  Get Home Screen Data v2
 * @apiName Get Home Screen Datav2
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiGroup User
 * @apiDescription  This Api gives list of users home screen data..
 */
exports.getHomeScreenDataV2 = async (req, res) => {
  try {
    const userId = req.decoded.id;
    const result = await userService.getHomeScreenDetailsOfUserV2(userId);
    console.log(result, "---result---597")
    return res.status(200).json({ success: true, data: result, msg: 'Home Screen Data fetched successfully' });
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error.stack, error: error, message: error.message || 'Internal server error.' });
  }
}


/**
 * @api {get} /users/get-user-profile-picture/:userId  Get User Profile Picture
 * @apiName Get User Profile Picture
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {Number} userId id of user
 * @apiGroup User
 * @apiDescription  This Api gives list of users home screen data..
 */
exports.getUserProfilePicture = async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await userService.getUserProfilePicture(userId);
    console.log(result, "---result---597")
    return res.status(200).json({ success: true, data: result, msg: 'Home Screen Data fetched successfully' });
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error.stack, error: error, message: error.message || 'Internal server error.' });
  }
}


/**
 * @api {get} /users/v3/get-home-screen-data  Get Home Screen Data V3
 * @apiName Get Home Screen Data V3
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiGroup User
 * @apiDescription  This API gives list of users home screen data..
 */
exports.getHomeScreenDataV3 = async (req, res) => {
  try {
    const userId = req.decoded.id;
    const result = await userService.getHomeScreenDetailsOfUserV3(userId);
    console.log(result, "---result---657")
    return res.status(200).json({ success: true, data: result, msg: 'Home Screen Data fetched successfully' });
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error.stack, error: error, message: error.message || 'Internal server error.' });
  }
}

