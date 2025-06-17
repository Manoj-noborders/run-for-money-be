const delay = require('delay');
const models = require('../models');
const inventoryService = require('./inventory.service');
const leaderboardService = require('./leaderboard.service');

// Create user money if it does not exist
const createUserMoneyIfNotExists = async (userId) => {
    const userMoney = await models.user_money.findOne({ where: { user_id: userId } });
    if (!userMoney) {
        await models.user_money.findOrCreate({
            where: { user_id: userId },
            defaults: { gold: 60000 }
        });
    }
};

// Create function to generate user gacha levels
const generateUserGachaLevels = async (userId) => {
    const gachas = await models.gachas.findAll({ raw: true });
    for (const gacha of gachas) {
        await models.user_gacha_levels.findOrCreate({
            where: { user_id: userId, gacha_id: gacha.id },
            defaults: { level: 0, counter: 0, spins_to_next: 1 }
        });
    }
};

// Use function from gacha service to create basic abilities for user
const createBasicAbilitiesForUser = async (userId) => {
    return await inventoryService.createUserBasicAbilities(userId);
};

// Create function to give 60,000 gold bonus money on registration
const giveBonusMoneyOnRegistration = async (userId, money) => {
    const userMoney = await models.user_money.findOne({ where: { user_id: userId } });

    // default money set to 0
    if (userMoney) {
        await models.user_money.update({ gold: userMoney.gold + money || 0 }, { where: { user_id: userId } });
    } else {
        await models.user_money.create({
            user_id: userId, gold: money || 0
        });
    }
};


// Create user league if does not exists
const createUserLeagueIfNotExists = async (userId) => {
    const userLeague = await models.userLeagues.findOne({ where: { userId } });
    if (!userLeague) {
        await models.userLeagues.create({ userId, leagueId: 1 });
    }
}



async function checkAndCreateUserRFMattributes(userId) {
    try {
        await delay(500);
        const userRFM = await models.users.findOne({ where: { id: userId } });
        if (userRFM.rfm_first_login == true) {
            await generateUserGachaLevels(userId);
            await createBasicAbilitiesForUser(userId);
            await giveBonusMoneyOnRegistration(userId);
            await createUserMoneyIfNotExists(userId);
            await createUserLeagueIfNotExists(userId);

            await models.users.update({ rfm_first_login: false }, { where: { id: userId } });

            await leaderboardService.addToLeaderboardV2(userId);
        } else {
            console.log('User First login is false, Not creating RFM attributes');
        }
    } catch (error) {
        console.error(error);
    }
}



module.exports = {
    checkAndCreateUserRFMattributes,
    giveBonusMoneyOnRegistration,
};