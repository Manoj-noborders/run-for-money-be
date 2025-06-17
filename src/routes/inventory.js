//@ts-check

const router = require('express').Router();
const ctrl = require('../controller/inventory.controller');
const { authChecker } = require('../middleware/auth');


router.get('/get-all-abilities', ctrl.getGameAbilitiessList);

router.get('/get-user-inventory', authChecker, ctrl.getUserAbilities);

router.post('/create-my-abilities', authChecker, ctrl.createBasicAbilitiesForUser);

router.put('/toggle-equip-ability/:abilityId', authChecker, ctrl.toggleEquipAbility);

router.put('/v2/toggle-equip-ability/:abilityId', authChecker, ctrl.toggleEquipAbilityV2);

router.put('/burn-special-skill', authChecker, ctrl.burnSpecialSkill);


module.exports = router;