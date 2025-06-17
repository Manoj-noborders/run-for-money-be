const router = require('express').Router();
const validator = require('express-joi-validation').createValidator({ passError: true });
const aiUserController = require('../controller/aiUserController');
const { authChecker } = require('../middleware/auth');
const { authCheckerAdmin } = require('../middleware/authWithAdmin');
const aiUserModel = require('../validate-model/aiUserModel');


router.get('/get-random-ai-player/:leagueId/:userCount', validator.params(aiUserModel.getAiUsersDto), aiUserController.getRandomAiUser);

router.get('/get-ai-player-abilities', authChecker, aiUserController.getAIBasicAbilities);

// router.post('/add-ai-free-user', authCheckerAdmin, validator.body(aiUserModel.addAiFreeUser), aiUserController.addAiFreeUser);
// router.post('/delete-ai-free-user', authCheckerAdmin, validator.body(aiUserModel.deleteAiFreeUser), aiUserController.deleteAiFreeUser);
// router.get('/get-single-ai-user/:leagueId', validator.params(aiUserModel.getSingleAiUser), aiUserController.getSingleAiUser);
// router.get('/get-ai-free-users', authChecker, aiUserController.getAllAiFreeUser);
// router.get('/get-all-ai-user-battle-counts/:aiUserId', validator.params(aiUserModel.deleteAiUser), aiUserController.getAllAIUserBattlesCounts);
// router.post('/add-ai-user', authCheckerAdmin, validator.body(aiUserModel.addAiUser), aiUserController.addAiUser);
// router.post('/delete-ai-user', authCheckerAdmin, validator.body(aiUserModel.deleteAiUser), aiUserController.deleteAiUser);
// router.get('/get-ai-users', authChecker, aiUserController.getAllAiUser);
// router.get('/v2/get-ai-users', authChecker, aiUserController.getAllAiUser2);


module.exports = router;