const router = require('express').Router();

const { authCheckerAdmin } = require('../middleware/authWithAdmin');
const vldtr = require('../validate-model/season.validator');
const ctrl = require('../controller/seasonController');

const validator = require('express-joi-validation').createValidator({ passError: true });

/**
   * Game Season APIs
   */

router.get('/get-next-season', ctrl.getUpcomingSeason)
router.post('/create', authCheckerAdmin, validator.body(vldtr.addSeason), ctrl.addNewGamePlaySeason);
router.get('/latest-season', ctrl.getLatestGame);
router.put('/:seasonId', authCheckerAdmin, validator.body(vldtr.updateSeason), ctrl.updateGamePlaySeason);
router.delete('/:seasonId', authCheckerAdmin, validator.params(vldtr.deleteSeason), ctrl.deleteNewGamePlaySeason);

// router.get('/get-user-season-treasure-boxes/:userId', middleware.authChecker, ctrl.getUsersSeasonTreasureBoxes);

module.exports = router;