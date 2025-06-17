//@ts-check
const userService = require('../services/users.service');
const authService = require('../services/auth.service');
const cryptoService = require('../services/crypto.service');
const becryptService = require('../services/becrypt.service');
const deviceTokenService = require('../services/user-device-token.service');
const onchain = require('../onchain');
const { UserInputError } = require('../utils/classes');
const { isEmpty } = require('lodash');
const { default: axios } = require('axios');
const pkg = require('../../package.json');
const config = require('../config');
const { checkAndCreateUserRFMattributes } = require('../services/users.postwork.service');
const leaderboardService = require('../services/leaderboard.service');

const app_id = require('../../package.json').name;

const getUniqueCode = async (length) => {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
/**
 * @api {post} /auth/get-user-nonce   Get User Nonce
 * @apiName Get User Nonce
 * @apiGroup Authentication
 * @apiParam {String}  walletAddress  Wallet Address of User `Mandatory`.
 * @apiDescription  User Service..
 */
module.exports.getUserNonce = async (req, res) => {
  try {
    let findUserResponse = await userService.getUserByWallet(req.body.walletAddress.toLowerCase());
    if (!findUserResponse) {
      const user = {
        walletAddress: req.body.walletAddress.toLowerCase(),
        userType: 2,
        userInfo: 3
      };
      findUserResponse = await userService.createUser(user);
    } else if (findUserResponse.isDeleted) {
      return res.status(400).json({ success: false, data: null, msg: 'User Already Exists but account deactivated' });
    }
    const nonce = await getUniqueCode(16);
    // const sign = await blockchain.get_signature(nonce);
    await userService.updateUser(findUserResponse.id, { nonce: nonce, isRegister: true });
    return res.status(200).json({ success: true, data: { nonce: nonce }, msg: 'Nonce get successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};
/**
 * @api {post} /auth/save-user-nonce   Save User Nonce
 * @apiName Save User Nonce
 * @apiGroup Authentication
 * @apiParam {String}  walletAddress  Wallet Address of User `Mandatory`.
 * @apiParam {String}  nonce  Wallet Address of User `Mandatory`.
 * @apiDescription  User Service..
 */
module.exports.saveUserNonce = async (req, res) => {
  try {
    let findUserResponse = await userService.getUserByWallet(req.body.walletAddress.toLowerCase());
    if (!findUserResponse) {
      const user = {
        walletAddress: req.body.walletAddress.toLowerCase(),
        userType: 2,
        userInfo: 3
      };
      findUserResponse = await userService.createUser(user);
    }
    // else if (findUserResponse.isDeleted) {
    //   return res.status(400).json({ success: false, data: null, msg: 'User Already Exists but account deactivated' });
    // }
    const nonce = req.body.nonce;
    await userService.updateUser(findUserResponse.id, { nonce: nonce, isRegister: true });
    // * DO postwork here
    await checkAndCreateUserRFMattributes(findUserResponse.id);

    // end postwork calls

    return res.status(200).json({ success: true, data: { nonce: nonce }, msg: 'Nonce added successfully' });
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


const globalVariable = global;

async function manageUserDevices(userId, deviceId, userInfo, destroyAll = false) {
  try {
    if (deviceId == 'xana-web') return true;

    let userDevices = await userService.getUsersAllDevices(userId, userInfo, app_id);

    let device
    if (destroyAll) {
      for await (const device of userDevices) {
        // await deviceTokenService.destroyrfmDevice(userId, device.deviceId, app_id);
        console.info('user device id$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$    ' + device.deviceId + '        $$$$$$$$$$$$$$$$$$$$$');
        globalVariable.io.emit('destroyedDevices', device.deviceId);
      }
      // Delete all previous devices
      await deviceTokenService.destroyAllRfmDevices(userId, app_id);
      // Save the incoming device
      device = await userService.saveUserDevice({
        userId: userId,
        deviceId: deviceId,
        expiredIn: new Date(new Date().setHours(new Date().getHours() + 48)),
        userInfo: userInfo,
        native_app_id: app_id
      });
      if (device) {
        device = device.toJSON();
      }
    } else {
      if (userDevices.length > 1) {
        throw new UserInputError('You are already logged in from multiple devices. Logout from all devices first', 200, { err_code: `40002`, solution: `call the same API with 'forced=true'.` });
      } else if (userDevices.length === 1) {
        if (userDevices[0].deviceId.toLowerCase() !== deviceId.toLowerCase()) {
          throw new UserInputError('You are already logged in from another device.', 200, { err_code: `40003`, solution: `call the same API with "forced=true"` });
        } else {
          // Update the device
          let [count, [rows]] = await userService.updateUserDevice(userDevices[0].id, {
            deviceId: deviceId,
            expiredIn: new Date(new Date().setHours(new Date().getHours() + 48)),
            userInfo: userInfo,
            native_app_id: app_id
          });
          device = rows;
          if (device) {
            device = device.toJSON();
          }
        }
      } else {
        // Save the incoming device
        device = await userService.saveUserDevice({
          userId: userId,
          deviceId: deviceId,
          expiredIn: new Date(new Date().setHours(new Date().getHours() + 48)),
          userInfo: userInfo,
          native_app_id: app_id
        });
        if (device) {
          device = device.toJSON();
        }
      }
    }
    return device;
  } catch (error) {
    throw error;
  }
}



/**
 * @api {post} /auth/sign-in-destroy-devices Sign In Destroy Devices
 * @apiName Sign In Destroy Devices
 * @apiGroup Authentication
 * @apiParam {String}  email  Email of User `Mandatory`.
 * @apiParam {String}  phoneNumber  Phone Number of User `Mandatory`.
 * @apiParam {String}  password  password of user `Mandatory`.
 * @apiParam {String}  deviceId  deviceId of user `Mandatory`.
 * @apiDescription  User Service..
 */
module.exports.signInDestroyDevices = async (req, res) => {
  try {
    let email = req.body.email;
    let phoneNumber = req.body.phoneNumber;
    let xanaliaToken = null;
    if (!email && !phoneNumber) {
      return res.status(400).json({ success: false, data: null, msg: 'Invalid request parameter atleast one parameter is required' });
    } else if (email) {
      let findUserResponse = await userService.getUserByEmail(email);
      if (!findUserResponse) {
        return res.status(400).json({ success: false, data: null, msg: 'User does not exists with this email' });
      } else if (findUserResponse && findUserResponse.isVerified && findUserResponse.isRegister) {
        if (await becryptService.comparePassword(req.body.password, findUserResponse.password)) {
          const device = await manageUserDevices(findUserResponse.id, req.body.deviceId, findUserResponse.userInfo, true);
          let isAdmin = false;
          const token = await authService.issueJwtToken({ id: findUserResponse.id, email: findUserResponse.email, wallet: findUserResponse ? findUserResponse.walletAddress : '' });
          // let userMapping = await userService.getUserMapping(findUserResponse.id);
          // if (userMapping) {
          //   xanaliaToken = await authService.issueJwtToken({ id: userMapping.mongoId });
          // }
          let encryptedId = await cryptoService.encrypt(findUserResponse.id);
          if (findUserResponse.role == 1) isAdmin = true;
          let user = {
            id: findUserResponse.id,
            name: findUserResponse.name ? findUserResponse.name : '',
            email: findUserResponse.email ? findUserResponse.email : '',
            phoneNumber: findUserResponse.phoneNumber ? findUserResponse.phoneNumber : '',
            coins: findUserResponse.coins ? findUserResponse.coins : '0.00'
          };
          const globalVariable = global;
          globalVariable.io.emit('destroyedDevices', { userDeviceIdArray: device });
          return res.status(200).json({ success: true, data: { token, xanaliaToken, encryptedId, user, isAdmin }, msg: 'User sign in successfully' });
        } else {
          return res.status(400).json({ success: false, data: null, msg: 'Password is incorrect' });
        }
      } else {
        return res.status(400).json({ success: false, data: null, msg: 'User is not verified or registered' });
      }
    } else if (phoneNumber) {
      let findUserResponse = await userService.getUserByPhone(phoneNumber);
      if (!findUserResponse) {
        return res.status(400).json({ success: false, data: null, msg: 'User does not exists with this number' });
      } else if (findUserResponse && findUserResponse.isVerified && findUserResponse.isRegister) {
        if (await becryptService.comparePassword(req.body.password, findUserResponse.password)) {

          const device = await manageUserDevices(findUserResponse.id, req.body.deviceId, findUserResponse.userInfo, true);
          let isAdmin = false;
          const token = await authService.issueJwtToken({ id: findUserResponse.id, wallet: findUserResponse.walletAddress || '' });
          let encryptedId = await cryptoService.encrypt(findUserResponse.id);
          if (findUserResponse.role == 1) isAdmin = true;
          let user = {
            id: findUserResponse.id,
            name: findUserResponse.name ? findUserResponse.name : '',
            email: findUserResponse.email ? findUserResponse.email : '',
            phoneNumber: findUserResponse.phoneNumber ? findUserResponse.phoneNumber : '',
            coins: findUserResponse.coins ? findUserResponse.coins : '0.00'
          };
          const globalVariable = global;
          console.info('user device id$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$    ' + device + '        $$$$$$$$$$$$$$$$$$$$$');
          globalVariable.io.emit('destroyedDevices', device);
          return res.status(200).json({ success: true, data: { token, xanaliaToken, encryptedId, user, isAdmin }, msg: 'User sign in successfully' });
        } else {
          return res.status(400).json({ success: false, data: null, msg: 'Password is incorrect' });
        }
      } else {
        return res.status(400).json({ success: false, data: null, msg: 'User is not verified or registered' });
      }
    }
  } catch (error) {
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};
/**
 * @api {post} /auth/sign-in   Sign In
 * @apiName Sign In
 * @apiGroup Authentication
 * @apiParam {String}  email  Email of User `Mandatory`.
 * @apiParam {String}  phoneNumber  Phone Number of User `Mandatory`.
 * @apiParam {String}  password  password of user `Mandatory`.
 * @apiParam {String}  deviceId  deviceId of user `Mandatory`.
 * @apiDescription  User Service..
 */
module.exports.signIn = async (req, res) => {
  try {
    let email = req.body.email;
    let phoneNumber = req.body.phoneNumber;
    let xanaliaToken = null;
    if (!email && !phoneNumber) {
      return res.status(400).json({ success: false, data: null, msg: 'Invalid request parameter atleast one parameter is required' });
    } else if (email) {
      let findUserResponse = await userService.getUserByEmail(email);
      if (!findUserResponse) {
        return res.status(400).json({ success: false, data: null, msg: 'User does not exists with this email' });
      } else if (findUserResponse && findUserResponse.isVerified && findUserResponse.isRegister) {
        if (await becryptService.comparePassword(req.body.password, findUserResponse.password)) {
          if (findUserResponse.userInfo == 3) {
            let userDevice = await userService.getUserDevices(findUserResponse.id, findUserResponse.userInfo);
            if (userDevice) {
              if (userDevice.deviceId.toLowerCase() == req.body.deviceId.toLowerCase()) {
                if (new Date(userDevice.expiredIn) >= new Date()) {
                  //   return res.status(200).json({ success: false, data: null, msg: 'You are already logged in another device Please logout from that device' });
                  // } else {
                  await userService.updateUserDevice(userDevice.id, {
                    deviceId: req.body.deviceId,
                    expiredIn: new Date(new Date().setHours(new Date().getHours() + 48)),
                    userInfo: findUserResponse.userInfo,
                    native_app_id: app_id
                  });
                }
              } else {
                return res.status(200).json({ success: false, data: null, msg: 'You are already logged in another device Please logout from that device' });
              }
            } else {
              await userService.saveUserDevice({
                userId: findUserResponse.id,
                deviceId: req.body.deviceId,
                expiredIn: new Date(new Date().setHours(new Date().getHours() + 48)),
                userInfo: findUserResponse.userInfo,
                native_app_id: app_id
              });
            }
          }
          let isAdmin = false;
          const token = await authService.issueJwtToken({ id: findUserResponse.id, wallet: findUserResponse.walletAddress || '' });
          // let userMapping = await userService.getUserMapping(findUserResponse.id);
          // if (userMapping) {
          //   xanaliaToken = await authService.issueJwtToken({ id: userMapping.mongoId });
          // }
          let encryptedId = await cryptoService.encrypt(findUserResponse.id);
          if (findUserResponse.role == 1) isAdmin = true;
          let user = {
            id: findUserResponse.id,
            name: findUserResponse.name ? findUserResponse.name : '',
            email: findUserResponse.email ? findUserResponse.email : '',
            phoneNumber: findUserResponse.phoneNumber ? findUserResponse.phoneNumber : '',
            coins: findUserResponse.coins ? findUserResponse.coins : '0.00',
            walletAddress: findUserResponse.walletAddress ? findUserResponse.walletAddress : '',
            new_login: findUserResponse.rfm_first_login
          };
          console.info(user, 'user');
          return res.status(200).json({ success: true, data: { token, xanaliaToken, encryptedId, user, isAdmin }, msg: 'User sign in successfully' });
        } else {
          return res.status(400).json({ success: false, data: null, msg: 'Password is incorrect' });
        }
      } else {
        return res.status(400).json({ success: false, data: null, msg: 'User is not verified or registered' });
      }
    } else if (phoneNumber) {
      let findUserResponse = await userService.getUserByPhone(phoneNumber);
      if (!findUserResponse) {
        return res.status(400).json({ success: false, data: null, msg: 'User does not exists with this number' });
      } else if (findUserResponse && findUserResponse.isVerified && findUserResponse.isRegister) {
        if (await becryptService.comparePassword(req.body.password, findUserResponse.password)) {
          if (findUserResponse.userInfo == 3) {
            let userDevice = await userService.getUserDevices(findUserResponse.id, findUserResponse.userInfo);
            if (userDevice) {
              if (userDevice.deviceId.toLowerCase() != req.body.deviceId.toLowerCase()) {
                if (new Date(userDevice.expiredIn) >= new Date()) {
                  return res.status(200).json({ success: false, data: null, msg: 'You are already logged in another device Please logout from that device' });
                } else {
                  await userService.updateUserDevice(userDevice.id, {
                    deviceId: req.body.deviceId,
                    expiredIn: new Date(new Date().setHours(new Date().getHours() + 48)),
                    userInfo: findUserResponse.userInfo
                  });
                }
              }
            } else {
              await userService.saveUserDevice({
                userId: findUserResponse.id,
                deviceId: req.body.deviceId,
                expiredIn: new Date(new Date().setHours(new Date().getHours() + 48)),
                userInfo: findUserResponse.userInfo
              });
            }
          }

          let isAdmin = false;
          const token = await authService.issueJwtToken({ id: findUserResponse.id, wallet: findUserResponse.walletAddress || '' });
          let encryptedId = await cryptoService.encrypt(findUserResponse.id);
          if (findUserResponse.role == 1) isAdmin = true;
          let user = {
            id: findUserResponse.id,
            name: findUserResponse.name ? findUserResponse.name : '',
            email: findUserResponse.email ? findUserResponse.email : '',
            phoneNumber: findUserResponse.phoneNumber ? findUserResponse.phoneNumber : '',
            coins: findUserResponse.coins ? findUserResponse.coins : '0.00',
            walletAddress: findUserResponse.walletAddress ? findUserResponse.walletAddress : ''
          };
          // console.log(user);
          return res.status(200).json({ success: true, data: { token, xanaliaToken, encryptedId, user, isAdmin }, msg: 'User sign in successfully' });
        } else {
          return res.status(400).json({ success: false, data: null, msg: 'Password is incorrect' });
        }
      } else {
        return res.status(400).json({ success: false, data: null, msg: 'User is not verified or registered' });
      }
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};
/**
 * @api {post} /auth/logout-from-other   Logout from Other devices
 * @apiName Logout from Other devices
 * @apiGroup Authentication
 * @apiParam {String}  email  Email of User `Mandatory`.
 * @apiParam {String}  phoneNumber  Phone Number of User `Mandatory`.
 * @apiParam {String}  password  password of user `Mandatory`.
 * @apiDescription  User Service..
 */
module.exports.logoutFromOtherDevices = async (req, res) => {
  try {
    let email = req.body.email;
    let phoneNumber = req.body.phoneNumber;
    if (!email && !phoneNumber) {
      return res.status(400).json({ success: false, data: null, msg: 'Invalid request parameter atleast one parameter is required' });
    } else if (email) {
      let findUserResponse = await userService.getUserByEmail(email);
      if (!findUserResponse) {
        return res.status(400).json({ success: false, data: null, msg: 'User does not exists with this email' });
      } else if (findUserResponse && findUserResponse.isVerified && findUserResponse.isRegister) {
        if (await becryptService.comparePassword(req.body.password, findUserResponse.password)) {
          await deviceTokenService.destroyDeviceTokenByUserId(findUserResponse.id);
          let userDestroyRes = await userService.destroyUserDevices(findUserResponse.id);
          if (userDestroyRes) return res.status(200).json({ success: true, data: null, msg: 'User logout successfully' });
          else return res.status(400).json({ success: false, data: null, msg: 'User not logout' });
        } else {
          return res.status(400).json({ success: false, data: null, msg: 'Password is incorrect' });
        }
      } else {
        return res.status(400).json({ success: false, data: null, msg: 'User is not verified or registered' });
      }
    } else if (phoneNumber) {
      let findUserResponse = await userService.getUserByPhone(phoneNumber);
      if (!findUserResponse) {
        return res.status(400).json({ success: false, data: null, msg: 'User does not exists with this number' });
      } else if (findUserResponse && findUserResponse.isVerified && findUserResponse.isRegister) {
        if (await becryptService.comparePassword(req.body.password, findUserResponse.password)) {
          await deviceTokenService.destroyDeviceTokenByUserId(findUserResponse.id);
          let userDestroyRes = await userService.destroyUserDevices(findUserResponse.id);
          if (userDestroyRes) return res.status(200).json({ success: true, data: null, msg: 'User logout successfully' });
          else return res.status(400).json({ success: false, data: null, msg: 'User not logout' });
        } else {
          return res.status(400).json({ success: false, data: null, msg: 'Password is incorrect' });
        }
      } else {
        return res.status(400).json({ success: false, data: null, msg: 'User is not verified or registered' });
      }
    }
  } catch (error) {
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};

/**
 * @api {post} /auth/login-as-guest  Login As Guest
 * @apiName Login As Guest
 * @apiGroup Authentication
 * @apiDescription  User Service..
 */
// @ts-ignore
module.exports.loginAsGuest = async (req, res) => {
  try {
    let guestId = 'guest' + Math.random().toString(16).slice(2);
    const token = await authService.issueJwtToken({ id: guestId, isGuest: true });
    let encryptedId = await cryptoService.encrypt(guestId);
    let user = {
      id: guestId,
      name: 'Guest User',
      email: 'Guest User',
      phoneNumber: '',
      coins: '0.00'
    };
    return res.status(200).json({ success: true, data: { token, encryptedId, user }, msg: 'Guest sign in successfully' });
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


/**
 * @api {post} /auth/refresh-user-token   Refresh User Token
 * @apiName RefreshUserToken
 * @apiGroup Authentication
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String}  deviceId deviceId of user `Mandatory`.
 * @apiDescription this api is used to refresh user token, gives new token for expired token.
 */
exports.refreshUserToken = async (req, res) => {
  try {
    let token = req.headers.authorization;
    if (token) {
      await authService.verifyJwtToken(token, async function (err, decoded) {
        if (err) {
          return res.status(403).json({ success: false, data: err, msg: 'Invalid token' });
        } else {
          if (!req.body.deviceId) return res.status(400).json({ success: false, data: null, msg: 'Device Id is required' });
          let user = await userService.getUserById(decoded.id);
          if (!user) return res.status(400).json({ success: false, data: null, msg: 'User does not exists' });

          try {
            await manageUserDevices(user.id, req.body.deviceId, user.userInfo);
          } catch (error) {
            return res.status(400).json({ success: false, data: null, msg: error.message || 'Error occured while managing user devices' });
          }
          const token = await authService.issueJwtToken({ id: user.id, wallet: user.walletAddress || '', role: user.role });
          let encryptedId = await cryptoService.encrypt(user.id);
          // let userMapping = await userService.getUserMapping(user.id);
          let xanaliaToken = null;
          // if (userMapping) {
          //   xanaliaToken = await authService.issueJwtToken({ id: userMapping.mongoId });
          // }
          let isAdmin = false;
          if (user.role == 1) isAdmin = true;
          let userRes = {
            id: user.id,
            name: user.name ? user.name : '',
            email: user.email ? user.email : '',
            phoneNumber: user.phoneNumber ? user.phoneNumber : '',
            coins: user.coins ? user.coins : '0.00',
            walletAddress: user.walletAddress ? user.walletAddress : '',
            new_login: user.rfm_first_login
          };

          return res.status(200).json({ success: true, data: { token, xanaliaToken, encryptedId, user: userRes, isAdmin }, msg: 'User sign in successfully' });
        }
      });
    } else {
      return res.status(403).json({ success: false, data: null, msg: 'Invalid token' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};



/**
 * @api {delete} /auth/delete-account Delete Account
 * @apiName DeleteAccount
 * @apiGroup Authentication
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiDescription this api is used to delete user account
 */
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.decoded.id;
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(400).json({ success: false, data: null, msg: 'User does not exists' });
    }
    const del_acc = await userService.deleteUserAccount(userId);
    if (!del_acc) {
      return res.status(400).json({ success: false, data: null, msg: 'Failed to delete account' });
    }

    leaderboardService.updateLeaderboardOnAccDelete(userId);

    return res.status(200).json({ success: true, data: null, msg: 'Account deleted successfully' });
  } catch (error) {
    let errCode = 500, errObj = { success: false, data: error, msg: error.message || 'Internal server error' };

    if (error instanceof UserInputError) {
      errCode = error.code || 400;
      errObj = { success: false, data: null, msg: error.message };
      // return res.status(400).json({ success: false, data: null, msg: error.message });
    }
    return res.status(errCode).json(errObj);
  }
}




/**
 * @api {post} /auth/verify-signature-destroy-devices   Verify user Signature Destroy Devices
 * @apiName Verify user Signature Destroy Devices
 * @apiGroup Authentication
 * @apiParam {String}  nonce nonce of User `Mandatory`.
 * @apiParam {String}  signature signature of User `Mandatory`.
 * @apiParam {String}  deviceId  deviceId of user `Optional`.
 * @apiDescription  User Service..
*/
module.exports.verifyUserSignatureDestroyDevices = async (req, res) => {
  try {
    // const app_id = 'nftduel';
    let findUserResponse = await userService.getUserByNonce(req.body.nonce);
    if (!findUserResponse) {
      return res.status(400).json({ success: false, data: null, msg: 'Invalid Nonce' });
    }
    // let response = web3Object.eth.accounts.recover(findUserResponse.nonce, req.body.signature);
    let response = await onchain.verify_user_signature(findUserResponse.nonce, req.body.signature);
    if (findUserResponse.walletAddress.toLowerCase() != response.toLowerCase()) {
      return res.status(400).json({ success: false, data: null, msg: 'Could not verify signature' });
    }

    await manageUserDevices(findUserResponse.id, req.body.deviceId, findUserResponse.userInfo, true);

    const username = findUserResponse.name ? findUserResponse.name : (!isEmpty(findUserResponse.walletAddress) ? findUserResponse.walletAddress.substring(0, 6) : '');

    await userService.updateUser(findUserResponse.id, { nonce: '', isVerified: true, name: username });
    //* creating user league when a user completes registration via wallet login.
    const league = await userService.findUserLeague(findUserResponse.id);
    if (findUserResponse.userInfo == 3 && !league) {
      let maxRankObj = await userService.findMaxGlobalRankOverAll();
      await userService.createUserLeague({ userId: findUserResponse.id, leagueId: 1, seriesId: 0, rating: 0, global_rank: 0 });
      //   await blockchain.registerNewUserLeague(findUserResponse.walletAddress);
    }
    let encryptedId = await cryptoService.encrypt(findUserResponse.id);
    const token = await authService.issueJwtToken({ id: findUserResponse.id, wallet: findUserResponse.walletAddress });
    let user = {
      id: findUserResponse.id,
      name: username,
      walletAddress: findUserResponse.walletAddress || '',
      email: findUserResponse.email ? findUserResponse.email : '',
      phoneNumber: findUserResponse.phoneNumber ? findUserResponse.phoneNumber : '',
      coins: findUserResponse.coins ? findUserResponse.coins : '0.00',
      new_login: findUserResponse.tcg_first_login
    };
    // console.log('user device id$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$    ' + destroyDevice + '        $$$$$$$$$$$$$$$$$$$$$');
    // globalVariable.io.emit('destroyedDevices', destroyDevice);
    return res.status(200).json({ success: true, data: { token, encryptedId, user }, msg: 'User connected successfully' });
  } catch (error) {
    console.error(error);
    return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
  }
};

async function UserRegisterPostwork(user) {
  try {
    const league = await userService.findUserLeague(user.id);
    //* now changing all user metadata(userInfo) to 3, because they belong to xana universe, if there need comes to seperate them based on subverse, then we'll have to rethink again.
    // if (user.userInfo == 3) {

    //* get current league season (league lock feature)
    const currentSeason = { id: 0, seasonId: 0, default_league: 1, default_rating: 0 };
    const seasonId = currentSeason && currentSeason.seasonId ? currentSeason.seasonId : null;
    const LP = league && league.rating ? league.rating : currentSeason && currentSeason.default_rating ? currentSeason.default_rating : 0,
      league_id = league && league.leagueId ? league.leagueId : currentSeason && currentSeason.default_league ? currentSeason.default_league : 1;
    let league_name = 'Trial';

    if (!league) {
      console.info('user does not have league in xana DB, creating league for user ', user.walletAddress);
      if (league_id) {
        let league = await userService.getLeagueById(league_id);
        if (!league) throw new Error('default league not set');
        league_name = league.name;
      }
      let maxRankObj = await userService.findMaxGlobalRankOverAll();
      await userService.createUserLeague({ userId: user.id, leagueId: league_id, seriesId: 1, rating: LP, seasonId, global_rank: maxRankObj.maxGlobalRank });
    }
    //* we have to check if user has default data on chain but season is running so by default we have to update his data accordingly to season LP and league

    await userService.updateUserLeague({ rating: LP, leagueId: league && league.leagueId ? league.leagueId : league_id, seasonId: seasonId }, user.id);

  } catch (error) {
    throw error;
  }
}


/**
 * @api {post} /auth/verify-signature   Verify user Signature
 * @apiName Verify user Signature
 * @apiGroup Authentication
 * @apiBody {String}  nonce nonce of User `Mandatory`.
 * @apiBody {String}  signature signature of User `Mandatory`.
 * @apiBody {String}  deviceId  deviceId of user `Optional`.
 * @apiDescription  API to verify private signature of user with provided nonce..
 */
exports.verifyUserSignature = async (req, res) => {
  try {
    let findUserResponse = await userService.getUserByNonce(req.body.nonce);

    if (!findUserResponse) {
      return res.status(400).json({ success: false, data: null, msg: 'Invalid Nonce' });
    }

    //fetching user details from blockchain
    let response = await onchain.verify_user_signature(findUserResponse.nonce, req.body.signature);

    if (findUserResponse.walletAddress.toLowerCase() != response.toLowerCase()) {
      return res.status(400).json({ success: false, data: null, msg: 'Could not verify signature' });
    }

    await manageUserDevices(findUserResponse.id, req.body.deviceId, findUserResponse.userInfo);

    const username = findUserResponse.name ? findUserResponse.name : (!isEmpty(findUserResponse.walletAddress) ? findUserResponse.walletAddress.substring(0, 6) : '');

    await userService.updateUser(findUserResponse.id, { nonce: '', isVerified: true, name: username });
    await UserRegisterPostwork(findUserResponse);

    const league = await userService.findUserLeague(findUserResponse.id);
    if (!league) {
      let maxRankObj = await userService.findMaxGlobalRankOverAll();
      await userService.createUserLeague({ userId: findUserResponse.id, leagueId: 1, seriesId: 0, rating: 0, global_rank: 0 });
    }

    let encryptedId = await cryptoService.encrypt(findUserResponse.id);
    const token = await authService.issueJwtToken({ id: findUserResponse.id, wallet: findUserResponse.walletAddress });
    let user = {
      id: findUserResponse.id,
      name: username,
      email: findUserResponse.email ? findUserResponse.email : '',
      phoneNumber: findUserResponse.phoneNumber ? findUserResponse.phoneNumber : '',
      coins: findUserResponse.coins ? findUserResponse.coins : '0.00',
      walletAddress: findUserResponse.walletAddress ? findUserResponse.walletAddress : '',
      new_login: findUserResponse.tcg_first_login
    };
    console.info(token, "---token---665")
    console.info(user, "---user---666")
    return res.status(200).json({ success: true, data: { token, encryptedId, user }, msg: 'User connected successfully' });
  } catch (error) {
    console.error(error, '------------   ERROR VERIFYING USER SIGNATURE   --------------------');
    return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
  }
};


/**
 * @api {post} /users/logout  Logout
 * @apiName Logout
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String}  deviceId  deviceId of User `Mandatory`.
 * @apiGroup Authentication
 * @apiDescription  User Service..
 */
module.exports.logout = async (req, res) => {
  try {
    let userId = req.decoded.id;
    // await userService.destroyUserDevices(userId);
    const app_id = pkg.name;
    const rfm_device = await deviceTokenService.getRfmDevice(userId, req.body.deviceId, app_id);
    if (!rfm_device) return res.status(400).json({ success: false, data: null, msg: 'device not found' })
    const del_device = await deviceTokenService.destroyRfmDevice(userId, req.body.deviceId, app_id);
    try {
      const { data } = await axios.post(`${config.xanalia_url}/mobile-notifications/delete-device-against-user`, {
        userId: userId,
        deviceToken: req.body.deviceId
      });
    } catch (error) {
      console.error('error in logout from xanalia', error);
    }
    if (del_device) return res.status(200).json({ success: true, data: null, msg: 'logged out successfully' })
    let tokenRes = await deviceTokenService.getDeviceToken(userId, req.body.deviceId);
    if (!tokenRes) {
      return res.status(200).json({ success: false, data: null, msg: 'Device token is not present' });
    } else {
      let createTokenRes = await deviceTokenService.destroyDeviceToken(tokenRes.id);
      if (createTokenRes == 1) return res.status(200).json({ success: true, data: null, msg: 'User logout successfully' });
      else
        return res.status(400).json({ success: false, data: null, msg: 'Error occurs during logout' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};



/**
 * @api {post} /auth/save-device-from-xanalia/ Save Device From Xanalia
 * @apiName Save Device From Xanalia
 * @apiGroup Auth
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String}  deviceId  deviceId of user `Mandatory`.
 * @apiParam {Boolean} [forced]  force to save device `Optional`.
 * @apiDescription This API is used to save device from xanalia for builder SNS login
 */
exports.saveDeviceFromXanalia = async (req, res) => {
  try {
    const userId = req.decoded.id;
    const { deviceId } = req.body;
    const is_forced = req.body.forced ? (req.body.forced == true ? true : false) : false;
    const RFMUSERINFO = 4;
    /**
     * There was an issue happening with the new user, its rating was being set to 199 when logged in using email(SNS in xanalia). so trying this patch to fix the issue.
     */

    //* check if its new user, if its new then reset its league on chain
    const usr = await userService.getUserById(userId);
    // if (usr.tcg_first_login) {
    // get users league data
    const ul_db = await userService.findUserLeague(usr.id);
    if (!ul_db) {
      let maxRankObj = await userService.findMaxGlobalRankOverAll();
      let newlg = await userService.createUserLeague({
        userId: usr.id,
        leagueId: 1,
        rating: 0,
        wins: 0,
        loose: 0,
        draw: 0,
        maxStreak: 0,
        rankByLeague: 0,
        rankBySeries: 0,
        global_rank: 0
      });
      console.info("User league created", newlg);
    }

    //* check if device already exists
    const device = await manageUserDevices(userId, deviceId, RFMUSERINFO, is_forced);
    if (!device) {
      return res.status(500).json({ success: false, data: null, msg: 'Failed to save device' });
    }
    // update userInfo to 3
    const user = await userService.updateUser(userId, { userInfo: RFMUSERINFO });
    return res.status(200).json({ success: true, data: { device, user }, msg: 'Device Updated' });
  } catch (error) {
    console.error('Error in saveDeviceFromXanalia', error);
    if (error instanceof UserInputError) {
      return res.status(error.code || 400).json({ success: false, data: null, msg: error.message });
    }
    return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
  }
};


/**
 *  THIS IS IPORTANT ROUTE, DONT DELETE IT. ITS NOT LISTED ON PURPOSE
 */

exports.syncUserFromXanalia = async (req, res) => {
  let userId, wallet, email
  try {
    userId = req.decoded.id;
    wallet = req.decoded.wallet;
    email = req.body.email;
    if (isEmpty(email)) {
      throw new UserInputError('Email is required');
    }
    // get user by eamil
    const usrByMail = await userService.getUserByEmail(email);
    //check if ids are same
    if (usrByMail && usrByMail.id !== userId) {
      throw new UserInputError('Email already exists with different ID');
    }

    // get user by wallet
    const usrByWallet = await userService.getUserByWallet(wallet);
    //check if ids are same
    if (usrByWallet && usrByWallet.id !== userId) {
      throw new UserInputError('Wallet already exists with different ID');
    }

    if (userId === usrByMail.id && usrByMail.walletAddress && (usrByMail.walletAddress).toLowerCase() === (wallet).toLowerCase()) {
      throw new UserInputError('User already synced', 200);
    }

    if (userId === usrByMail.id && !usrByMail.walletAddress) {
      await userService.updateUser(usrByMail.id, { walletAddress: wallet });
    }

    // disabled for now
    // if (userId !== usrByWallet.id && !usrByWallet.email) {
    //   await userService.updateUser(usrByWallet.id, { email });
    // }

    // write data on table
    await userService.saveDBSyncAPICalls({ user_id: userId, request: JSON.stringify({ userId, wallet, email }), response: JSON.stringify({ success: true, data: null, msg: 'User Synced' }), error: null })

    // return res
    return res.status(200).json({ success: true, data: null, msg: 'User Synced' });

  } catch (error) {
    // write all errors to table
    console.error('Error in sync DeviceFromXanalia', error);
    let errCode = 500, errObj = { success: false, data: error, msg: error.message || 'Internal server error' };

    if (error instanceof UserInputError) {
      errCode = error.code || 400;
      errObj = { success: false, data: null, msg: error.message };
      // return res.status(400).json({ success: false, data: null, msg: error.message });
    }
    try {
      const data = await userService.saveDBSyncAPICalls({ user_id: userId, request: JSON.stringify({ userId, wallet, email }), response: JSON.stringify({ success: false, data: null }), error: JSON.stringify({ errCode, errObj }) })
      console.info(data, "---data---840")
    } catch (error) {
      console.error('Error in sync DeviceFromXanalia', error);
    }
    return res.status(errCode).json(errObj);
  }
}
