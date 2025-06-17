//@ts-check
const router = require('express').Router();
const ctrl = require('../controller/skillsController.js');
const { authChecker } = require('../middleware/auth.js');


router.get('/get-all-skills', authChecker, ctrl.getAvailableSkills);

router.post('/acquire-skill/:skillId', authChecker, ctrl.acquireSkill);

router.get('/get-user-skills/:userId', authChecker, ctrl.getUserSkills);

router.post('/acquire-default-skills', authChecker, ctrl.acquireDefaultSkills);


module.exports = router;