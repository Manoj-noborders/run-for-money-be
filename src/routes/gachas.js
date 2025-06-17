//@ts-check

const router = require('express').Router();
const ctrl = require('../controller/gachaController');
const validator = require('express-joi-validation').createValidator({ passError: true });
const { authChecker } = require('../middleware/auth');
const vms = require('../validate-model/gacha.model');

router.get('/get-all-gachas', authChecker, ctrl.getGameGachas);

router.get('/get-all-gacha-items', authChecker, ctrl.getGachaItemsList);

router.get('/get-inapp-items', validator.query(vms.gachaItemSchema), authChecker, ctrl.getInAppItems);

router.get('/user-tickets/', authChecker, ctrl.getUserGachaTickets)

router.get('/user-gacha-levels/', authChecker, ctrl.getUserGachaLevelDetails);

router.post('/spin', validator.body(vms.spinGachaSchema), authChecker, ctrl.spinGacha);

router.post('/v2/spin', validator.body(vms.spinGachaSchemaV2), authChecker, ctrl.spinGachaV2);

router.post('/v3/spin', validator.body(vms.spinGachaSchemaV2), authChecker, ctrl.spinGachaV3);

// router.get('/parameter-lvl-set', ctrl.setParamLevelFxn);

router.post('/purchase-ticket', validator.body(vms.purchaseGachaTicketSchema), authChecker, ctrl.purchaseGachaTicket);

router.put('/apply-parameter', validator.body(vms.applyParameterGachaResultSchema), authChecker, ctrl.applyParameterGachaResult);

router.put('/burn-special-skill', validator.body(vms.burnSpclSkillSchema), authChecker, ctrl.burnSpecialSkill);

router.get('/user-gacha-spin-logs', validator.query(vms.userGachaSpinLogs), authChecker, ctrl.getUserGachaSpinLogs);

module.exports = router;