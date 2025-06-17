//@ts-check
const models = require('../models');
const { Op } = require('sequelize');
const { UserInputError } = require('../utils/classes');
const sequelize = require('sequelize');
const gachas = models.gachas;
const gacha_items = models.gacha_items;
const abilities = models.abilities;
const user_gacha_levels = models.user_gacha_levels;
const inapp_items = models.inapp_items;

const user_inventory = models.user_inventory;
const user_gacha_tickets = models.user_gacha_tickets;
const user_purchases = models.user_purchases;
const user_gacha_logs = models.user_gacha_logs;
const rfm_param_lvl_std = models.rfm_param_lvl_std;

const gaussian = require('gaussian');
const db = require('../database/database');

exports.getGameGachas = async () => {
    return await gachas.findAll({
        attributes: { exclude: ['created_at', 'updated_at'] },
        raw: true
    })
}


exports.getInAppItems = async (itemType) => {
    const clause = {};
    if (itemType) {
        // manually adding 's' at the end of itemType to match with the column name in db
        clause.name = itemType + 's';
    }
    return await inapp_items.findAll({
        where: clause,
        attributes: { exclude: ['created_at', 'updated_at'] },
        raw: true
    })
}

exports.getInAppItemsV2 = async (gacha_id) => {
    return await inapp_items.findAll({
        where: { gacha_id },
        attributes: { exclude: ['created_at', 'updated_at'] },
        raw: true
    });
}

/**
    * phase 2 services
*/


// @ts-ignore
const randomValue = (mean, stdDev, min = 1, max = 100) => {
    // Generate uniform random values
    let u1 = Math.random();
    let u2 = Math.random();

    // Apply Box-Muller Transform
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    // Scale and shift to the desired mean and standard deviation
    let value = mean + z0 * stdDev;

    // console.log(`Raw value: ${value}`); // Debugging: Check the raw value

    // Clamp the value to the range [min, max]
    value = Math.max(min, Math.min(max, value));

    // console.log(`Clamped value: ${value}`); // Debugging: Check the clamped value

    // Return rounded integer value
    return Math.round(value);
}


exports.findOrCreateUserGachaLevel = async (userId, gachaId) => {
    let userGachaLevel = await user_gacha_levels.findOne({
        where: { user_id: userId, gacha_id: gachaId },
    });

    if (!userGachaLevel) {
        userGachaLevel = await user_gacha_levels.create({
            user_id: userId,
            gacha_id: gachaId,
            level: 0,
            counter: 0,
            spins_to_next: 1,
            paramGachaCount: 1,
        });
    }
    try {
        userGachaLevel = userGachaLevel.toJSON();
    } catch (error) {
        console.log('Error converting to JSON', error);
    }
    return userGachaLevel;
}

// Assuming the formula: spins = scale_factor * (Level^growth_rate)
const calculateGachaLevel = (counter, scaleFactor, growthRate) => {
    if (!scaleFactor || !growthRate) throw new Error('Invalid scale factor or growth rate');

    let currentLevel = 0;

    // Calculate current level
    while (scaleFactor * Math.pow(currentLevel + 1, growthRate) <= counter) {
        currentLevel++;
    }

    // Calculate spins needed for the next level
    const spinsForNextLevel = scaleFactor * Math.pow(currentLevel + 1, growthRate);
    const spinsToNext = Math.max(0, spinsForNextLevel - counter);

    return { currentLevel, spinsToNext };
};


const calculateParamGachaLevel = async (userGachaLevel, gachaCounter, spinCount) => {
    let userParamGachaLevel = await rfm_param_lvl_std.findOne({
        where: { minGachaCount: { [Op.lte]: gachaCounter } },
        order: [['minGachaCount', 'DESC']],
    })

    return { currentLevel: userParamGachaLevel.level, spinsToNext: userParamGachaLevel.nextLvlReqdCount };
};


// // Parameter Gacha
// function parameterGacha(parameterGacha, userGacha, abilities) {
//     // @ts-ignore
//     const { standard_deviation, base_mean = 20 } = parameterGacha;    // μ at level 0
//     let { level, mean_value } = userGacha;
//     //* mean value should be between 20 to 100
//     if (level < 1) mean_value = 20;
//     if (mean_value > 100) mean_value = 100;

//     const mean = (mean_value) + level * 0.5; // Mean increases with gacha level

//     const distribution = gaussian(mean, standard_deviation ** 2);

//     // const abilities = ["Speed", "Dash Speed", "Dash Time", "Dash Recovery", "Jump", "Capture Avoidance", "Capture Power"];
//     const results = {};

//     abilities.forEach((ability) => {
//         let value;
//         do {
//             value = distribution.ppf(Math.random()); // Random value from normal distribution
//             value = Math.round(value);
//         } while (value < 1 || value > 100); // Ensure value is within [1, 100]

//         results[ability] = value;
//     });

//     //* update user gacha mean value
//     // user_gacha_levels.update({ mean_value: mean }, { where: { id: userGacha.id } });

//     return { results, new_mean: mean };
// }


exports.spinParameterGacha = async (ticketId, userId) => {
    const paramGacha = await gachas.findOne({ where: { name: 'parameter' }, raw: true });
    if (!paramGacha) throw new Error('Parameter Gacha not found');

    const userGachaTicket = await user_gacha_tickets.findOne({ where: { id: ticketId, user_id: userId, gacha_id: paramGacha.id, }, raw: true });
    if (!userGachaTicket) throw new UserInputError('Invalid gacha ticket.');
    if (userGachaTicket.used_at) throw new UserInputError('Gacha ticket already used');

    console.log(paramGacha, ' paramGacha');
    // * Get the user's gacha level
    const userGachaLevel = await this.findOrCreateUserGachaLevel(userId, paramGacha.id);
    // GACHA_LEVEL_FORMULA =  a * (Lv^b)
    const newCounter = userGachaLevel.counter + 1;
    const { currentLevel, spinsToNext } = calculateGachaLevel(newCounter, paramGacha.scale_factor, paramGacha.growth_rate);

    // // Base mean and standard deviation for Normal Distribution
    // const baseMean = paramGacha.base_mean || 50;
    // const baseStdDev = paramGacha.standard_deviation || 10;
    // const mean = baseMean + level * 0.2;
    // let min = 1, max = 100;
    // // Gacha level and parameter names
    // // const parameters = ['Speed', 'Dash Speed', 'Dash Time', 'Dash Recovery', 'Jumping Power'];
    const parameters = await abilities.findAll({
        where: { type: 'basic' },
        attributes: ['id', 'name'],
        raw: true
    });

    const paraNames = parameters.map(ability => ability.name);

    // Calculate random values for each parameter
    // const calculatedValues = {};
    // paraNames.forEach(param => {
    //     calculatedValues[param] = randomValue(mean, baseStdDev, min, max);
    // });

    const { results: calculatedValues, new_mean } = parameterGacha(paramGacha, userGachaLevel, paraNames);
    console.log('calculatedValues', calculatedValues);

    //* Update user gacha level
    // await user_gacha_levels.update(
    //     { counter: newCounter, level: currentLevel, spins_to_next: spinsToNext },
    //     { where: { user_id: userId, gacha_id: paramGacha.id } }
    // );
    await user_gacha_levels.update(
        { counter: newCounter, level: currentLevel, spins_to_next: spinsToNext, mean_value: new_mean },
        { where: { id: userGachaLevel.id } }
    );

    // burn the gacha ticket
    await user_gacha_tickets.update({ used_at: new Date() }, { where: { id: ticketId } });


    const gachaResult = parameters.map(param => ({
        ability_id: param.id,
        ability_name: param.name,
        new_value: calculatedValues[param.name]
    }));

    // save gacha spin log
    const spinLog = await this.saveGachaSpinLogs({ user_id: userId, gacha_id: paramGacha.id, gacha_ticket_id: ticketId, result: gachaResult, is_applied: false });

    const response = {
        gacha_spin_id: spinLog.id,
        gacha_result: calculatedValues
    };

    return response;
}

exports.applyParameterGachaResultToUserInventory = async (userId, gachaSpinId) => {
    let spinLog = await user_gacha_logs.findOne({ where: { id: gachaSpinId, user_id: userId }, raw: true });
    if (!spinLog) {
        spinLog = await user_gacha_logs.findOne({ where: { gacha_ticket_id: gachaSpinId, user_id: userId }, raw: true });
        if (!spinLog) throw new UserInputError('Gacha spin log not found/ Invalid gacha spin ID');
    }
    if (spinLog.is_applied) throw new UserInputError('Gacha spin log already applied');

    const gachaResult = spinLog.result;

    // update or create ability level for user inventory
    gachaResult.forEach(async (result) => {
        const userAbility = await user_inventory.findOne({ where: { user_id: userId, ability_id: result.ability_id, ability_type: spinLog.gacha_id }, raw: true });
        if (!userAbility) {
            await user_inventory.create({ user_id: userId, ability_id: result.ability_id, level: result.new_value, ability_type: spinLog.gacha_id });
        } else {
            await user_inventory.update({ level: result.new_value }, { where: { id: userAbility.id } });
        }
    });

    // update gacha log
    await user_gacha_logs.update({ is_applied: true }, { where: { id: gachaSpinId } });

    return gachaResult;
}

