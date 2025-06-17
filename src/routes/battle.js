//@ts-check
const router = require('express').Router();
const validator = require('express-joi-validation').createValidator({ passError: true })
const battleValidator = require('../validate-model/battleModel.js')
const battleController = require('../controller/battleController.js');
const { authChecker, authCheckerAdmin } = require('../middleware/auth.js');

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
router.post('/start-new-battle', reqLimit, validator.body(battleValidator.startBattleModel), authChecker, battleController.startNewBattle);
router.post('/end-user-battle', authChecker, validator.body(battleValidator.endBattleFinal), battleController.endUserBattle);

//remove user from battle
router.post('/user-battle-quit', authChecker, validator.body(battleValidator.userId), battleController.removeUserFromBattle);
router.post('/check-user-running-battle', validator.body(battleValidator.userId), battleController.checkUserBattleRunningState);

//playfab API for custom/dummy user
router.post('/create-dummy-user', validator.body(battleValidator.dummyUserDto), battleController.createPlayFabDummyUser);
// router.post('/create-dummy-user', authChecker, validator.body(battleValidator.dummyUserDto), battleController.createPlayFabDummyUser);


router.post('/start', validator.body(battleValidator.startBattleV2Schema),
    authChecker,
    battleController.startBattleV2);

router.post('/end', validator.body(battleValidator.endBattleSchemaV2),
    authChecker,
    battleController.endBattleV2);

router.post('/v3/start', validator.body(battleValidator.startBattleV2Schema),
    authChecker,
    battleController.startBattleV3);

router.post('/v3/end', validator.body(battleValidator.endBattleSchemaV2),
    authChecker,
    battleController.endBattleV3);

// router.post('/v2/user-battle-quit', validator.body(battleValidator.userId), battleController.removeUserFromBattleV2);
router.post('/v2/user-battle-quit', authChecker, validator.body(battleValidator.userId), battleController.removeUserFromBattleV2);
router.post('/v2/check-user-running-battle', validator.body(battleValidator.userId), battleController.checkUserBattleRunningStateV2);

router.get('/leaderboard', validator.query(battleValidator.leaderBoardSchema), authChecker, battleController.getLeaderboard);

router.get('/get-battle-results/:battleId', authChecker, battleController.getBattleResults);

router.post('/upload-game-logs', battleValidator.validateUpload, battleController.uploadGameLogsWithDetails);

router.get('/game-logs/:duelId', validator.params(battleValidator.duelId), validator.query(battleValidator.userIdOpt), authCheckerAdmin, battleController.getGameLogsByBattle);

router.post('/set-game-player-config', authChecker, validator.body(battleValidator.gamePlayerConfigDto), battleController.setGamePlayerConfigFxn);

router.get('/get-game-player-config', authChecker, battleController.getGamePlayerConfigFxn);


module.exports = router;
