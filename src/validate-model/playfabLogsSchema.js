const Joi = require('joi');

// Validation schema using JOI
exports.logSchema = Joi.object({
    match_id: Joi.string().required(),
    player1_id: Joi.number().integer().required(),
    player2_id: Joi.number().integer().required(),
    league_id: Joi.number().integer().required(),
    winner_id: Joi.number().integer(),
    is_draw: Joi.boolean(),
    match_end_time: Joi.date(),
    server_ip: Joi.string(),
    server_port: Joi.number().integer(),
    queue: Joi.string(),
});

// Validation schema using JOI
exports.logUpdateSchema = Joi.object({
    // match_id: Joi.string().required(),
    player1_id: Joi.number().integer().optional(),
    player2_id: Joi.number().integer().optional(),
    league_id: Joi.number().integer().optional(),
    winner_id: Joi.number().integer(),
    log_file: Joi.string(),
    is_draw: Joi.boolean(),
    match_end_time: Joi.date(),
    server_ip: Joi.string(),
    server_port: Joi.number().integer(),
    queue: Joi.string(),
});


exports.presignedSchema = Joi.object({
    filename: Joi.string().min(5).required()
})