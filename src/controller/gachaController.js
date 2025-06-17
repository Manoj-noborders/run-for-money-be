
const svc = require('../services/gacha.service');
const { UserInputError } = require('../utils/classes');


/**
 *          Phase 2 APIs From Here Onwards  ************************************************************************************************
 * 
*/
/**
 * @api {get} /gacha/get-all-gachas  Get All Gachas
 * @apiName Get All Gachas
 * @apiGroup Gacha
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiDescription  This Api gives list of all Gachas available to spin in game..
 * @apiSuccessExample {json} Success-Response:
 * {
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "parameter",
            "description": "Gacha for parameters",
            "cost_gold": "8000",
            "cost_fiat": "0.3",
            "cost_token": "-1",
            "base_mean": null,
            "standard_deviation": "1",
            "scale_factor": null,
            "growth_rate": null
        },
        {
            "id": 2,
            "name": "items",
            "description": "Gacha for items",
            "cost_gold": "8000",
            "cost_fiat": "0.3",
            "cost_token": "-1",
            "base_mean": null,
            "standard_deviation": null,
            "scale_factor": "1",
            "growth_rate": "2"
        },
        {
            "id": 3,
            "name": "skills",
            "description": "Gacha for skills",
            "cost_gold": "-1",
            "cost_fiat": "1",
            "cost_token": "1",
            "base_mean": null,
            "standard_deviation": null,
            "scale_factor": null,
            "growth_rate": null
        }
    ],
    "msg": "Gacha list fetched"
}

    * @apiErrorExample {json} Error-Response:
    * {
        "success": false,
        "data": {},
        "msg": "internal server error"
    }
 */
