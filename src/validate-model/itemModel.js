var Joi = require('joi');
module.exports.getAllItems = Joi.object({
  subCategories: Joi.string().required(),
  pageNumber: Joi.number().required(),
  pageSize: Joi.number().required(),
  version: Joi.string().allow('').allow(null).optional()
});
module.exports.getUserOccupiedAsset = Joi.object({
  pageNumber: Joi.number().required(),
  pageSize: Joi.number().required()
});
module.exports.getSubCategories = Joi.object({
  categories: Joi.string().required()
});
module.exports.deleteVersion = Joi.object({
  rfmVersionId: Joi.number().required()
});
module.exports.addUpdateVersion = Joi.object({
  name: Joi.string().required(),
  forceUpdateRestricted: Joi.boolean().required()
});
module.exports.addUpdateVersionV2 = Joi.object({
  name: Joi.string().required(),
  forceUpdateRestricted: Joi.boolean().required(),
  isMaintenance: Joi.boolean().required()
});
module.exports.deleteVersion = Joi.object({
  rfmVersionId: Joi.number().required()
});
module.exports.getAllItemsV2 = Joi.object({
  subCategories: Joi.string().required(),
  pageNumber: Joi.number().required(),
  pageSize: Joi.number().required(),
  version: Joi.string().allow('').allow(null).optional(),
  order: Joi.string().valid('asc', 'desc').optional()
});
module.exports.addCardAbilities = Joi.object({
  seriesId: Joi.number().required(),
  seriesName: Joi.string().required(),
  cardName: Joi.string().required(),
  abilityId: Joi.string().required(),
  description: Joi.string().optional().allow(null).allow(''),
  timeToUseAbilties: Joi.string().required(),
  cardEffects: Joi.string().required(),
  is_active: Joi.boolean().optional()
});
module.exports.updateCardAbilities = Joi.object({
  cardName: Joi.string().allow(null).optional().allow(''),
  abilityId: Joi.string().allow(null).optional().allow(''),
  description: Joi.string().optional().allow(null).allow(''),
  timeToUseAbilties: Joi.string().allow(null).optional().allow(''),
  cardEffects: Joi.string().allow(null).optional().allow(''),
  is_active: Joi.boolean().optional()
});
module.exports.addNewSeries = Joi.object({
  seriesName:Joi.string().required()
});
module.exports.updateSeries = Joi.object({
  seriesId:Joi.number().required(),
  seriesName:Joi.string().required()
});
module.exports.deleteSeries = Joi.object({
  seriesId:Joi.number().required(),
});
module.exports.deleteAllCards = Joi.object({
  seriesId:Joi.number().required(),
});
