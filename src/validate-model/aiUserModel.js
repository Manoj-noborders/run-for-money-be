var Joi = require("joi");


module.exports.getAiUsersDto = Joi.object({
    leagueId: Joi.number().required(),
    userCount: Joi.number().required()
});


module.exports.addAiUser = Joi.object({
    name: Joi.string().required()
});
module.exports.deleteAiUser = Joi.object({
    aiUserId: Joi.number().required()
});
module.exports.updateAiUserStatus = Joi.object({
    aiUserId: Joi.number().required()
});
module.exports.updateAiUserLeagueDetails = Joi.object({
    aiUserId: Joi.number().required(),
    seriesId: Joi.number().required(),
    battleStatus: Joi.number().required()
});


module.exports.addAiFreeUser = Joi.object({
    name: Joi.string().required()
});
module.exports.deleteAiFreeUser = Joi.object({
    aiFreeUserId: Joi.number().required()
});