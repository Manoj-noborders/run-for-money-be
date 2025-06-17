var Joi = require('joi');

const timeFormatRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

exports.addSeason = Joi.object({
  seasonId: Joi.number().integer().required(),
  startTime: Joi.date().required(),
  endTime: Joi.date().required(),
  block_time: Joi.string().regex(timeFormatRegex),
  default_league: Joi.number().min(1).max(16),
  default_rating: Joi.number().min(0)
});

exports.updateSeason = Joi.object({
  startTime: Joi.date().required(),
  endTime: Joi.date().required(),
  blockTime: Joi.string().regex(timeFormatRegex).optional(),
  default_league: Joi.number().min(1).max(16).optional(),
  default_rating: Joi.number().min(0).optional()
});


exports.deleteSeason = Joi.object({
  seasonId: Joi.number().required()
});
