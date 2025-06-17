//@ts-check
const svc = require('../services/inventory.service');


/**
 * @api {get} /inventory/get-all-abilities  Get All Game Abilities
 * @apiName Get All Game Abilities
 * @apiGroup Inventory
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiDescription  This Api gives list of all RFM abilities..
 * @apiSuccessExample {json} Success-Response:
 * {
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Speed",
            "type": "basic",
            "description": null,
            "effect_value": null
        },
        {
            "id": 2,
            "name": "Dash Speed",
            "type": "basic",
            "description": null,
            "effect_value": null
        },
        {
            "id": 3,
            "name": "Dash Time",
            "type": "basic",
            "description": null,
            "effect_value": null
        },
        {
            "id": 4,
            "name": "Dash Recovery",
            "type": "basic",
            "description": null,
            "effect_value": null
        },
        {
            "id": 5,
            "name": "Jump",
            "type": "basic",
            "description": null,
            "effect_value": null
        },
        {
            "id": 6,
            "name": "Capture Avoidance",
            "type": "basic",
            "description": null,
            "effect_value": null
        },
        {
            "id": 7,
            "name": "Capture Power",
            "type": "basic",
            "description": null,
            "effect_value": null
        },
        {
            "id": 8,
            "name": "Transparency",
            "type": "special",
            "description": null,
            "effect_value": 30
        },
        {
            "id": 9,
            "name": "Super Dash",
            "type": "special",
            "description": null,
            "effect_value": 30
        },
        {
            "id": 10,
            "name": "Super Jump",
            "type": "special",
            "description": null,
            "effect_value": 30
        },
        {
            "id": 11,
            "name": "GPS",
            "type": "special",
            "description": null,
            "effect_value": 30
        },
        {
            "id": 12,
            "name": "Eavesdropping",
            "type": "special",
            "description": null,
            "effect_value": 30
        },
        {
            "id": 13,
            "name": "Lock On",
            "type": "special",
            "description": null,
            "effect_value": 30
        },
        {
            "id": 14,
            "name": "Time Stop",
            "type": "special",
            "description": null,
            "effect_value": 30
        },
        {
            "id": 15,
            "name": "Bomb",
            "type": "special",
            "description": null,
            "effect_value": 30
        }
    ],
    "msg": "GameAbility list fetched"
}
* @apiErrorExample {json} Error-Response:
* {
    "success": false,
    "data": {},
    "msg": "internal server error"
}
 */
exports.getGameAbilitiessList = async (req, res) => {
    try {
        const gameAbility = await svc.getAllGameAbilities();
        return res.status(200).json({ success: true, data: gameAbility, msg: 'GameAbility list fetched' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).send({ success: false, data: error, msg: error.message || 'internal server error' });
    }
}


/**
 * @api {get} /inventory/get-user-inventory  Get User Inventory Acquired Abilities
 * @apiName Get User Acquired Abilities
 * @apiGroup Inventory
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiDescription  This Api gives list of all abilities acquired by a user..
 * @apiSuccessExample {json} Success-Response:
 * {
    "success": true,
    "data": [
        {
            "name": "Speed",
            "type": "basic",
            "level": 50,
            "is_equipped": false,
            "acquired_at": "2024-12-06T04:50:19.262Z",
            "description": null,
            "effect_value": null
        },
        {
            "name": "Dash Speed",
            "type": "basic",
            "level": 50,
            "is_equipped": false,
            "acquired_at": "2024-12-06T04:50:19.262Z",
            "description": null,
            "effect_value": null
        },
        ...
    ],
    "msg": "User Abilities fetched sucessfully"
}   
* @apiErrorExample {json} Error-Response:
* {
    "success": false,
    "data": {},
    "msg": "internal server error"
}
*
 */
exports.getUserAbilities = async (req, res) => {
    try {
        const userId = req.decoded.id;
        const abilities = await svc.getUserAcquiredAbilities(userId);
        if (!abilities.length) return res.status(200).json({ success: true, data: [], msg: 'No abilities found for the user' });

        return res.status(200).json({ success: true, data: abilities, msg: 'User Abilities fetched sucessfully' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).send({ success: false, data: error, msg: error.message || 'internal server error' });
    }
}


/**
 * @api {put} /inventory/toggle-equip-ability/:abilityId  Toggle Equip or Unequip Ability
 * @apiName Toggle EquipUnequip Ability
 * @apiGroup Inventory
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {Number} abilityId Ability Id to equip/unequip
 * @apiDescription  This Api is used to toggle equip/unequip an ability for a user..
 */
exports.toggleEquipAbility = async (req, res) => {
    try {
        const userId = req.decoded.id;
        const { abilityId } = req.params;
        const result = await svc.toggleUserAbility(userId, abilityId);
        return res.status(200).json({
            success: true,
            data: result,
            message: `Ability ${result.is_equipped ? 'equipped' : 'unequipped'} successfully`,

        });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).send({ success: false, data: null, msg: error.message || 'Internal server error' });
    }
}


/**
 * @api {put} /inventory/v2/toggle-equip-ability/:abilityId  Toggle Equip or Unequip Ability V2
 * @apiName Toggle EquipUnequip Ability V2
 * @apiGroup Inventory
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {Number} abilityId Ability Id to equip/unequip
 * @apiDescription  This Api is used to toggle equip/unequip an ability for a user..
 */
exports.toggleEquipAbilityV2 = async (req, res) => {
    try {
        const userId = req.decoded.id;
        const { abilityId } = req.params;
        const result = await svc.toggleUserAbilityV2(userId, abilityId);
        return res.status(200).json({
            success: true,
            data: result,
            message: `Ability ${result.is_equipped ? 'equipped' : 'unequipped'} successfully`,

        });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).send({ success: false, data: null, msg: error.message || 'Internal server error' });
    }
}


/**
 * @api {put} /inventory/burn-special-skill Burn Special Skill Used in Game V2
 * @apiName BurnSpecialSkillV2
 * @apiGroup Gacha
 * @apiHeader {String} Authorization User's access token.
 * @apiParam {Number} [userId] The ID of the user.
 * @apiParam {Number} abilityId The ID of the ability.
 * @apiSuccess {Object} result The result of the operation.
 * @apiError UserInputError User doesn't have this ability.
 * @apiError (500) InternalServerError Internal server error.
 */
exports.burnSpecialSkill = async (req, res) => {
    try {
        const { userId, abilityId } = req.body;
        // const user_id = req.decoded.id || userId;
        const result = await svc.burnSpclSkillUsedInGame(userId, abilityId);
        return res.status(200).json({ success: true, data: result, msg: 'Special skill burned successfully' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).json({ success: false, data: null, msg: error.message || 'Internal server error' });
    }
};


exports.createBasicAbilitiesForUser = async (req, res) => {
    try {
        const userId = req.decoded.id;
        const result = await svc.createUserBasicAbilities(userId);
        return res.status(200).json({ success: true, data: result, msg: 'Basic abilities created' });
    } catch (error) {
        console.error(error);
        return res.status(error.code || 500).send({ success: false, data: null, msg: error.message || 'Internal server error' });
    }
}