exports.getGameGachas = async (req, res) => {
    try {
        const gachas = await svc.getGameGachas();
        return res.status(200).json({ success: true, data: gachas, msg: 'Gacha list fetched' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).send({ success: false, data: error, msg: error.message || 'internal server error' });
    }
}

/**
 * @api {get} /gacha/get-inapp-items  Get InApp Items
 * @apiName Get InApp Items
 * @apiGroup Gacha
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String='item','skill','parameter'} [itemType] The type of InApp Items to fetch ("items", "skills" or "parameters").
 * @apiDescription  This Api gives list of all InApp Items..
 * @apiSuccessExample {json} Success-Response:
 * {
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "parameter",
            "description": "Gacha for parameters",
            "image": "parameter.png",
            "cost_gold": "8000",
            "cost_fiat": "0.3",
            "cost_token": "-1"
        },
        {
            "id": 2,
            "name": "items",
            "description": "Gacha for items",
            "image": "items.png",
            "cost_gold": "8000",
            "cost_fiat": "0.3",
            "cost_token": "-1"
        },
        ...
    ],
    "msg": "InApp Items list fetched"
}

    * @apiErrorExample {json} Error-Response:
    * {
        "success": false,
        "data": {},
        "msg": "internal server error"
    }
 */
exports.getInAppItems = async (req, res) => {
    try {
        const itemType = req.query.itemType;
        const items = await svc.getInAppItems(itemType);
        return res.status(200).json({ success: true, data: items, msg: 'InApp Items list fetched' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).send({ success: false, data: error, msg: error.message || 'internal server error' });
    }
}

/**
 * @api {get} /gacha/get-all-gacha-items  Get All Gacha Items
 * @apiName Get All Gacha Items
 * @apiGroup Gacha
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String='item','skill'} gachaType The type of gacha to spin ("skill" or "item").
 * @apiDescription  This Api gives list of all Gacha Items..
 * @apiSuccessExample {json} Success-Response:
 * {
    "success": true,
    "data": [
        {
            "id": 1,
            "gacha_id": 1,
            "ability_name": "Speed",
            "ability_type": "basic",
            "ability_description": null,
            "ability_id": 1,
            "boost_value": 1,
            "description": "Speed boost item"
        },
        {
            "id": 2,
            "gacha_id": 1,
            "ability_name": "Dash Speed",
            "ability_type": "basic",
            "ability_description": null,
            "ability_id": 2,
            "boost_value": 1,
            "description": "Dash Speed boost item"
        },
        ...
    ],
    "msg": "Gacha Items list fetched"
}

 * @apiErrorExample {json} Error-Response:
    * {
        "success": false,
        "data": {},
        "msg": "internal server error"
    }
    *
 */
exports.getGachaItemsList = async (req, res) => {
    try {
        const query = req.query;
        const items = await svc.getAllGachaItems(query);
        return res.status(200).json({ success: true, data: items, msg: 'Gacha Items list fetched' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).send({ success: false, data: error, msg: error.message || 'internal server error' });
    }
}


/**
 * @api {post} /gacha/purchase-ticket  Purchase Gacha Ticket
 * @apiName Purchase Gacha Ticket
 * @apiGroup Gacha
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {Number} gachaId Gacha Id
 * @apiParam {Number} cost Cost of Gacha Ticket
 * @apiParam {String} txn_hash Transaction Hash
 * @apiParam {String='gold','fiat','token'} currency Currency
 * @apiDescription  This Api allows user to purchase Gacha Ticket..
 * 
 */
exports.purchaseGachaTicket = async (req, res) => {
    try {
        const userId = req.decoded.id;
        const { gachaId, cost, txn_hash, currency } = req.body;
        const result = await svc.purchaseGachaTicket({ userId: userId, ...req.body });
        return res.status(200).json({ success: true, data: result, msg: 'Gacha Ticket purchased successfully' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).send({ success: false, data: error, msg: error.message || 'internal server error' });
    }
}

/**
 * @api {get} /gacha/user-tickets  Get User Gacha Tickets
 * @apiName Get User Gacha Tickets
 * @apiGroup Gacha
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {Number} [gachaId] Gacha Id to fetch specific gacha tickets. `Optional`
 * @apiParam {Boolean} [isUsed] Filter to get used or unused tickets. `Optional`
 * @apiDescription  This Api gives list of all Gacha Tickets purchased by user..
 * 
 */
exports.getUserGachaTickets = async (req, res) => {
    try {
        const userId = req.decoded.id;
        console.log(req.query)
        const { gachaId, isUsed } = req.query;
        const usedFlag = isUsed === 'true' ? true : isUsed === 'false' ? false : undefined;
        const userGachaTickets = await svc.getUserGachaTickets(userId, gachaId, { used: usedFlag });
        return res.status(200).json({ success: true, data: userGachaTickets, msg: 'User gacha tickets retrieved successfully' });
    } catch (error) {
        console.error(error);
        if (error instanceof UserInputError) {
            return res.status(400).json({ success: false, data: null, msg: error.message });
        }
        return res.status(error.code || 500).send({ success: false, data: error, msg: error.message || 'internal server error' });
    }
};


/**
 * @api {get} /gacha/user-gacha-levels  Get User Gacha Levels
 * @apiName Get User Gacha Levels
 * @apiGroup Gacha
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {Number} [gachaId] Gacha Id to fetch specific gacha levels. `Optional`
 * @apiDescription  This Api gives list of all Gacha Levels of user..
 */
exports.getUserGachaLevelDetails = async (req, res) => {
    try {
        const userId = req.decoded.id;
        const { gachaId } = req.query;
        const userGachaLevelDetails = await svc.getUserGachaLevelDetails(userId, gachaId);
        return res.status(200).json({ success: true, data: userGachaLevelDetails, msg: 'User gacha level details retrieved successfully' });
    } catch (error) {
        console.error(error);
        if (error instanceof UserInputError) {
            return res.status(400).json({ success: false, data: null, msg: error.message });
        }
        return res.status(error.code || 500).send({ success: false, data: error, msg: error.message || 'internal server error' });
    }
};


/**
 * @api {post} /gacha/spin Spin Gacha
 * @apiName SpinGacha
 * @apiGroup Gacha
 * @apiHeader {String} Authorization User's access token.
 * @apiParam {Number} ticketId The ID of the gacha ticket.
 * @apiParam {String='parameter','item','skill'} gachaType The type of gacha to spin ("parameter", "skill" or "item").
 * @apiSuccess {Object} result The result of the gacha spin.
 * @apiError UserInputError Invalid gacha ticket or ability not found.
 * @apiError (500) InternalServerError Internal server error.
 */
exports.spinGacha = async (req, res) => {
    try {
        const userId = req.decoded.id;
        if (!userId) { throw new UserInputError('User ID is required. Invalid request'); }
        const { ticketId, gachaType } = req.body;

        let result;
        if (gachaType === 'parameter') {
            result = await svc.spinParameterGacha(ticketId, userId);
        } else if (gachaType === 'item') {
            result = await svc.spinItemGacha(ticketId, userId);
        } else if (gachaType === 'skill') {
            result = await svc.spinSkillsGacha(ticketId, userId);
        } else {
            throw new UserInputError('Invalid gacha type');
        }

        return res.status(200).json({ success: true, data: result, msg: 'Gacha spun successfully' });
    } catch (error) {
        console.error(error);
        if (error instanceof UserInputError) {
            return res.status(400).json({ success: false, data: null, msg: error.message });
        }
        return res.status(500).json({ success: false, data: null, msg: 'Internal server error' });
    }
};


/**
 * @api {post} /gacha/v2/spin Spin Gacha V2
 * @apiName SpinGachaV2
 * @apiGroup Gacha
 * @apiHeader {String} Authorization User's access token.
 * @apiParam {Number=1,10} spinCount The number of times to spin the gacha.
 * @apiParam {String='parameter','item','skill'} gachaType The type of gacha to spin ("parameter", "skill" or "item").
 * @apiParam {Boolean} [spendJewels] Flag to spend White jewels for spinning gacha.
 * @apiSuccess {Object} result The result of the gacha spin.
 * @apiError UserInputError Invalid gacha ticket or ability not found.
 * @apiError (500) InternalServerError Internal server error.
 */
exports.spinGachaV2 = async (req, res) => {
    try {
        const userId = req.decoded.id;
        if (!userId) { throw new UserInputError('User ID is required. Invalid request'); }
        const { spinCount, gachaType, spendJewels } = req.body;

        let result;
        if (gachaType === 'parameter') {
            result = await svc.spinParameterGachaV2(spinCount, userId, spendJewels);
        } else if (gachaType === 'item') {
            result = await svc.spinItemGachaV2(spinCount, userId, spendJewels);
        } else if (gachaType === 'skill') {
            result = await svc.spinSkillGachaV2(spinCount, userId, spendJewels);
        } else {
            throw new UserInputError('Invalid gacha type');
        }

        return res.status(200).json({ success: true, data: result, msg: 'Gacha spun successfully' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
    }
};

/**
 * @api {get} /gacha/user-gacha-spin-logs  Get User Gacha Spin Logs
 * @apiName GetUserGachaSpinLogs
 * @apiGroup Gacha
 * @apiHeader {String} Authorization User's access token.
 * @apiParam {Number} gachaId The ID of the gacha.
 * @apiParam {Number} [page=1] The page number.
 * @apiParam {Number} [size=10] The number of items per page.
 * @apiDescription  This Api gives list of all Gacha Spin Logs of user by Gacha ID..
 */
exports.getUserGachaSpinLogs = async (req, res) => {
    try {
        const userId = req.decoded.id;
        const { gachaId, page = 1, size = 10 } = req.query;
        const userGachaSpinLogs = await svc.getGachaSpinLogsOfUser(userId, gachaId, { page, limit: size });
        return res.status(200).json({ success: true, data: userGachaSpinLogs, msg: 'User gacha spin logs retrieved successfully' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
    }
}


/**
 * @api {put} /gacha/apply-parameter Apply Parameter Gacha Result
 * @apiName ApplyParameterGachaResult
 * @apiGroup Gacha
 * @apiHeader {String} Authorization User's access token.
 * @apiParam {Number} userId The ID of the user.
 * @apiParam {Number} gachaSpinId The ID of the gacha spin log.
 * @apiSuccess {Object[]} gachaResult The result of the gacha spin.
 * @apiSuccess {Number} gachaResult.ability_id The ID of the ability.
 * @apiSuccess {Number} gachaResult.new_value The new value of the ability.
 * @apiError UserInputError Gacha spin log not found or already applied.
 * @apiError (500) InternalServerError Internal server error.
 */
exports.applyParameterGachaResult = async (req, res) => {
    try {
        const { userId, gachaSpinId } = req.body;
        const gachaResult = await svc.applyParameterGachaResultToUserInventory(userId, gachaSpinId);
        return res.status(200).json({ success: true, data: gachaResult, msg: 'Gacha result applied successfully' });
    } catch (error) {
        console.error(error);
        if (error instanceof UserInputError) {
            return res.status(400).json({ success: false, data: null, msg: error.message });
        }
        return res.status(500).json({ success: false, data: null, msg: 'Internal server error' });
    }
};


/**
 * @api {put} /gacha/burn-special-skill Burn Special Skill Used in Game
 * @apiName BurnSpecialSkill
 * @apiGroup Gacha
 * @apiHeader {String} Authorization User's access token.
 * @apiParam {Number} userId The ID of the user.
 * @apiParam {Number} abilityId The ID of the ability.
 * @apiSuccess {Object} result The result of the operation.
 * @apiError UserInputError User doesn't have this ability.
 * @apiError (500) InternalServerError Internal server error.
 */
exports.burnSpecialSkill = async (req, res) => {
    try {
        const { userId, abilityId } = req.body;
        const result = await svc.burnSpclSkillUsedInGame(userId, abilityId);
        return res.status(200).json({ success: true, data: result, msg: 'Special skill burned successfully' });
    } catch (error) {
        console.error(error);
        if (error instanceof UserInputError) {
            return res.status(400).json({ success: false, data: null, msg: error.message });
        }
        return res.status(500).json({ success: false, data: null, msg: 'Internal server error' });
    }
};


/**
 * @api {post} /gacha/v3/spin  Spin Gacha V3
 * @apiName SpinGachaV3
 * @apiGroup Gacha
 * @apiHeader {String} Authorization User's access token.
 * @apiParam {Number=1,10} spinCount The number of times to spin the gacha.
 * @apiParam {String='parameter','item','skill'} gachaType The type of gacha to spin ("parameter", "skill" or "item").
 * @apiParam {Boolean} [spendJewels] Flag to spend White jewels for spinning gacha.
 * @apiSuccess {Object} result The result of the gacha spin.
 * @apiError UserInputError Invalid gacha ticket or ability not found.
 * @apiError (500) InternalServerError Internal server error.
 */
exports.spinGachaV3 = async (req, res) => {
    try {
        const userId = req.decoded.id;
        if (!userId) { throw new UserInputError('User ID is required. Invalid request'); }
        const { spinCount, gachaType, spendJewels } = req.body;

        let result;
        if (gachaType === 'parameter') {
            result = await svc.spinParameterGachaV3(spinCount, userId, spendJewels);
        } else if (gachaType === 'item') {
            result = await svc.spinItemGachaV3(spinCount, userId, spendJewels);
        } else if (gachaType === 'skill') {
            result = await svc.spinSkillGachaV2(spinCount, userId, spendJewels);
        } else {
            throw new UserInputError('Invalid gacha type');
        }

        return res.status(200).json({ success: true, data: result, msg: 'Gacha spun successfully' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
    }
};



// exports.setParamLevelFxn = async (req, res) => {
//     try {

//         let result = await svc.setParamLevel();

//         return res.status(200).json({ success: true, data: result, msg: 'Gacha spun successfully' });
//     } catch (error) {
//         console.error(error);
//         return res.status(error.code || 500).json({ success: false, data: error, msg: error.message || 'Internal server error' });
//     }
// };