// Item Gacha Lottery
function itemGachaSpinner(itemGacha, level) {
    const { standard_deviation } = itemGacha;
    const mean = level; // μ for items depends on the item gacha level
    const distribution = gaussian(mean, standard_deviation ** 2);

    let itemLevel;
    do {
        itemLevel = distribution.ppf(Math.random());
        itemLevel = Math.round(itemLevel);
    } while (itemLevel < Math.max(1, level - 5) || itemLevel > Math.min(100, level + 5)); // Restrict level within [level - 5, level + 5]

    // const randomItem = items[Math.floor(Math.random() * items.length)];

    return { level: itemLevel };
}

exports.spinItemGacha = async (ticketId, userId,) => {
    let response = { is_applied: false };
    const itemGacha = await gachas.findOne({ where: { name: 'items' }, raw: true });
    if (!itemGacha) throw new Error('Item Gacha not found');
    const gacha_id = itemGacha.id;

    // check if user has valid gacha Ticket
    const userGachaTicket = await user_gacha_tickets.findOne({ where: { id: ticketId, user_id: userId, gacha_id: itemGacha.id, }, raw: true });
    if (!userGachaTicket) throw new UserInputError('Invalid gacha ticket');
    if (userGachaTicket.used_at) throw new UserInputError('Gacha ticket already used');
    console.log('userGachaTicket', userGachaTicket);

    // * Get the random special gacha item
    let gachaItem = await gacha_items.findAll({
        attributes: [
            'id',
            'gacha_id',
            'ability_id',
            'boost_value',
            'description',
            [sequelize.literal('ability.name'), 'ability_name']
        ],
        where: { gacha_id: 1 },     // currently params gacha items are loaded. its not created separately
        include: [{
            model: abilities,
            attributes: [],
        }],
        raw: true
    })
    // console.info('gachaItem', gachaItem);
    // select any random item
    gachaItem = gachaItem[Math.floor(Math.random() * gachaItem.length)];

    if (!gachaItem) throw new UserInputError('Gacha item not found');

    // * Get the user's gacha level
    const userGachaLevel = await this.findOrCreateUserGachaLevel(userId, gacha_id);
    // GACHA_LEVEL_FORMULA =  a * (Lv^b)
    const newCounter = userGachaLevel.counter + 1;
    const { currentLevel, spinsToNext } = calculateGachaLevel(newCounter, itemGacha.scale_factor, itemGacha.growth_rate);
    //* Update user gacha level
    await user_gacha_levels.update({ counter: newCounter, level: currentLevel, spins_to_next: spinsToNext }, { where: { user_id: userId, gacha_id: gacha_id } });

    //* update users ability level
    let userCurrentAbility = await user_inventory.findOne({ where: { user_id: userId, ability_id: gachaItem.ability_id, ability_type: gacha_id }, raw: true });
    // if (!userCurrentAbility) throw new UserInputError('User doesnt has this ability yet');
    if (!userCurrentAbility) {
        userCurrentAbility = await user_inventory.create({ user_id: userId, ability_id: gachaItem.ability_id, level: 50, ability_type: gacha_id });
        userCurrentAbility = userCurrentAbility.toJSON();
    }

    // * get random value from current ability level + 5
    const currLevel = userCurrentAbility.level;
    // const newLevel = Math.round(Math.random() * 11 + (currLevel - 5));
    const newLevel = itemGachaSpinner(itemGacha, currLevel).level;
    response.new_level = newLevel;
    response.ability_id = gachaItem.ability_id;
    response.ability_name = gachaItem.ability_name;
    let isBoosted = false;
    if (newLevel > currLevel) {
        // updating user ability level
        await user_inventory.update({ level: newLevel }, { where: { id: userCurrentAbility.id } });
        isBoosted = true;
        // console.info(gachaItem);
        response = {
            is_applied: isBoosted,
            ability_id: gachaItem.ability_id,
            ability_name: gachaItem.ability_name,
            new_level: newLevel,
            level_boosted: newLevel - currLevel,
        }
    }

    // burn the gacha ticket
    await user_gacha_tickets.update({ used_at: new Date() }, { where: { id: ticketId } });

    // save gacha spin log
    await this.saveGachaSpinLogs({ user_id: userId, gacha_id: gacha_id, gacha_ticket_id: ticketId, result: response, is_applied: isBoosted });

    console.log('response', response);
    return response;

}

exports.spinSkillsGacha = async (ticketId, userId) => {
    let response = {};
    const skillGacha = await gachas.findOne({ where: { name: 'skills' }, raw: true });
    if (!skillGacha) throw new Error('Skill Gacha not found');

    //* check if user has valid gacha Ticket
    const userGachaTicket = await user_gacha_tickets.findOne({ where: { id: ticketId, user_id: userId, gacha_id: skillGacha.id, }, raw: true });
    if (!userGachaTicket) throw new UserInputError('Invalid gacha ticket');
    if (userGachaTicket.used_at) throw new UserInputError('Gacha ticket already used');

    // * Get the random special gacha item
    let gachaItem = await gacha_items.findAll({
        attributes: ['id', 'gacha_id', 'ability_id', 'boost_value', 'description',
            [sequelize.literal('ability.name'), 'ability_name'],
            [sequelize.literal('ability.type'), 'ability_type'],
        ],
        where: { gacha_id: skillGacha.id },
        include: [{
            model: abilities,
            attributes: [],
        }],
        raw: true,
    });
    // select any random item
    gachaItem = gachaItem[Math.floor(Math.random() * gachaItem.length)];
    if (!gachaItem) throw new UserInputError('Gacha item not found');
    //* check if user ability exists for this skill
    const userAbility = await user_inventory.findOne({ where: { user_id: userId, ability_id: gachaItem.ability_id }, raw: true });
    if (userAbility) {
        // increment the level of the ability
        const newLevel = userAbility.level + 1;
        await user_inventory.update({ level: newLevel }, { where: { id: userAbility.id } });
        response.skill_acquired = true;
        response.skill = gachaItem;
        response.new_level = newLevel;

    } else {
        response.skill_acquired = true;
        response.skill = gachaItem
        response.new_level = 1;
        // create user ability
        await user_inventory.create({ user_id: userId, ability_id: gachaItem.ability_id, level: 1, ability_type: skillGacha.id });
    }


    // burn the gacha ticket
    await user_gacha_tickets.update({ used_at: new Date() }, { where: { id: ticketId } });

    // save gacha spin log
    await this.saveGachaSpinLogs({ user_id: userId, gacha_id: gachaItem.gacha_id, gacha_ticket_id: ticketId, result: response, is_applied: true });

    return response;
}

exports.burnSpclSkillUsedInGame = async (userId, abilityId) => {
    const userAbility = await user_inventory.findOne({ where: { user_id: userId, ability_id: abilityId }, raw: true });
    if (!userAbility) throw new UserInputError('User doesnt has this ability');

    // delete user ability
    // let dltd = await user_inventory.decrement('level', { where: { user_id: userId, ability_id: abilityId } });
    let dltd = await user_inventory.decrement('level', { where: { id: userAbility.id } });
    dltd = dltd[0];
    return dltd;
}



exports.saveGachaSpinLogs = async (data) => {
    const gachaSpinLog = await user_gacha_logs.create(data);
    return gachaSpinLog;
}

exports.updateUserGachaLevel = async (userId, gachaId, payload) => {
    const userGachaLevel = await user_gacha_levels.update(payload, {
        where: { user_id: userId, gacha_id: gachaId }
    });
    return userGachaLevel;
}


exports.getAllGachaItems = async (query) => {
    let abilityFilter;
    let gachaType = query.gachaType;
    if (gachaType) {
        switch (gachaType) {
            case 'item':
                abilityFilter = { type: 'basic' };
                break;
            case 'skill':
                abilityFilter = { type: 'special' };
                break;
            default:
                abilityFilter = {};
                break;
        }
    }


    const gachaItems = await gacha_items.findAll({
        // where: { gacha_id: gachaId },
        // attributes: ['id', 'ability_id', 'probability'],
        attributes: ['id',
            'gacha_id',
            [sequelize.literal('ability.name'), 'ability_name'],
            [sequelize.literal('ability.type'), 'ability_type'],
            [sequelize.literal('ability.description'), 'ability_description'],
            // [sequelize.literal('ability.effect_value'), 'ability_effect_value'],
            'ability_id', 'boost_value', 'description',
        ],
        include: [
            {
                model: abilities,
                attributes: [],
                where: abilityFilter,
                as: 'ability'
            }
        ],
        raw: true
    });

    return gachaItems;
}


