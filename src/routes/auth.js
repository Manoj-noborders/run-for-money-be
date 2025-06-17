const router = require('express').Router();
const validator = require('express-joi-validation').createValidator({ passError: true });
const middleware = require('../middleware/auth');
const authValidator = require('../validate-model/authModel');
const authCtrl = require('../controller/authController');


/**
 * Auth APIs
 */
router.post('/verify-signature', validator.body(authValidator.verifyUserSignatureV2), authCtrl.verifyUserSignature);
router.post('/verify-signature-destroy-devices', validator.body(authValidator.verifySignature), authCtrl.verifyUserSignatureDestroyDevices);
router.post('/get-user-nonce', validator.body(authValidator.getUserNonce), authCtrl.getUserNonce);
router.post('/save-user-nonce', validator.body(authValidator.saveUserNonce), authCtrl.saveUserNonce);
router.post('/sign-in', validator.body(authValidator.signIn), authCtrl.signIn);
router.post('/sign-in-destroy-devices', validator.body(authValidator.signIn), authCtrl.signInDestroyDevices);
router.post('/logout-from-other', validator.body(authValidator.logoutFromOtherDevices), authCtrl.logoutFromOtherDevices);
router.post('/login-as-guest', authCtrl.loginAsGuest);
router.post('/refresh-user-token', validator.body(authValidator.deviceIdVldtr), authCtrl.refreshUserToken);
router.delete('/delete-account', middleware.authChecker, authCtrl.deleteAccount);
router.post('/logout', middleware.authChecker, validator.body(authValidator.deviceIdVldtr), authCtrl.logout);

// External dependency routes
router.post('/save-device-from-xanalia/', validator.body(authValidator.saveDeviceFromXanaliaSchema), middleware.authChecker, authCtrl.saveDeviceFromXanalia);

router.post('/sync-xanalia-user', middleware.authChecker, authCtrl.syncUserFromXanalia);


module.exports = router;
