//@ts-check
const router = require('express').Router();
const validator = require('express-joi-validation').createValidator({ passError: true })
const adminController = require('../controller/adminController.js');
const { authCheckerAdmin } = require('../middleware/authWithAdmin.js');
const { updateFeatureControlDto, addUpdateAppVersion, skillSchema, idSchema, updateMatchingInterval } = require('../validate-model/adminModel.js');


router.post('/admin/update-feature-control', authCheckerAdmin, validator.body(updateFeatureControlDto), adminController.addFeatureControl);
router.get('/admin/get-features-list', adminController.getFeaturesList)

router.get('/app/get-all-version', adminController.getAppVersion)
router.post('/app/add-update-version', authCheckerAdmin, validator.body(addUpdateAppVersion), adminController.addUpdateAppVersion)

router.put('/admin/update-skill/:id',
    authCheckerAdmin,
    validateSkillsPayload,
    adminController.updateSkillDetails);


router.get('/get-matching-interval', adminController.getMatchingInterval);

router.put('/admin/update-matching-interval',
    authCheckerAdmin,
    validator.body(updateMatchingInterval),
    adminController.updateMatchingInterval);

module.exports = router;


function validateSkillsPayload(req, res, next) {
    // Check for empty body
    if (Object.keys(req.body).length === 0)
        return res.status(400).json({ status: false, message: "Request body is empty", data: null });
    // Validate the Params data
    const { error: paramsError } = idSchema.validate(req.params);
    if (paramsError) {
        return res.status(400).json({ status: false, message: paramsError.message, data: null });
    }
    // Validate the Body data
    const { error } = skillSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ status: false, message: error.message, data: null });
    }
    next();
}