exports.purchaseGachaTicket = async ({ userId, gachaId, cost, txn_hash, currency }) => {
    // get gacha details
    let gacha = await gachas.findByPk(gachaId,);
    if (!gacha) throw new UserInputError('Gacha not found. Invalid gacha ID');
    gacha = gacha.toJSON();
    console.log(gacha)
    const userMoney = await models.user_money.findOne({ where: { user_id: userId }, });
    if (!userMoney) throw new UserInputError('User money not found');
    console.log('userMoney', userMoney);
    // check if input matches gacha cost
    switch (currency) {
        case 'gold':
            // if gacha gold cost is -1 that means its not available to purchase via gold
            if (gacha.cost_gold <= 0) throw new UserInputError('Not available for purchase via gold');
            // check if input cost match gacha cost gold
            if (cost !== gacha.cost_gold) throw new UserInputError('Invalid cost for gacha ticket');
            // check if user has enough balance
            if (userMoney.gold < cost) throw new UserInputError('Insufficient funds for purchase via gold');
            break;
        case 'fiat':
            // check if user has txn_hash, and match with cost of fiat
            if (cost != gacha.cost_fiat) throw new UserInputError('Invalid cost for gacha');
            if (!txn_hash) throw new UserInputError('Transaction hash is required for fiat purchase');
            //TODO ===>>>> IMPLEMENT HASH VALIDATION MECHANISM LATER ON
            break;
        case 'token':
            // Not enabled for now return error
            throw new UserInputError('Token purchase not available yet');
            // @ts-ignore
            break;
        default:
            throw new UserInputError('Invalid currency type');
    }

    // create purchase record for user
    const purchase = await user_purchases.create({
        user_id: userId,
        gacha_id: gachaId,
        cost,
        currency,
        txn_hash
    });

    // create user gacha ticket
    const userGachaTicket = await user_gacha_tickets.create({
        user_id: userId,
        gacha_id: gachaId,
        purchase_id: purchase.id,
    });

    // deduct user money
    if (currency === 'gold') {
        await models.user_money.update({ gold: userMoney.gold - cost }, { where: { user_id: userId } });
    }

    return userGachaTicket;

}

exports.purchaseGachaTicketV2 = async ({ userId, item_id, txn_hash, currency }) => {
    // get item details
    let item = await inapp_items.findByPk(item_id,);
    if (!item) throw new UserInputError('Item not found. Invalid item ID');
    item = item.toJSON();
    console.info(item);

    const userMoney = await models.user_money.findOne({ where: { user_id: userId }, });
    if (!userMoney) throw new UserInputError('User money not found');
    console.log('userMoney', userMoney);

    let finalCost = 0;

    // check if input matches gacha cost
    switch (currency) {
        case 'gold':
            // if gacha gold cost is -1 that means its not available to purchase via gold
            if (item.cost_gold == -1) throw new UserInputError('Not available for purchase via gold');
            // check if user has enough balance
            if (userMoney.gold < item.cost_gold) throw new UserInputError('Insufficient funds for purchase via gold');
            finalCost = item.cost_gold;
            break;
        case 'fiat':
            // check if user has txn_hash, and match with cost of fiat
            if (!txn_hash) throw new UserInputError('Transaction hash is required for fiat purchase');
            //TODO ===>>>> IMPLEMENT HASH VALIDATION MECHANISM LATER ON
            break;
        case 'token':
            // Not enabled for now return error
            throw new UserInputError('Token purchase not available yet');
            // @ts-ignore
            break;
        default:
            throw new UserInputError('Invalid currency type');
    }

    let userGachaTicketIds = [];

    for (let i = 0; i < item.ticket_count; i++) {
        // create purchase record for user
        const purchase = await user_purchases.create({
            user_id: userId,
            gacha_id: item.gacha_id,
            item_id: item.id,
            cost: finalCost,
            currency,
            txn_hash
        });

        // create user gacha ticket
        const userGachaTicket = await user_gacha_tickets.create({
            user_id: userId,
            gacha_id: item.gacha_id,
            purchase_id: purchase.id,
        });

        userGachaTicketIds.push(userGachaTicket.id);
    }

    // deduct user money
    if (currency === 'gold') {
        await models.user_money.update({ gold: userMoney.gold - item.cost_gold }, { where: { user_id: userId } });
    }

    return userGachaTicketIds;

}

exports.getUserGachaTickets = async (userId, gachaId, filter) => {
    const baseClause = { user_id: userId };
    if (gachaId) baseClause.gacha_id = gachaId;

    // Clause for filtering by used status
    const filterClause = { ...baseClause };
    //@ts-ignore
    if (filter?.used === true) filterClause.used_at = { [Op.ne]: null }; // used tickets
    //@ts-ignore
    if (filter?.used === false) filterClause.used_at = null; // unused tickets

    // Query for total and available tickets (unfiltered)
    const userGachaTickets = await user_gacha_tickets.findAll({
        attributes: [
            'gacha_id',
            [sequelize.fn('COUNT', sequelize.col('user_gacha_tickets.id')), 'total_tickets'],
            [sequelize.fn('SUM', sequelize.literal('CASE WHEN used_at IS NULL THEN 1 ELSE 0 END')), 'available_tickets'],
            [sequelize.col('gacha.name'), 'gacha_name']
        ],
        where: baseClause,
        include: [
            {
                model: gachas,
                as: 'gacha',
                attributes: []
            }
        ],
        group: ['gacha_id', 'gacha.name'],
        raw: true
    });

    // Query for filtered tickets
    const tickets = await user_gacha_tickets.findAll({
        where: filterClause,
        raw: true
    });

    // Combine results
    const result = userGachaTickets.map(ticket => {
        const gachaTickets = tickets.filter(t => t.gacha_id === ticket.gacha_id);
        return {
            gacha_id: ticket.gacha_id,
            gacha_name: ticket['gacha.name'],
            total_tickets: ticket.total_tickets, // Total tickets for this gacha
            available_tickets: ticket.available_tickets, // Always calculated based on unfiltered tickets
            tickets: gachaTickets.map(t => ({
                id: t.id,
                purchased_at: t.created_at,
                used_at: t.used_at
            }))
        };
    });

    return result;
};


exports.getUserGachaLevelDetails = async (userId, gachaId) => {
    const clause = { user_id: userId };
    if (gachaId) clause.gacha_id = gachaId;
    const userGachaLevel = await user_gacha_levels.findAll({
        attributes: [
            // 'user_id', 
            'gacha_id',
            [sequelize.col('gacha.name'), 'gacha_name'],
            [sequelize.col('gacha.description'), 'gacha_description'],
            'level', 'counter', 'spins_to_next',],
        where: clause,
        include: [
            {
                model: gachas,
                as: 'gacha',
                attributes: [],
            }
        ],
        raw: true
    });

    return userGachaLevel;
}


function parameterGacha(parameterGacha, userGacha, abilities) {
    console.info(parameterGacha, userGacha, abilities, "---parameterGacha, userGacha, abilities---");
    const { standard_deviation = 10 } = parameterGacha;
    const base_mean = 20;
    const { level } = userGacha;
console.log(userGacha, base_mean, level, 'userGacha');
    // Mean only depends on base_mean and level
    const mean = Math.min(base_mean + level, 70);

    const distribution = gaussian(mean, standard_deviation ** 2);
    const results = {};

    abilities.forEach((ability) => {
        console.info(ability, '---ability---707');
        let value;
        do {
            value = distribution.ppf(Math.random());
            value = Math.round(Math.round(value * 10) / 10);
        } while (value < 1 || value > 100);

        console.info(value, '---value---714');
        results[ability] = value;
    });
console.info(results, mean, '---results---714');
    return { results, mean };
}


function parameterGachaV3(parameterGacha, userGacha, abilities) {
    const base_mean = 20;
    const mean_increment = 0.5;
    const standard_deviation = 10;

    const { level = 0 } = userGacha;
    const mean = base_mean + (level * mean_increment);

    const distribution = gaussian(mean, standard_deviation ** 2);
    const results = {};

    // // Calculate dynamic clamp range around mean (mean ± 10)
    // const minValue = Math.max(1, Math.floor(mean - 10));
    // const maxValue = Math.min(100, Math.ceil(mean + 10));

    // Calculate dynamic clamp range around mean (mean ± 10)
    const minValue = Math.max(1, Math.round(mean - 10));
    const maxValue = Math.min(100, Math.round(mean + 10));

    abilities.forEach((ability) => {
        let value;
        do {
            value = Math.round(distribution.ppf(Math.random()));
        } while (value < minValue || value > maxValue);

        results[ability] = value;
    });

    return { results, mean };
}


