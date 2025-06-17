const Joi = require("joi");

const create_game_room = Joi.object({
    roomName: Joi.string().required(),
    league: Joi.number().integer(),
    serverName: Joi.string().min(5).required(),
    gameMode: Joi.number().valid(1, 2).required(),
});

const update_game_room = Joi.object({
    roomName: Joi.string().optional(),
    league: Joi.number().integer().optional(),
    serverName: Joi.string().optional(),
    gameMode: Joi.number().valid(1, 2).optional(),
});

const validate_id = Joi.object({
    id: Joi.number().integer().min(1).required()
});

const room_name = Joi.object({
    room_name: Joi.string().min(6).max(60).required()
})

const searchCriteriaSchema = Joi.object({
    league: Joi.number().integer().required(),
    serverName: Joi.string().required(),
    gameMode: Joi.number().valid(1, 2).required(),
});

exports.validateRoomCreation = async function (req, res, next) {
    const { error } = create_game_room.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

exports.validateRoomUpdate = async function (req, res, next) {
    const { error } = update_game_room.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

exports.validateIdParam = async function (req, res, next) {
    const { error } = validate_id.validate(req.params);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

exports.validateGameRoomSearch = async function (req, res, next) {
    const { error } = searchCriteriaSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}

exports.validateRoomNameParam = async function (req, res, next) {
    const { error } = room_name.validate(req.params);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}


exports.getRandomRoomValidator = async function (req, res, next) {
    const randomRoomParams = Joi.object({
        mode: Joi.number().valid(1, 2).required(),
        serverName: Joi.string().min(5).required()
        // room_name: Joi.string().min(6).max(60).required()
    })

    const { error } = randomRoomParams.validate(req.query);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}


exports.getRoomsByServerAndModeValidator = async function (req, res, next) {
    const randomRoomParams = Joi.object({
        gameMode: Joi.number().valid(1, 2).optional(),
        serverName: Joi.string().min(5).optional()
    })

    const { error } = randomRoomParams.validate(req.query);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
}