//@ts-check
const Models = require('../models');
const aiUsers = Models.aiUsers;
const users = Models.users;
const userLeagues = Models.userLeagues;
const aiFreeUsers = Models.aiFreeUsers;
const leagues = Models.leagues;
// const userBattlesCount = Models.userBattlesCount;
const leaguesDetails = Models.leaguesDetails;
const userXetaBalance = Models.userXetaBalance;
const userLeaguesHistories = Models.userLeaguesHistories;
const userExperience = Models.userExperience;
const { Op } = require("sequelize");

const postworkService = require('./users.postwork.service');
const db = require('../database/database');

module.exports = {

    async findRandomAiUsers(leagueId, userCount) {
        // Start a transaction
        const transaction = await db.transaction();

        try {
            // First, find eligible user IDs with a simpler query that can be locked
            const eligibleUsers = await users.findAll({
                attributes: ['id'],
                where: {
                    role: 5,
                    aiStatus: 'notplaying',
                    isDeleted: false
                },
                include: [{
                    model: userLeagues,
                    where: {
                        leagueId: leagueId,
                        is_playing: false
                    },
                    required: true // Makes it an INNER JOIN
                }],
                limit: userCount,
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (eligibleUsers.length === 0) {
                await transaction.commit();
                return [];
            }

            const userIds = eligibleUsers.map(user => user.id);

            // Update these users
            await users.update(
                { aiStatus: 'checked' },
                {
                    where: { id: { [Op.in]: userIds } },
                    transaction
                }
            );

            // Now fetch the complete user data with all the joins you need
            const aiUsers = await users.findAll({
                where: { id: { [Op.in]: userIds } },
                attributes: ['id', 'name', 'aiStatus'],
                include: [
                    {
                        model: userLeagues,
                        where: { leagueId: leagueId },
                        include: [{
                            model: leagues,
                            include: [{
                                model: leaguesDetails
                            }]
                        }],
                    },
                ],
                raw: true,
                transaction
            });

            // Commit the transaction
            await transaction.commit();
            return aiUsers;
        } catch (error) {
            // If anything fails, roll back
            await transaction.rollback();
            throw error;
        }
    },

    async updateAiUserPlayStatus(data, playerIdArr) {
        return await users.update(data, { where: { id: { [Op.in]: playerIdArr }, role: 5 }, returning: true });
    },

    async getFreeUsersCount(leagueId) {
        return await users.count({
            where: { role: 5, aiStatus: 'notplaying', isDeleted: false },
            attributes: { exclude: ['dob', 'phoneNumber', 'userType', 'userInfo', 'nonce', 'email', 'avatar', 'tcgAvatar', 'coins', 'isVerified', 'isRegister', 'isDeleted', 'createdAt', 'updatedAt'] },
            include: [{
                model: userLeagues,
                where: { leagueId: leagueId },
                attributes: { exclude: ['createdAt', 'updatedAt'] },
                include: [{
                    model: leagues,
                    attributes: { exclude: ['createdAt', 'updatedAt'] }
                }]
            }],
            order: [['id', 'ASC']]
        });
    },

    async getLastAiUser() {
        let lastAiUser = await users.findOne({ where: { role: 5 }, order: [['id', 'DESC']] });
        return lastAiUser ? lastAiUser : { id: 0 }
    },

    async createAiUser(data) {
        return await users.create(data);
    },













    async createUserLeague(data) {
        return await userLeagues.create(data);
    },
    async createFreeAiUser(data) {
        return await aiFreeUsers.create(data);
    },
    async updateAiUser(data, id) {
        return await users.update(data, { where: { id: id } });
    },
    async findAiUserByName(name) {
        return await users.findOne({ where: { name: name, role: 5 } });
    },
    async findFreeAiUserByName(name) {
        return await aiFreeUsers.findOne({ where: { name: name } });
    },
    async findAiUserById(id) {
        return await users.findOne({
            where: { id: id },
            include: [{
                model: userLeagues
            }]
        });
    },
    async findAllAiUser() {
        return await users.findAll({
            attributes: { exclude: ['dob', 'phoneNumber', 'userType', 'userInfo', 'walletAddress', 'nonce', 'email', 'avatar', 'tcgAvatar', 'coins', 'isVerified', 'isRegister', 'isDeleted', 'createdAt', 'updatedAt'] },
            where: { role: 5 },
            include: [{
                model: userLeagues,
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            }]
        });
    },
    async findAllAiUser2() {
        return await users.findAll({
            attributes: { exclude: ['dob', 'phoneNumber', 'userType', 'userInfo', 'nonce', 'email', 'avatar', 'tcgAvatar', 'coins', 'isVerified', 'isRegister', 'isDeleted', 'createdAt', 'updatedAt'] },
            where: { role: 5, walletAddress: { [Op.ne]: null } },
            include: [{
                model: userLeagues,
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            }],
            order: [["createdAt", 'ASC']]
        });
    },
    async findAllAiFreeUser() {
        return await aiFreeUsers.findAll();
    },
    async findAiFreeUserById(id) {
        return await aiFreeUsers.findOne({ where: { id: id } });
    },


    async createAiUsersMoney(aiIds) {
        // let aiUserMoney = [];
        for (let aiId of aiIds) {
            console.log(aiId, "---aiId--- creating money for this AI user  --------------");
            await postworkService.giveBonusMoneyOnRegistration(aiId, 99999999999);
        }
    },

    async getAIBasicAbilities() {
        const basicAbilities = await Models.abilities.findAll({
            where: {
                type: 'basic'
            },
            attributes: ['id', 'name', 'type', 'description', 'effect_value', 'default_val', 'min', 'max'],
            raw: true
        });

        const aiAbilities = {};

        for (const ability of basicAbilities) {
            aiAbilities[ability.name] = ability.default_val;
        }

        aiAbilities.basic_abilities = basicAbilities.map(ability => ({
            name: ability.name,
            min: ability.min,
            max: ability.max
        }));

        return aiAbilities;

    },

    async getRandomAiUsersV2(leagueId, userCount) {
        // fetch all users whose aiSatus isnt 'playing || checked' and role = 5
        const usersWithLeague = await users.findAll({
            attributes: { exclude: ['dob', 'phoneNumber', 'userType', 'userInfo', 'nonce', 'email', 'avatar', 'tcgAvatar', 'coins', 'isVerified', 'isRegister', 'isDeleted', 'createdAt', 'updatedAt'] },
            where: { role: 5, walletAddress: { [Op.ne]: null } },
            include: [{
                model: userLeagues,
                where: { leagueId: leagueId },
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            }],
            // order: [["createdAt", 'ASC']],
            limit: userCount

        });

        console.info(usersWithLeague, "---usersWithLeague---");

        return [];
    },

}
