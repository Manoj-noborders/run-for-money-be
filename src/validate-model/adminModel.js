const Joi = require("joi");

exports.createUpdateAppVersion = Joi.object({
    version: Joi.string().required(),
    platform: Joi.string().valid('android', 'ios', 'pc', 'mac').required(),
    is_live: Joi.boolean().required(),
    forceUpdateRestricted: Joi.boolean().default(false),
    isMaintenance: Joi.boolean().required(),
    appleGuestLogin: Joi.boolean().required()
});


exports.platformValidation = Joi.object({
    platform: Joi.string().valid('android', 'ios', 'pc', 'mac').required(),
    version: Joi.string().optional(),
    is_live: Joi.boolean().optional()
});


exports.updateFeatureControlDto = Joi.object({
    feature_name: Joi.string().required(),
    feature_status: Joi.boolean().required()
});

exports.deleteFeatureControlDto = Joi.object({
    feature_name: Joi.string().required(),
});


exports.addUpdateAppVersion = Joi.object({
    name: Joi.string().required(),
    forceUpdateRestricted: Joi.boolean().required(),
    isMaintenance: Joi.boolean().required()
});


exports.skillSchema = Joi.object({
    // id: Joi.number().integer().min(1).required(),
    skill_name: Joi.string().min(2).max(100).optional(),
    category: Joi.string().uppercase().optional(),
    xp_required: Joi.number().integer().min(0).optional()
});

exports.idSchema = Joi.object({
    id: Joi.number().integer().min(1).required()
});

exports.updateMatchingInterval = Joi.object({
    interval_minutes: Joi.number().integer().min(1).required()
});