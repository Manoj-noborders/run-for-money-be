//@ts-check
const router = require('express').Router();
const validator = require('express-joi-validation').createValidator({ passError: true })
const userValidator = require('../validate-model/userModel.js')
const userController = require('../controller/userController');
const { authChecker } = require('../middleware/auth.js');
const skillsCtrl = require('../controller/skillsController.js');

// router.options('*', cors());
router.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

const rateLimit = require('express-rate-limit');
// @ts-ignore
const reqLimit = rateLimit({
    windowMs: 2 * 1000, //  X * 1000 (seconds)
    max: 1, // Limit each IP to 1 create battle requests per `window` (here, per second)
    message: 'Too many request created from this IP, please try again after 2 seconds',
    standardHeaders: true // Return rate limit info in the `RateLimit-*` headers
    // legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});


/**
 * Start defining routes from here, RFM v2 launch FEB 2024
 */

router.put('/set-rfm-first-login-to-false', authChecker, userController.setRfmFirstLoginToFalse);
router.post('/set-user-avatar', authChecker, validator.body(userValidator.setUserAvatar), userController.setAvatarData);
router.put('/set-rfm-first-login', authChecker, validator.body(userValidator.setRfmFirstLogin), userController.setRfmFirstLogin);
router.delete('/remove-user-avatar', authChecker, userController.removeAvatarData);
router.get('/get-users-global-rank/:pageNumber/:pageSize/', validator.params(userValidator.pagination), userController.getUsersUniversalRank);

router.post('/set-name', authChecker, userController.setName);
router.post('/update-profile-image', authChecker, validator.body(userValidator.image_urlSchema), userController.updateUserProfile);
router.post('/set-device-token', authChecker, validator.body(userValidator.setDeviceToken), userController.setDeviceToken);
// router.get('/get-user', userController.getUser)
router.get('/get-user', authChecker, userController.getUser)
router.get('/get-user-data-on-wallet/:walletAddress', userController.getUserDataByWalletAddress)


// //get user occupied assets
router.get('/get-asset-json/:id', userController.getClothAssetJson)

router.get('/v2/get-asset-json/:id', userController.getClothAssetJsonV2);

router.get('/get-asset-json-by-creator/:userId', userController.getClothAssetJsonByCreatorFxn);

// //User Abilities APIs
router.post('/set-user-abilities', authChecker, validator.body(userValidator.userAbilityDto), userController.setUserAbilities);
router.get('/get-user-abilities', authChecker, userController.getUserAbilities)
router.put('/remove-user-abilities', authChecker, validator.body(userValidator.userAbilityDto), userController.removeUserAbilities)


// //Run only for re-calculating global ranks
// router.post('/recalc-user-global-ranks', userController.recalcUserGlobalRanks);

// //get user xeta balance
//!!! Please remove this later as it is not needed, just for backward compatibility, dated Oct 16 2024. when next version is launched deprecate these
router.get('/get-xeta-balance', authChecker, userController.getUserXetaBalance);

router.get('/get-all-skills', authChecker, skillsCtrl.getAvailableSkills);

router.post('/acquire-skill/:skillId', authChecker, skillsCtrl.acquireSkill);

router.get('/get-user-skills/:userId', authChecker, skillsCtrl.getUserSkills);

router.get('/get-home-screen-data', authChecker, userController.getHomeScreenData);

router.get('/v2/get-home-screen-data', authChecker, userController.getHomeScreenDataV2);

router.get('/v3/get-home-screen-data', authChecker, userController.getHomeScreenDataV3);

router.get('/get-user-profile-picture/:userId', authChecker, userController.getUserProfilePicture);

module.exports = router;