function quickBuyGachaTicket(user_id, gacha_id, num_of_tickets, transaction) {
    let userTickets = [];
    for (let i = 0; i < num_of_tickets; i++) {
        userTickets.push({
            user_id,
            gacha_id,
            purchase_id: 0,
        })
    }

    // Create user gacha tickets
    return user_gacha_tickets.bulkCreate(userTickets, { transaction });

}


exports.spinParameterGachaV2 = async (spinCount, userId, spend_jewel = false) => {

    // Use transaction for all database operations
    const transaction = await db.transaction();


    const paramGacha = await gachas.findOne({
        where: { name: 'parameter' },
        raw: true
    });
    if (!paramGacha) throw new Error('Parameter Gacha not found');

    // Get ticket details with purchase info
    let userGachaTickets = await user_gacha_tickets.findAll({
        where: {
            // id: ticketIds,
            user_id: userId,
            gacha_id: paramGacha.id,
            used_at: null
        },
        limit: spinCount,
        raw: true
    });

    if (userGachaTickets.length !== spinCount && !spend_jewel) {
        throw new UserInputError(`You are missing ${spinCount - userGachaTickets.length} gacha ticket(s) to perform ${spinCount}-Pull Parameter Gacha. You need to spend 'Jewels' to perform spins`, 300);
    }


    let spentGold = 0;
    let spentWhiteJewels = 0;
    if (userGachaTickets.length < spinCount && spend_jewel) {
        const userMoney = await models.user_money.findOne({ where: { user_id: userId }, },);
        if (!userMoney) throw new UserInputError('User money not found');

        const missingTickets = spinCount - userGachaTickets.length;
        const goldCost = paramGacha.cost_gold * missingTickets;
        const whiteJewelCost = paramGacha.cost_white_jewel * missingTickets;


        // First try to use gold
        if (userMoney.gold >= goldCost) {
            spentGold = goldCost;
        }
        // If gold is insufficient, try white jewels
        else if (userMoney.white_jewel >= whiteJewelCost) {
            spentWhiteJewels = whiteJewelCost;
        }
        // If neither is sufficient, throw error
        else {
            throw new UserInputError(
                `Insufficient funds. Required: ${goldCost} Gold or ${whiteJewelCost} White Jewels`
            );
        }

        // Quick buy missing tickets
        const newTickets = await quickBuyGachaTicket(userId, paramGacha.id, missingTickets, transaction);
        userGachaTickets = [...userGachaTickets, ...newTickets];
    }

    const ticketIds = userGachaTickets.map(ticket => ticket.id);
    // Get user's gacha level once
    const userGachaLevel = await this.findOrCreateUserGachaLevel(userId, paramGacha.id);
    const parameters = await abilities.findAll({
        where: { type: 'basic' },
        attributes: ['id', 'name'],
        raw: true
    });
    const paraNames = parameters.map(ability => ability.name);

    // Calculate final counter and level after all spins
    const finalCounter = userGachaLevel.counter + spinCount;
    const { currentLevel, spinsToNext } = calculateGachaLevel(
        finalCounter,
        paramGacha.scale_factor,
        paramGacha.growth_rate
    );

    // Arrays to store results for bulk operations
    const allResults = [];
    const spinLogs = [];

    //* store current mean value and use it for each spin until all spins are done
    let majorMean = userGachaLevel.mean_value;

    // Perform all spins
    for (let userGachaTicket of userGachaTickets) {
        // for (let i = 0; i < spinCount; i++) {
        // Calculate gacha results for this spin
        const { results: calculatedValues, mean: new_mean } = parameterGacha(
            paramGacha,
            { ...userGachaLevel, mean_value: majorMean },
            paraNames
        );

        console.log('calculatedValues', calculatedValues);
        console.log('new_mean', new_mean);
        majorMean = new_mean;

        //* Create gacha result for each parameter
        const gachaResult = parameters.map(param => ({
            ability_id: param.id,
            ability_name: param.name,
            new_value: calculatedValues[param.name]
        }));

        allResults.push({
            ticket_id: userGachaTicket.id,
            values: calculatedValues
        });

        spinLogs.push({
            user_id: userId,
            gacha_id: paramGacha.id,
            gacha_ticket_id: userGachaTicket.id,
            result: gachaResult,
            is_applied: false
        });
    }


    try {
        // Update user gacha level
        await user_gacha_levels.update(
            {
                counter: finalCounter,
                level: currentLevel,
                spins_to_next: spinsToNext,
                mean_value: majorMean
            },
            {
                where: { id: userGachaLevel.id },
                transaction
            }
        );

        // Mark all tickets as used
        await user_gacha_tickets.update(
            { used_at: new Date() },
            {
                where: { id: ticketIds },
                transaction
            }
        );

        if (spentGold > 0 || spentWhiteJewels > 0) {
            const updateFields = {};
            if (spentGold > 0) updateFields.gold = sequelize.literal(`gold - ${spentGold}`);
            if (spentWhiteJewels > 0) updateFields.white_jewel = sequelize.literal(`white_jewel - ${spentWhiteJewels}`);

            await models.user_money.update(updateFields, {
                where: { user_id: userId },
                transaction
            });
        }
        // Bulk create spin logs
        // @ts-ignore
        const createdLogs = await user_gacha_logs.bulkCreate(spinLogs, { transaction });

        await transaction.commit();

        return {
            // gacha_spin_ids: createdLogs.map(log => log.id),
            total_spins: spinCount,
            results: allResults
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};


exports.spinParameterGachaV3 = async (spinCount, userId, spend_jewel = false) => {
    // Use transaction for all database operations
    const transaction = await db.transaction();

    const paramGacha = await gachas.findOne({
        where: { name: 'parameter' },
        raw: true
    });
    if (!paramGacha) throw new Error('Parameter Gacha not found');

    // Get ticket details with purchase info
    let userGachaTickets = await user_gacha_tickets.findAll({
        where: { user_id: userId, gacha_id: paramGacha.id, used_at: null },
        limit: spinCount, raw: true
    });

    if (userGachaTickets.length !== spinCount && !spend_jewel) {
        throw new UserInputError(`You are missing ${spinCount - userGachaTickets.length} gacha ticket(s) to perform ${spinCount}-Pull Parameter Gacha. You need to spend 'Jewels' to perform spins`, 300);
    }

    let spentGold = 0;
    let spentWhiteJewels = 0;
    if (userGachaTickets.length < spinCount && spend_jewel) {
        const userMoney = await models.user_money.findOne({ where: { user_id: userId }, },);
        if (!userMoney) throw new UserInputError('User money not found');

        const missingTickets = spinCount - userGachaTickets.length;
        const goldCost = paramGacha.cost_gold * missingTickets;
        const whiteJewelCost = paramGacha.cost_white_jewel * missingTickets;

        // First try to use gold
        if (userMoney.gold >= goldCost) {
            spentGold = goldCost;
        }
        // If gold is insufficient, try white jewels
        else if (userMoney.white_jewel >= whiteJewelCost) {
            spentWhiteJewels = whiteJewelCost;
        }
        // If neither is sufficient, throw error
        else {
            throw new UserInputError(`Insufficient funds. Required: ${goldCost} Gold or ${whiteJewelCost} White Jewels`);
        }

        // Quick buy missing tickets
        const newTickets = await quickBuyGachaTicket(userId, paramGacha.id, missingTickets, transaction);
        userGachaTickets = [...userGachaTickets, ...newTickets];
    }

    const ticketIds = userGachaTickets.map(ticket => ticket.id);
    // Get user's gacha level once
    const userGachaLevel = await this.findOrCreateUserGachaLevel(userId, paramGacha.id);
    const parameters = await abilities.findAll({
        where: { type: 'basic' },
        attributes: ['id', 'name'],
        raw: true
    });
    const paraNames = parameters.map(ability => ability.name);

    // Calculate final counter and level after all spins
    const finalCounter = userGachaLevel.counter + spinCount;
    // const { currentLevel, spinsToNext } = await calculateGachaLevel(finalCounter,
    //     paramGacha.scale_factor,
    //     paramGacha.growth_rate
    // );

    const { currentLevel, spinsToNext } = await calculateParamGachaLevel(userGachaLevel, finalCounter, spinCount
        // paramGacha.scale_factor,
        // paramGacha.growth_rate
    );

    // Arrays to store results for bulk operations
    const allResults = [];
    const spinLogs = [];

    //* store current mean value and use it for each spin until all spins are done
    let majorMean = userGachaLevel.mean_value;

    // Perform all spins
    for (let userGachaTicket of userGachaTickets) {
        // for (let i = 0; i < spinCount; i++) {
        // Calculate gacha results for this spin
        const { results: calculatedValues, mean: new_mean } = parameterGachaV3(
            paramGacha,
            { ...userGachaLevel, mean_value: majorMean },
            paraNames
        );

        console.log('calculatedValues', calculatedValues);
        console.log('new_mean', new_mean);
        majorMean = new_mean;

        //* Create gacha result for each parameter
        const gachaResult = parameters.map(param => ({
            ability_id: param.id,
            ability_name: param.name,
            new_value: calculatedValues[param.name]
        }));

        allResults.push({
            ticket_id: userGachaTicket.id,
            values: calculatedValues
        });

        spinLogs.push({
            user_id: userId,
            gacha_id: paramGacha.id,
            gacha_ticket_id: userGachaTicket.id,
            result: gachaResult,
            is_applied: false
        });
    }


    try {
        // Update user gacha level
        await user_gacha_levels.update(
            {
                counter: finalCounter,
                level: currentLevel,
                spins_to_next: spinsToNext,
                mean_value: majorMean
            },
            {
                where: { id: userGachaLevel.id },
                transaction
            }
        );

        // Mark all tickets as used
        await user_gacha_tickets.update(
            { used_at: new Date() },
            {
                where: { id: ticketIds },
                transaction
            }
        );

        if (spentGold > 0 || spentWhiteJewels > 0) {
            const updateFields = {};
            if (spentGold > 0) updateFields.gold = sequelize.literal(`gold - ${spentGold}`);
            if (spentWhiteJewels > 0) updateFields.white_jewel = sequelize.literal(`white_jewel - ${spentWhiteJewels}`);

            await models.user_money.update(updateFields, {
                where: { user_id: userId },
                transaction
            });
        }
        // Bulk create spin logs
        // @ts-ignore
        const createdLogs = await user_gacha_logs.bulkCreate(spinLogs, { transaction });

        await transaction.commit();

        return {
            // gacha_spin_ids: createdLogs.map(log => log.id),
            total_spins: spinCount,
            results: allResults
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};


// Item Gacha Lottery
function itemGachaSpinner(itemGacha, level) {
    const { standard_deviation } = itemGacha;
    const mean = level; // μ for items depends on the item gacha level
    const distribution = gaussian(mean, standard_deviation ** 2);

    let itemLevel;
    do {
        itemLevel = distribution.ppf(Math.random());
        itemLevel = Math.round(itemLevel);
    } while (itemLevel < Math.max(1, level - 5) || itemLevel > Math.min(100, level + 5)); // Restrict level within [level - 5, level + 5]

    // const randomItem = items[Math.floor(Math.random() * items.length)];

    return { level: itemLevel };
}

exports.spinItemGachaV2 = async (spinCount, userId, spend_jewel = false) => {
    // Use transaction for all database operations
    const transaction = await db.transaction();

    const itemGacha = await gachas.findOne({
        where: { name: 'items' },
        raw: true
    },);
    if (!itemGacha) throw new Error('Item Gacha not found');

    // Get ticket details
    let userGachaTickets = await user_gacha_tickets.findAll({
        where: {
            // id: ticketIds,
            user_id: userId,
            gacha_id: itemGacha.id,
            used_at: null
        },
        limit: spinCount,
        raw: true
    });

    if (userGachaTickets.length !== spinCount && !spend_jewel) {
        throw new UserInputError(`You are missing ${spinCount - userGachaTickets.length} tickets to perform a ${spinCount}-Pull Item Gacha. You need to spend 'Jewels' to perform spins`, 300);
    }

    let spentWhiteJewels = 0, spentGold = 0;
    if (userGachaTickets.length < spinCount && spend_jewel) {
        const userMoney = await models.user_money.findOne({ where: { user_id: userId }, },);
        if (!userMoney) throw new UserInputError('User money not found');

        const missingTickets = spinCount - userGachaTickets.length;
        const goldCost = itemGacha.cost_gold * missingTickets;
        const whiteJewelCost = itemGacha.cost_white_jewel * missingTickets;

        // First try to use gold
        if (userMoney.gold >= goldCost) {
            spentGold = goldCost;
        }
        // If gold is insufficient, try white jewels
        else if (userMoney.white_jewel >= whiteJewelCost) {
            spentWhiteJewels = whiteJewelCost;
        }
        // If neither is sufficient, throw error
        else {
            throw new UserInputError(
                `Insufficient funds. Required: ${goldCost} Gold or ${whiteJewelCost} White Jewels`
            );
        }

        const newTickets = await quickBuyGachaTicket(userId, itemGacha.id, missingTickets, transaction);
        userGachaTickets = [...userGachaTickets, ...newTickets];

    }

    const ticketIds = userGachaTickets.map(ticket => ticket.id);

    // Get user's gacha level once
    const userGachaLevel = await this.findOrCreateUserGachaLevel(userId, itemGacha.id);

    // Calculate final counter and level after all spins
    const finalCounter = userGachaLevel.counter + spinCount;
    const { currentLevel, spinsToNext } = calculateGachaLevel(
        finalCounter,
        itemGacha.scale_factor,
        itemGacha.growth_rate
    );

    // Get all possible gacha items once
    const gachaItems = await gacha_items.findAll({
        attributes: [
            'id',
            'gacha_id',
            'ability_id',
            'boost_value',
            'description',
            [sequelize.literal('ability.name'), 'ability_name']
        ],
        where: { gacha_id: 1 }, // currently params gacha items are loaded
        include: [{
            model: abilities,
            attributes: [],
        }],
        raw: true
    });

    // Arrays to store results for bulk operations
    const spinLogs = [];

    const allUserAbilities = await user_inventory.findAll({
        where: { user_id: userId, ability_type: itemGacha.id },
        raw: true
    });

    // Keep track of current ability levels during spins
    const currentAbilityLevels = {};

    // Initialize with existing abilities
    allUserAbilities.forEach(ability => {
        currentAbilityLevels[ability.ability_id] = ability.level;
    });

    // Use a Map to track the latest result for each ability
    const finalResults = new Map();

    // Perform all spins
    for (let userGachaTicket of userGachaTickets) {
        const gachaItem = gachaItems[Math.floor(Math.random() * gachaItems.length)];
        const currentLevel = currentAbilityLevels[gachaItem.ability_id] || 1;
        const newLevel = itemGachaSpinner(itemGacha, currentLevel).level;

        const result = {
            ticket_id: userGachaTicket.id,
            ability_id: gachaItem.ability_id,
            ability_name: gachaItem.ability_name,
            current_level: currentLevel,
            proposed_level: newLevel,
            is_boost: newLevel > currentLevel,
            level_difference: newLevel - currentLevel
        };

        if (newLevel > currentLevel) {
            currentAbilityLevels[gachaItem.ability_id] = newLevel;
        }

        // Update the Map with the latest result for this ability
        finalResults.set(gachaItem.ability_id, result);

        // Still track all spins in logs
        spinLogs.push({
            user_id: userId,
            gacha_id: itemGacha.id,
            gacha_ticket_id: userGachaTicket.id,
            result: result,
            is_applied: false
        });
    }

    const allSpinLogResults = spinLogs.map(log => log.result);
    console.info('allSpinLogResults', allSpinLogResults);

    // Convert Map values to array for the response
    // const uniqueResults = Array.from(finalResults.values());
    // console.info('uniqueResults', uniqueResults);


    // Prepare updates based on final levels
    const abilityUpdates = [];
    for (const [ability_id, finalLevel] of Object.entries(currentAbilityLevels)) {
        const userAbility = allUserAbilities.find(ability => ability.ability_id === Number(ability_id));
        const originalLevel = userAbility?.level || 0;

        // Only update if there was an increase
        if (finalLevel > originalLevel) {
            abilityUpdates.push({
                user_id: userId,
                ability_id: Number(ability_id),
                level: finalLevel,
                ability_type: itemGacha.id,
                updated_at: new Date()
            });
        } else if (!userAbility) {
            // Create new entry if the ability does not exist in the inventory
            abilityUpdates.push({
                user_id: userId,
                ability_id: Number(ability_id),
                level: finalLevel,
                ability_type: itemGacha.id,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    console.info('abilityUpdates', abilityUpdates);
    try {
        // const allResults = abilityUpdates.map(update => ({
        //     ability_id: update.ability_id,
        //     ability_name: allUserAbilities.find(ability => ability.ability_id === update.ability_id).ability_name,
        //     old_level: allUserAbilities.find(ability => ability.ability_id === update.ability_id).level,
        //     new_level: update.level,
        //     is_applied: update.level > allUserAbilities.find(ability => ability.ability_id === update.ability_id).level
        // }));
        // Perform upserts in bulk within the transaction
        await Promise.all(abilityUpdates.map(update =>
            user_inventory.upsert(update, {
                transaction,
                // These fields uniquely identify the record
                fields: ['user_id', 'ability_id', 'level', 'ability_type', 'updated_at']
            })
        ));

        // Update user gacha level
        await user_gacha_levels.update(
            {
                counter: finalCounter,
                level: currentLevel,
                spins_to_next: spinsToNext
            },
            {
                where: { id: userGachaLevel.id },
                transaction
            }
        );

        // Mark all tickets as used
        await user_gacha_tickets.update(
            { used_at: new Date() },
            {
                where: { id: ticketIds },
                transaction
            }
        );

        // Later in the transaction block, update the money deduction:
        if (spentGold > 0 || spentWhiteJewels > 0) {
            const updateFields = {};
            if (spentGold > 0) updateFields.gold = sequelize.literal(`gold - ${spentGold}`);
            if (spentWhiteJewels > 0) updateFields.white_jewel = sequelize.literal(`white_jewel - ${spentWhiteJewels}`);

            await models.user_money.update(updateFields, {
                where: { user_id: userId },
                transaction
            });
        }

        // Bulk create spin logs
        // @ts-ignore
        const createdLogs = await user_gacha_logs.bulkCreate(spinLogs, { transaction });

        await transaction.commit();

        return {
            // gacha_spin_ids: createdLogs.map(log => log.id),
            total_spins: spinCount,
            results: allSpinLogResults
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};


exports.spinItemGachaV3 = async (spinCount, userId, spend_jewel = false) => {
    // Use transaction for all database operations
    const transaction = await db.transaction();

    const itemGacha = await gachas.findOne({
        where: { name: 'items' },
        raw: true
    },);
    if (!itemGacha) throw new Error('Item Gacha not found');

    // Get ticket details
    let userGachaTickets = await user_gacha_tickets.findAll({
        where: {
            // id: ticketIds,
            user_id: userId,
            gacha_id: itemGacha.id,
            used_at: null
        },
        limit: spinCount,
        raw: true
    });

    if (userGachaTickets.length !== spinCount && !spend_jewel) {
        throw new UserInputError(`You are missing ${spinCount - userGachaTickets.length} tickets to perform a ${spinCount}-Pull Item Gacha. You need to spend 'Jewels' to perform spins`, 300);
    }

    let spentWhiteJewels = 0, spentGold = 0;
    if (userGachaTickets.length < spinCount && spend_jewel) {
        const userMoney = await models.user_money.findOne({ where: { user_id: userId }, },);
        if (!userMoney) throw new UserInputError('User money not found');

        const missingTickets = spinCount - userGachaTickets.length;
        const goldCost = itemGacha.cost_gold * missingTickets;
        const whiteJewelCost = itemGacha.cost_white_jewel * missingTickets;

        // First try to use gold
        if (userMoney.gold >= goldCost) {
            spentGold = goldCost;
        }
        // If gold is insufficient, try white jewels
        else if (userMoney.white_jewel >= whiteJewelCost) {
            spentWhiteJewels = whiteJewelCost;
        }
        // If neither is sufficient, throw error
        else {
            throw new UserInputError(
                `Insufficient funds. Required: ${goldCost} Gold or ${whiteJewelCost} White Jewels`
            );
        }

        const newTickets = await quickBuyGachaTicket(userId, itemGacha.id, missingTickets, transaction);
        userGachaTickets = [...userGachaTickets, ...newTickets];

    }

    const ticketIds = userGachaTickets.map(ticket => ticket.id);

    // Get user's gacha level once
    const userGachaLevel = await this.findOrCreateUserGachaLevel(userId, itemGacha.id);

    // Calculate final counter and level after all spins
    const finalCounter = userGachaLevel.counter + spinCount;
    // const { currentLevel, spinsToNext } = calculateGachaLevel(
    //     finalCounter,
    //     itemGacha.scale_factor,
    //     itemGacha.growth_rate
    // );

    const { currentLevel, spinsToNext } = await calculateParamGachaLevel(userGachaLevel, finalCounter, spinCount
        // paramGacha.scale_factor,
        // paramGacha.growth_rate
    );

    // Get all possible gacha items once
    const gachaItems = await gacha_items.findAll({
        attributes: [
            'id',
            'gacha_id',
            'ability_id',
            'boost_value',
            'description',
            [sequelize.literal('ability.name'), 'ability_name']
        ],
        where: { gacha_id: 1 }, // currently params gacha items are loaded
        include: [{
            model: abilities,
            attributes: [],
        }],
        raw: true
    });

    // Arrays to store results for bulk operations
    const spinLogs = [];

    const allUserAbilities = await user_inventory.findAll({
        where: { user_id: userId, ability_type: itemGacha.id },
        raw: true
    });

    // Keep track of current ability levels during spins
    const currentAbilityLevels = {};

    // Initialize with existing abilities
    allUserAbilities.forEach(ability => {
        currentAbilityLevels[ability.ability_id] = ability.level;
    });

    // Use a Map to track the latest result for each ability
    const finalResults = new Map();

    // Perform all spins
    for (let userGachaTicket of userGachaTickets) {
        const gachaItem = gachaItems[Math.floor(Math.random() * gachaItems.length)];
        const currentLevel = currentAbilityLevels[gachaItem.ability_id] || 1;
        const newLevel = itemGachaSpinner(itemGacha, currentLevel).level;
console.log(currentLevel, newLevel, "---currentLevel, newLevel---")
        const result = {
            ticket_id: userGachaTicket.id,
            ability_id: gachaItem.ability_id,
            ability_name: gachaItem.ability_name,
            current_level: currentLevel,
            proposed_level: newLevel > currentLevel ? newLevel : currentLevel,
            // proposed_level: newLevel,
            is_boost: newLevel > currentLevel,
            level_difference: newLevel>currentLevel ? newLevel - currentLevel : 0
            // level_difference: newLevel - currentLevel
        };

        if ((newLevel > currentLevel) || (currentLevel === 1 && newLevel === 1)) {
            currentAbilityLevels[gachaItem.ability_id] = newLevel;
        }

        // Update the Map with the latest result for this ability
        finalResults.set(gachaItem.ability_id, result);

        // Still track all spins in logs
        spinLogs.push({
            user_id: userId,
            gacha_id: itemGacha.id,
            gacha_ticket_id: userGachaTicket.id,
            result: result,
            is_applied: false
        });
    }

    const allSpinLogResults = spinLogs.map(log => log.result);
    console.info('allSpinLogResults', allSpinLogResults);

    // Convert Map values to array for the response
    // const uniqueResults = Array.from(finalResults.values());
    // console.info('uniqueResults', uniqueResults);


    // Prepare updates based on final levels
    const abilityUpdates = [];
    for (const [ability_id, finalLevel] of Object.entries(currentAbilityLevels)) {
        const userAbility = allUserAbilities.find(ability => ability.ability_id === Number(ability_id));
        const originalLevel = userAbility?.level || 0;

        // Only update if there was an increase
        if (finalLevel > originalLevel) {
            abilityUpdates.push({
                user_id: userId,
                ability_id: Number(ability_id),
                level: finalLevel,
                ability_type: itemGacha.id,
                updated_at: new Date()
            });
        } else if (!userAbility) {
            // Create new entry if the ability does not exist in the inventory
            abilityUpdates.push({
                user_id: userId,
                ability_id: Number(ability_id),
                level: finalLevel,
                ability_type: itemGacha.id,
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    console.info('abilityUpdates', abilityUpdates);
    try {
        // const allResults = abilityUpdates.map(update => ({
        //     ability_id: update.ability_id,
        //     ability_name: allUserAbilities.find(ability => ability.ability_id === update.ability_id).ability_name,
        //     old_level: allUserAbilities.find(ability => ability.ability_id === update.ability_id).level,
        //     new_level: update.level,
        //     is_applied: update.level > allUserAbilities.find(ability => ability.ability_id === update.ability_id).level
        // }));
        // Perform upserts in bulk within the transaction
        await Promise.all(abilityUpdates.map(update =>
            user_inventory.upsert(update, {
                transaction,
                // These fields uniquely identify the record
                fields: ['user_id', 'ability_id', 'level', 'ability_type', 'updated_at']
            })
        ));

        // Update user gacha level
        await user_gacha_levels.update(
            {
                counter: finalCounter,
                level: currentLevel,
                spins_to_next: spinsToNext
            },
            {
                where: { id: userGachaLevel.id },
                transaction
            }
        );

        // Mark all tickets as used
        await user_gacha_tickets.update(
            { used_at: new Date() },
            {
                where: { id: ticketIds },
                transaction
            }
        );

        // Later in the transaction block, update the money deduction:
        if (spentGold > 0 || spentWhiteJewels > 0) {
            const updateFields = {};
            if (spentGold > 0) updateFields.gold = sequelize.literal(`gold - ${spentGold}`);
            if (spentWhiteJewels > 0) updateFields.white_jewel = sequelize.literal(`white_jewel - ${spentWhiteJewels}`);

            await models.user_money.update(updateFields, {
                where: { user_id: userId },
                transaction
            });
        }

        // Bulk create spin logs
        // @ts-ignore
        const createdLogs = await user_gacha_logs.bulkCreate(spinLogs, { transaction });

        await transaction.commit();

        return {
            // gacha_spin_ids: createdLogs.map(log => log.id),
            total_spins: spinCount,
            results: allSpinLogResults
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};


exports.getGachaSpinLogsOfUser = async (userId, gachaId, filter) => {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const offset = (page - 1) * limit;
    let clause = { user_id: userId, gacha_id: gachaId };

    if (filter.is_applied === true) clause.is_applied = true;
    if (filter.is_applied === false) clause.is_applied = false;

    const spinLogs = await user_gacha_logs.findAll({
        where: clause,
        limit: limit,
        offset: offset,
        order: [['id', 'DESC']],
        raw: true
    });

    return spinLogs;
}

/**
 * Spin skill gacha with transaction support
 * @param {number} spinCount Number of spins requested
 * @param {number} userId User ID
 * @param {boolean} spend_jewel Whether to use jewels if tickets are insufficient
 */
exports.spinSkillGachaV2 = async (spinCount, userId, spend_jewel = false) => {
    const transaction = await db.transaction();

    try {
        // Get skill gacha configuration
        const skillGacha = await gachas.findOne({
            where: { name: 'skills' },
            raw: true,
            transaction
        });

        if (!skillGacha) {
            throw new Error('Skill Gacha not found');
        }

        // Get available tickets
        let userGachaTickets = await user_gacha_tickets.findAll({
            where: {
                user_id: userId,
                gacha_id: skillGacha.id,
                used_at: null
            },
            limit: spinCount,
            raw: true,
            transaction
        });

        // Check if enough tickets/jewels
        if (userGachaTickets.length !== spinCount && !spend_jewel) {
            throw new UserInputError(
                `Insufficient tickets. Missing ${spinCount - userGachaTickets.length} tickets. ` +
                `You need to spend 'Jewels' to perform spins`,
                300
            );
        }

        // Handle jewel spending if needed
        let spentWhiteJewels = 0, spentGold = 0;
        if (userGachaTickets.length < spinCount && spend_jewel) {
            const userMoney = await models.user_money.findOne({ where: { user_id: userId }, },);
            if (!userMoney) throw new UserInputError('User money not found');

            const missingTickets = spinCount - userGachaTickets.length;
            const goldCost = skillGacha.cost_gold * missingTickets;
            const whiteJewelCost = skillGacha.cost_white_jewel * missingTickets;

            // First try to use gold
            if (userMoney.gold >= goldCost) {
                spentGold = goldCost;
            }
            // If gold is insufficient, try white jewels
            else if (userMoney.white_jewel >= whiteJewelCost) {
                spentWhiteJewels = whiteJewelCost;
            }
            // If neither is sufficient, throw error
            else {
                throw new UserInputError(
                    `Insufficient funds. Required: ${goldCost} Gold or ${whiteJewelCost} White Jewels`
                );
            }

            const newTickets = await quickBuyGachaTicket(userId, skillGacha.id, missingTickets, transaction);
            userGachaTickets = [...userGachaTickets, ...newTickets];
        }

        const ticketIds = userGachaTickets.map(ticket => ticket.id);

        // Get user's gacha level
        const userGachaLevel = await this.findOrCreateUserGachaLevel(userId, skillGacha.id,);

        // Calculate final counter and level
        const finalCounter = userGachaLevel.counter + spinCount;
        const { currentLevel, spinsToNext } = calculateGachaLevel(
            finalCounter,
            skillGacha.scale_factor,
            skillGacha.growth_rate
        );

        // Get all possible gacha items
        const gachaItems = await gacha_items.findAll({
            attributes: [
                'id',
                'gacha_id',
                'ability_id',
                'boost_value',
                'description',
                [sequelize.literal('ability.name'), 'ability_name']
            ],
            where: { gacha_id: skillGacha.id },
            include: [{
                model: abilities,
                attributes: [],
            }],
            raw: true,
            transaction
        });

        if (!gachaItems.length) {
            throw new Error('No gacha items found');
        }

        // Arrays for bulk operations
        const allResults = [];
        const spinLogs = [];

        // Perform spins
        for (let i = 0; i < spinCount; i++) {
            const gachaItem = gachaItems[Math.floor(Math.random() * gachaItems.length)];

            // Get user's current ability level
            const userCurrentAbility = await user_inventory.findOne({
                where: {
                    user_id: userId,
                    ability_id: gachaItem.ability_id,
                    ability_type: skillGacha.id
                },
                raw: true,
                transaction
            });

            // const currentLevel = userCurrentAbility?.level || 1;

            // const result = {
            //     ability_id: gachaItem.ability_id,
            //     ability_name: gachaItem.ability_name,
            //     current_level: currentLevel,
            // };
            let result = {};
            if (userCurrentAbility) {
                // increment the level of the ability
                const newLevel = userCurrentAbility.level + 1;
                await user_inventory.update({ level: newLevel }, { where: { id: userCurrentAbility.id }, transaction });
                result.skill_acquired = true;
                result.skill = gachaItem;
                result.new_level = newLevel;

            } else {
                result.skill_acquired = true;
                result.skill = gachaItem
                result.new_level = 1;
                // create user ability
                await user_inventory.create({ user_id: userId, ability_id: gachaItem.ability_id, level: 1, ability_type: skillGacha.id }, { transaction });
            }

            allResults.push({
                ticket_id: userGachaTickets[i]?.id || null,
                ...result
            });

            spinLogs.push({
                user_id: userId,
                gacha_id: skillGacha.id,
                gacha_ticket_id: userGachaTickets[i]?.id || null,
                result: result,
                is_applied: false
            });
        }

        // Bulk database operations
        await Promise.all([
            // Update user gacha level
            user_gacha_levels.update(
                {
                    counter: finalCounter,
                    level: currentLevel,
                    spins_to_next: spinsToNext
                },
                {
                    where: { id: userGachaLevel.id },
                    transaction
                }
            ),

            // Mark tickets as used
            ticketIds.length > 0 && user_gacha_tickets.update(
                { used_at: new Date() },
                {
                    where: { id: ticketIds },
                    transaction
                }
            ),

            // Deduct jewels if used
            (spentGold > 0 || spentWhiteJewels > 0) && models.user_money.update(
                {
                    gold: sequelize.literal(`gold - ${spentGold}`),
                    white_jewel: sequelize.literal(`white_jewel - ${spentWhiteJewels}`)
                },
                {
                    where: { user_id: userId },
                    transaction
                }
            ),
        ]);

        // Create spin logs
        const createdLogs = await user_gacha_logs.bulkCreate(spinLogs, { transaction });

        // let finalResults = new Map();
        // allResults.forEach(result => {
        //@ts-ignore
        // finalResults.set(result.skill.ability_id, { skill_name: result.skill.ability_name, new_level: result.new_level });
        // });

        const newResults = allResults.map(result => {
            return {
                ticket_id: result.ticket_id,
                // @ts-ignore
                skill_name: result.skill.ability_name,
                // @ts-ignore
                new_level: result.new_level
            }
        });

        await transaction.commit();

        return {
            gacha_spin_ids: createdLogs.map(log => log.id),
            total_spins: spinCount,
            // results: Array.from(finalResults.values()),
            results: newResults,
            // jewels_spent: spentWhiteJewels
        };

    } catch (error) {
        await transaction.rollback();
        console.error('Skill gacha spin failed:', error);
        throw error;
    }
}


// exports.setParamLevel = async () => {
//     let tempArr = [{level: 0, minGachaCount: 0, nextLvlReqdCount: 1},
//         {level: 1, minGachaCount: 1, nextLvlReqdCount: 7},
//         {level: 2, minGachaCount: 8, nextLvlReqdCount: 19},
//         {level: 3, minGachaCount: 27, nextLvlReqdCount: 37},
//         {level: 4, minGachaCount: 64, nextLvlReqdCount: 61},
//         {level: 5, minGachaCount: 125, nextLvlReqdCount: 91},
//         {level: 6, minGachaCount: 216, nextLvlReqdCount: 127},
//         {level: 7, minGachaCount: 343, nextLvlReqdCount: 169},
//         {level: 8, minGachaCount: 512, nextLvlReqdCount: 217},
//         {level: 9, minGachaCount: 729, nextLvlReqdCount: 271},
//         {level: 10, minGachaCount: 1000, nextLvlReqdCount: 331},
//         {level: 11, minGachaCount: 1331, nextLvlReqdCount: 397},
//         {level: 12, minGachaCount: 1728, nextLvlReqdCount: 469},
//         {level: 13, minGachaCount: 2197, nextLvlReqdCount: 547},
//         {level: 14, minGachaCount: 2744, nextLvlReqdCount: 631},
//         {level: 15, minGachaCount: 3375, nextLvlReqdCount: 721},
//         {level: 16, minGachaCount: 4096, nextLvlReqdCount: 817},
//         {level: 17, minGachaCount: 4913, nextLvlReqdCount: 919},
//         {level: 18, minGachaCount: 5832, nextLvlReqdCount: 1027},
//         {level: 19, minGachaCount: 6859, nextLvlReqdCount: 1141},
//         {level: 20, minGachaCount: 8000, nextLvlReqdCount: 1261},
//         {level: 21, minGachaCount: 9261, nextLvlReqdCount: 1387},
//         {level: 22, minGachaCount: 10648, nextLvlReqdCount: 1519},
//         {level: 23, minGachaCount: 12167, nextLvlReqdCount: 1657},
//         {level: 24, minGachaCount: 13824, nextLvlReqdCount: 1801},
//         {level: 25, minGachaCount: 15625, nextLvlReqdCount: 1951},
//         {level: 26, minGachaCount: 17576, nextLvlReqdCount: 2107},
//         {level: 27, minGachaCount: 19683, nextLvlReqdCount: 2269},
//         {level: 28, minGachaCount: 21952, nextLvlReqdCount: 2437},
//         {level: 29, minGachaCount: 24389, nextLvlReqdCount: 2611},
//         {level: 30, minGachaCount: 27000, nextLvlReqdCount: 2791},
//         {level: 31, minGachaCount: 29791, nextLvlReqdCount: 2977},
//         {level: 32, minGachaCount: 32768, nextLvlReqdCount: 3169},
//         {level: 33, minGachaCount: 35937, nextLvlReqdCount: 3367},
//         {level: 34, minGachaCount: 39304, nextLvlReqdCount: 3571},
//         {level: 35, minGachaCount: 42875, nextLvlReqdCount: 3781},
//         {level: 36, minGachaCount: 46656, nextLvlReqdCount: 3997},
//         {level: 37, minGachaCount: 50653, nextLvlReqdCount: 4219},
//         {level: 38, minGachaCount: 54872, nextLvlReqdCount: 4447},
//         {level: 39, minGachaCount: 59319, nextLvlReqdCount: 4681},
//         {level: 40, minGachaCount: 64000, nextLvlReqdCount: 4921},
//         {level: 41, minGachaCount: 68921, nextLvlReqdCount: 5167},
//         {level: 42, minGachaCount: 74088, nextLvlReqdCount: 5419},
//         {level: 43, minGachaCount: 79507, nextLvlReqdCount: 5677},
//         {level: 44, minGachaCount: 85184, nextLvlReqdCount: 5941},
//         {level: 45, minGachaCount: 91125, nextLvlReqdCount: 6211},
//         {level: 46, minGachaCount: 97336, nextLvlReqdCount: 6487},
//         {level: 47, minGachaCount: 103823, nextLvlReqdCount: 6769},
//         {level: 48, minGachaCount: 110592, nextLvlReqdCount: 7057},
//         {level: 49, minGachaCount: 117649, nextLvlReqdCount: 7351},
//         {level: 50, minGachaCount: 125000, nextLvlReqdCount: 7651},
//         {level: 51, minGachaCount: 132651, nextLvlReqdCount: 7957},
//         {level: 52, minGachaCount: 140608, nextLvlReqdCount: 8269},
//         {level: 53, minGachaCount: 148877, nextLvlReqdCount: 8587},
//         {level: 54, minGachaCount: 157464, nextLvlReqdCount: 8911},
//         {level: 55, minGachaCount: 166375, nextLvlReqdCount: 9241},
//         {level: 56, minGachaCount: 175616, nextLvlReqdCount: 9577},
//         {level: 57, minGachaCount: 185193, nextLvlReqdCount: 9919},
//         {level: 58, minGachaCount: 195112, nextLvlReqdCount: 10267},
//         {level: 59, minGachaCount: 205379, nextLvlReqdCount: 10621},
//         {level: 60, minGachaCount: 216000, nextLvlReqdCount: 10981},
//         {level: 61, minGachaCount: 226981, nextLvlReqdCount: 11347},
//         {level: 62, minGachaCount: 238328, nextLvlReqdCount: 11719},
//         {level: 63, minGachaCount: 250047, nextLvlReqdCount: 12097},
//         {level: 64, minGachaCount: 262144, nextLvlReqdCount: 12481},
//         {level: 65, minGachaCount: 274625, nextLvlReqdCount: 12871},
//         {level: 66, minGachaCount: 287496, nextLvlReqdCount: 13267},
//         {level: 67, minGachaCount: 300763, nextLvlReqdCount: 13669},
//         {level: 68, minGachaCount: 314432, nextLvlReqdCount: 14077},
//         {level: 69, minGachaCount: 328509, nextLvlReqdCount: 14491},
//         {level: 70, minGachaCount: 343000, nextLvlReqdCount: 14911},
//         {level: 71, minGachaCount: 357911, nextLvlReqdCount: 15337},
//         {level: 72, minGachaCount: 373248, nextLvlReqdCount: 15769},
//         {level: 73, minGachaCount: 389017, nextLvlReqdCount: 16207},
//         {level: 74, minGachaCount: 405224, nextLvlReqdCount: 16651},
//         {level: 75, minGachaCount: 421875, nextLvlReqdCount: 17101},
//         {level: 76, minGachaCount: 438976, nextLvlReqdCount: 17557},
//         {level: 77, minGachaCount: 456533, nextLvlReqdCount: 18019},
//         {level: 78, minGachaCount: 474552, nextLvlReqdCount: 18487},
//         {level: 79, minGachaCount: 493039, nextLvlReqdCount: 18961},
//         {level: 80, minGachaCount: 512000, nextLvlReqdCount: 19441},
//         {level: 81, minGachaCount: 531441, nextLvlReqdCount: 19927},
//         {level: 82, minGachaCount: 551368, nextLvlReqdCount: 20419},
//         {level: 83, minGachaCount: 571787, nextLvlReqdCount: 20917},
//         {level: 84, minGachaCount: 592704, nextLvlReqdCount: 21421},
//         {level: 85, minGachaCount: 614125, nextLvlReqdCount: 21931},
//         {level: 86, minGachaCount: 636056, nextLvlReqdCount: 22447},
//         {level: 87, minGachaCount: 658503, nextLvlReqdCount: 22969},
//         {level: 88, minGachaCount: 681472, nextLvlReqdCount: 23497},
//         {level: 89, minGachaCount: 704969, nextLvlReqdCount: 24031},
//         {level: 90, minGachaCount: 729000, nextLvlReqdCount: 24571},
//         {level: 91, minGachaCount: 753571, nextLvlReqdCount: 25117},
//         {level: 92, minGachaCount: 778688, nextLvlReqdCount: 25669},
//         {level: 93, minGachaCount: 804357, nextLvlReqdCount: 26227},
//         {level: 94, minGachaCount: 830584, nextLvlReqdCount: 26791},
//         {level: 95, minGachaCount: 857375, nextLvlReqdCount: 27361},
//         {level: 96, minGachaCount: 884736, nextLvlReqdCount: 27937},
//         {level: 97, minGachaCount: 912673, nextLvlReqdCount: 28519},
//         {level: 98, minGachaCount: 941192, nextLvlReqdCount: 29107},
//         {level: 99, minGachaCount: 970299, nextLvlReqdCount: 29701},
//         {level: 100, minGachaCount: 1000000, nextLvlReqdCount: 999999999}]

//         for (let i = 0; i < tempArr.length; i++) {
//             const element = tempArr[i];
            
//             let resp = await rfm_param_lvl_std.create({
//                 level: element.level,
//                 minGachaCount: element.minGachaCount,
//                 nextLvlReqdCount: element.nextLvlReqdCount
//             })

//             console.log(resp, "===resp===")
//         }

//         return true
// }
