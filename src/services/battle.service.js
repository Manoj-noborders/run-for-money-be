//@ts-check
const Models = require('../models');
const users = Models.users;
const userLeagues = Models.userLeagues;
const leaguesDetails = Models.leaguesDetails;
const leagues = Models.leagues;
const userDecks = Models.userDecks;
const userMappings = Models.userMappings;
const rfmAssets = Models.rfmAssets;
const series = Models.series;
const loginStatus = Models.loginStatus;
const userDevices = Models.userDevices;
const topUserHistories = Models.topUserHistories;
const userRequestTimes = Models.userRequestTimes;
const userDuels = Models.userDuels;
const aiFreeUsers = Models.aiFreeUsers;
const userLp = Models.userLp;
const userLiveStreams = Models.userLiveStreams;
const LiveStreamData = Models.liveStreamsData;
const userXetaBalance = Models.userXetaBalance;
const userLeaguesHistories = Models.userLeaguesHistories;
const userExperience = Models.userExperience;
const experienceLevels = Models.experienceLevels;
const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const db = require('../database/database');


module.exports = {
    async checkBattleStatus(users, opponents) {
        let usersBattleGoing = await userDuels.findAll({
            where: {
                hunterId: { [Op.overlap]: [...users] },
                has_ended: false,
                duelEndDate: null
            }
        });
        let battleUsers = [];
        if (usersBattleGoing && usersBattleGoing.length) {
            for (let i = 0; i < usersBattleGoing[0].hunterId.length; i++) {
                const element = usersBattleGoing[0].hunterId[i];
                let ind = users.findIndex(dt => dt === element)
                if (ind > -1) {
                    battleUsers.push(element)
                }
            }
        }

        let opponentBattleGoing = await userDuels.findAll({
            where: {
                runnerId: { [Op.overlap]: [...opponents] },
                has_ended: false,
                duelEndDate: null
            }
        });
        let battleOpponents = [];
        if (opponentBattleGoing && opponentBattleGoing.length) {
            for (let i = 0; i < opponentBattleGoing[0].runnerId.length; i++) {
                const element = opponentBattleGoing[0].runnerId[i];
                let ind = opponents.findIndex(dt => dt === element)
                if (ind > -1) {
                    battleOpponents.push(element)
                }
            }
        }
        let finalPlayers = [...battleUsers, ...battleOpponents];
        return finalPlayers;
    },

    async createNewBattle(db_payload) {
        return await userDuels.create({ ...db_payload });
    },

    async getSingleBattle(roomId) {
        return await userDuels.findOne({ where: { roomId } });
    },

    async getLeagueDetailsById(leagueId) {
        return await leaguesDetails.findOne({ where: { leagueId: leagueId }, raw: true });
    },

    async getLeagueById(leagueId) {
        return await leagues.findOne({
            where: { id: leagueId }, raw: true
        });
    },

    async deductGoldFromUser(playerId, fuelConsuption) {
        return await userXetaBalance.decrement('balance', {
            by: fuelConsuption,
            where: { userId: playerId },
            // silent: true
        });
    },

    async checkDeductionIn20Secs(playerId) {
        let time20Secs = new Date(Date.now() - 20000);
        return await userXetaBalance.findAll({
            where: {
                userId: playerId,
                updatedAt: { [Op.gte]: time20Secs }
            }
        })
    },

    async refundGoldToUser(playerId, fuelConsuption) {
        return await userXetaBalance.increment('balance', {
            by: fuelConsuption,
            where: { userId: playerId },
            returning: true
        });
    },

    async rewardGoldForUser(userId, fuel) {
        let userGold = await userXetaBalance.findOne({ where: { userId } })
        if (userGold) {
            await userXetaBalance.increment('balance', {
                by: fuel,
                where: { userId: userId },
                // silent: true
            });
        } else {
            await userXetaBalance.create({ userId: userId, balance: 0 })
        }
        return true
    },

    async createAiUserGold(userId) {
        return await userXetaBalance.create({ userId: userId, balance: 10000 })
    },

    async createUserLeague(data) {
        return await userLeagues.create(data);
    },

    async getAllLeaguesBasic() {
        return await leagues.findAll({ raw: true, order: [['id', 'ASC']] });
    },

    async getRunningBattles() {
        return await userDuels.findAll({
            where: {
                duelEndDate: null,
                has_ended: false,
                createdAt: {
                    [Op.lt]: Sequelize.literal("NOW() - INTERVAL '20 minutes'")
                }
            },
            raw: true
        });
    },

    async checkRemoveUserInBattles(userId) {
        let usersBattleGoing = await userDuels.findAll({
            where: {
                hunterId: { [Op.overlap]: [userId] },
                has_ended: false,
                duelEndDate: null
            }
        });
        if (usersBattleGoing && usersBattleGoing.length) {
            for (let i = 0; i < usersBattleGoing.length; i++) {
                const element = usersBattleGoing[i];
                let hunterIdArr = usersBattleGoing[i].hunterId;
                let ind = hunterIdArr.findIndex(dt => userId === dt)
                if (ind > -1) {
                    hunterIdArr.splice(ind, 1)
                }
                await userDuels.update({ hunterId: hunterIdArr }, { where: { id: element.id } })
            }
        }

        let opponentBattleGoing = await userDuels.findAll({
            where: {
                runnerId: { [Op.overlap]: [userId] },
                has_ended: false,
                duelEndDate: null
            }
        });
        if (opponentBattleGoing && opponentBattleGoing.length) {
            for (let i = 0; i < opponentBattleGoing.length; i++) {
                const element = opponentBattleGoing[i];
                let runnerIdArr = opponentBattleGoing[i].runnerId;
                let ind = runnerIdArr.findIndex(dt => userId === dt)
                if (ind > -1) {
                    runnerIdArr.splice(ind, 1)
                }
                await userDuels.update({ runnerId: runnerIdArr }, { where: { id: element.id } })
            }
        }

        if (usersBattleGoing.length === 0 && opponentBattleGoing.length === 0) {
            return false
        } else {
            return true;
        }
    },

    async checkUserRunningBattles(userId) {
        let usersBattleGoing = await userDuels.findAll({
            where: {
                hunterId: { [Op.overlap]: [userId] },
                has_ended: false,
                duelEndDate: null
            }
        });
        let opponentBattleGoing = await userDuels.findAll({
            where: {
                runnerId: { [Op.overlap]: [userId] },
                has_ended: false,
                duelEndDate: null
            }
        });
        if ((usersBattleGoing && usersBattleGoing.length) || (opponentBattleGoing && opponentBattleGoing.length)) {
            return true;
        }
        return false;
    },

    async getUserLatestRunningBattles(userId) {
        let usersBattleGoing = await userDuels.findOne({
            where: {
                hunterId: { [Op.overlap]: [userId] },
                has_ended: false,
                duelEndDate: null
            },
            order: [['createdAt', 'DESC']]
        });
        let opponentBattleGoing = await userDuels.findOne({
            where: {
                runnerId: { [Op.overlap]: [userId] },
                has_ended: false,
                duelEndDate: null
            },
            order: [['createdAt', 'DESC']]
        });
        if (usersBattleGoing || opponentBattleGoing) {
            return usersBattleGoing || opponentBattleGoing;
        }
        return {};
    },

    async updateUserBattleExp(playerBattleStatus, userId) {
        let usersExpData = await userExperience.findOne({
            where: { userId },
        });

        if (!usersExpData) {
            userExperience.create({
                userId: userId,
                player_xp: playerBattleStatus === 'WIN' ? 40 : 20
            })
        } else {
            let newXp_Points = playerBattleStatus === 'WIN' ? usersExpData.player_xp + 40 : usersExpData.player_xp + 20;

            let xpLevelByPoints = await experienceLevels.findOne({
                where: { min_xp: { [Op.lte]: newXp_Points }, max_xp: { [Op.gte]: newXp_Points } }
            })

            await userExperience.update({
                player_xp: newXp_Points,
                xp_level: xpLevelByPoints.level
            }, { where: { userId: userId } })
        }
        return true;
    },














    // // previous services for reference only
    async createUserDual(data) {
        return await userDuels.create(data);
    },
    async updateUserDual(data, id) {
        return await userDuels.update(data, { where: { id: id } });
    },
    async getUserDualById(id) {
        return await userDuels.findOne({
            where: { id: id }
        });
    },
    async addTopUsersHistory(data) {
        return await topUserHistories.create(data);
    },
    async getTopUsersHistoryByDate(date) {
        return await topUserHistories.findOne({ where: { date: date } });
    },
    async getUserRequestTime(userId) {
        return await userRequestTimes.findOne({ where: { userId: userId } });
    },
    async updateUserRequestTime(data, id) {
        return await userRequestTimes.update(data, { where: { id: id } });
    },
    async addUserRequestTime(data) {
        return await userRequestTimes.create(data);
    },
    async destroyUserRequestTime(userId) {
        return await userRequestTimes.destroy({ where: { userId: userId } });
    },
    async findAllFromUserRequestTimes() {
        return await userRequestTimes.findAll({
            where: {
                date: {
                    [Op.lt]: new Date(new Date().setHours(new Date().getHours() - 1))
                }
            }
        });
    },
    async getAllLeagues() {
        return await leagues.findAll({
            attributes: ['id', 'name', 'minFuelReq', 'fuelConsuption'],
            order: [['id', 'ASC']]
        });
    },
    async bulkUserLeagueData(arrayData) {
        return await Promise.all(
            arrayData.map((obj) => {
                console.info(obj.global_rank, obj.id, "---obj---178")
                if (obj.id) {
                    userLeagues.update({ global_rank: obj.global_rank }, {
                        where: { id: obj.id }
                    });
                }
            })
        );
    },
    async getAllLeagueId() {
        return await leagues.findAll({
            attributes: ['id', 'name']
        });
    },
    async getUserByPhone(phoneNumber) {
        return await users.findOne({
            where: { phoneNumber: phoneNumber, isDeleted: false }
        });
    },
    async getUserById(id) {
        return await users.findOne({
            where: { id: id },
            include: {
                model: userXetaBalance,
                as: 'userXetaBalances'
            }
        });
    },
    async getAiFreeUser(id) {
        return await aiFreeUsers.findOne({ where: { id: id } });
    },
    async createUser(data) {
        return await users.create(data);
    },
    async getSingleUserDetails(userId) {
        return await users.findOne({
            where: { id: userId },
            attributes: {
                exclude: ['userType', 'userInfo', 'nonce', 'isVerified', 'isRegister', 'isDeleted', 'createdAt', 'updatedAt']
            },
            include: [
                {
                    model: userLeagues,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'rankByLeague', 'rankBySeries']
                    },
                    include: [
                        {
                            model: leagues,
                            attributes: {
                                exclude: ['createdAt', 'updatedAt', 'hp', 'initialManaCost', 'initialManaCost', 'minFuelReq', 'fuelConsuption']
                            },
                            include: [
                                {
                                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                                    model: leaguesDetails
                                }
                            ]
                        }
                    ]
                },
                {
                    model: userXetaBalance,
                    as: 'userXetaBalances'
                }
            ]
        });
    },
    async getSingleUserDetailsV2(userId) {
        return await users.findOne({
            where: { id: userId },
            attributes: {
                exclude: ['userType', 'userInfo', 'nonce', 'isVerified', 'isRegister', 'isDeleted', 'createdAt', 'updatedAt']
            },
            include: [
                {
                    model: userLeagues,
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                    include: [
                        {
                            model: leagues,
                            attributes: {
                                exclude: ['createdAt', 'updatedAt', 'hp', 'initialManaCost', 'initialManaCost', 'minFuelReq', 'fuelConsuption']
                            },
                            include: [
                                {
                                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                                    model: leaguesDetails
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    },
    async getSingleUserDetailsV3(userId) {
        return await users.findOne({
            where: { id: userId },
            attributes: {
                exclude: ['userType', 'userInfo', 'nonce', 'isVerified', 'isRegister', 'isDeleted', 'createdAt', 'updatedAt']
            },
            include: [
                {
                    model: userLeagues,
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                    include: [
                        {
                            model: leagues,
                            attributes: { exclude: ['createdAt', 'updatedAt'] },
                            include: [
                                {
                                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                                    model: leaguesDetails
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    },

    async getUserListInLeague(groupId, leagueId, seriesId, pageNumber, pageSize) {
        let offset = pageSize * (pageNumber - 1);
        return await users.findAndCountAll({
            distinct: true,
            offset: offset,
            limit: pageSize,
            attributes: {
                exclude: ['userType', 'userInfo', 'nonce', 'isVerified', 'isRegister', 'isDeleted', 'createdAt', 'updatedAt']
            },
            include: [
                {
                    required: true,
                    duplicating: false,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'rankByLeague', 'rankBySeries']
                    },
                    model: userLeagues,
                    where: { seriesId: seriesId },
                    include: [
                        {
                            attributes: { exclude: ['createdAt', 'updatedAt'] },
                            model: leagues,
                            where: { id: leagueId },
                            include: [
                                {
                                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                                    model: leaguesDetails
                                }
                            ]
                        },
                        {
                            attributes: { exclude: ['createdAt', 'updatedAt'] },
                            model: series
                        }
                    ]
                }
            ],
            order: [[{ model: userLeagues, as: 'userLeague' }, 'rating', 'DESC']]
        });
    },
    async getUserLeagueByLeague(leagueId) {
        return await users.findAndCountAll({
            distinct: true,
            attributes: {
                exclude: ['userType', 'userInfo', 'nonce', 'isVerified', 'isRegister', 'isDeleted', 'createdAt', 'updatedAt']
            },
            include: [
                {
                    required: true,
                    duplicating: false,
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                    model: userLeagues,
                    where: { leagueId: leagueId },
                    include: [
                        {
                            attributes: { exclude: ['createdAt', 'updatedAt'] },
                            model: leagues,
                            where: { id: leagueId },
                            include: [
                                {
                                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                                    model: leaguesDetails
                                }
                            ]
                        },
                        {
                            attributes: { exclude: ['createdAt', 'updatedAt'] },
                            model: series
                        }
                    ]
                }
            ],
            order: [[{ model: userLeagues, as: 'userLeague' }, 'rating', 'desc'], [{ model: userLeagues, as: 'userLeague' }, 'rankByLeague', 'ASC']]
        });
    },
    async getAllUserList(seriesId, pageNumber, pageSize) {
        let offset = pageSize * (pageNumber - 1);
        return await users.findAndCountAll({
            distinct: true,
            offset: offset,
            limit: pageSize,
            subQuery: false,
            attributes: {
                exclude: ['userType', 'userInfo', 'nonce', 'isVerified', 'isRegister', 'isDeleted', 'createdAt', 'updatedAt']
            },
            include: [
                {
                    required: true,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'rankByLeague', 'rankBySeries']
                    },
                    model: userLeagues,
                    where: { seriesId: seriesId },
                    include: [
                        {
                            attributes: { exclude: ['createdAt', 'updatedAt'] },
                            model: leagues,
                            include: [
                                {
                                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                                    model: leaguesDetails
                                }
                            ]
                        },
                        {
                            attributes: { exclude: ['createdAt', 'updatedAt'] },
                            model: series
                        }
                    ]
                }
            ],
            order: [[{ model: userLeagues, as: 'userLeague' }, 'rating', 'DESC']]
        });
    },
    async updateUser(id, data) {
        return await users.update(data, { where: { id: id } });
    },
    async getUserDevicesForSocket(userId, deviceId) {
        return await userDevices.findOne({
            where: { userId: userId, deviceId: deviceId }
        });
    },
    async checkUserDevice(deviceId) {
        return await userDevices.findOne({ where: { deviceId: deviceId } });
    },
    async findExistingLp() {
        return await userLp.findOne();
    },
    async updateLp(data, id) {
        return await userLp.update(data, { where: { id: id } });
    },
    async checkLiveStreamUser(id) {
        return await userLiveStreams.findOne({ where: { id: id } });
    },
    async UpdateLiveStreamUser(id, user_id) {
        return await userLiveStreams.update(user_id, { where: { id: id } });
    },
    async getAllLiveStreamUsers() {
        return await userLiveStreams.findAll();
    },
    async addLiveStreamUser(data) {
        return await userLiveStreams.create(data);
    },

    async addLeagueHistory(data) {
        return await userLeaguesHistories.create(data);
    },

    async checkLiveStreamUserAuthority(id) {
        return await userLiveStreams.findOne({ where: { user_id: id } });
    },

    async checkLiveStreamAvailability(id) {
        return await LiveStreamData.findOne({ where: { id: id, endTime: null } });
    },

    async AddNewLiveStream(data) {
        return await LiveStreamData.create(data);
    },

    async getCurrentLiveStream() {
        let currentTime = new Date();
        let res = await LiveStreamData.findOne({
            attributes: ['id', 'user_id', 'url', 'startTime', 'endTime'],
            where: { startTime: { [Op.lte]: currentTime }, endTime: null }
        });

        return res;
    },

    async UpdateLiveStreamData(payload) {
        return await LiveStreamData.update({ endTime: payload.endTime }, { where: { id: payload.id } });
    },

    async resetLiveStreamData() {
        const sequenceName = 'userLiveStreams_id_seq';
        await userLiveStreams.sequelize.query(`ALTER SEQUENCE "${sequenceName}" RESTART WITH 1;`);
        await userLiveStreams.destroy({
            truncate: true
        });
    },

    async createLp(data) {
        return await userLp.create(data);
    },
    async getUserByWallet(walletAddress) {
        // return await users.findOne({ where: { walletAddress: walletAddress.toLowerCase(), isDeleted: false } });
        return await users.findOne({
            where: {
                walletAddress: {
                    [Sequelize.Op.iLike]: walletAddress
                },
                isDeleted: false
            }
        });
    },
    async getUserByNonce(nonce) {
        return await users.findOne({ where: { nonce: nonce, isDeleted: false } });
    },
    async getUserByEmail(email) {
        return await users.findOne({
            where: {
                $and: Sequelize.where(Sequelize.fn('lower', Sequelize.col('email')), Sequelize.fn('lower', email)),
                isDeleted: false
            }
        });
    },
    async createUserMapping(data) {
        return await userMappings.build(data).save();
    },
    async getUserMapping(userId) {
        const result = await userMappings.findOne({ where: { userId: userId } });
        return result;
    },
    async getUserDevices(userId, userInfo, app_id) {
        const whereClause = { userId: userId, userInfo: userInfo };
        if (app_id) whereClause.native_app_id = app_id;
        return await userDevices.findOne({ where: whereClause });
    },
    async getAllUserDeviceByUserId(userId) {
        return await userDevices.findAll({ where: { userId: userId } });
    },
    async updateUserDevice(id, data) {
        return await userDevices.update(data, { where: { id: id }, returning: true });
    },
    async saveUserDevice(data) {
        return await userDevices.create(data);
    },
    async checkUserDeck(userId) {
        return await userDecks.findOne({ where: { userId: userId } });
    },
    async getLogindbStatus() {
        return await loginStatus.findOne({});
    },
    async updateUserDeck(userId, data) {
        return await userDecks.update(data, { where: { userId: userId } });
    },
    async createUserDeck(data) {
        return await userDecks.create(data);
    },
    async getLeagueDetailByRating(rating) {
        return await leaguesDetails.findOne({
            where: { min: { [Op.lte]: rating }, max: { [Op.gte]: rating } }
        });
    },
    async findUserLeague(id) {
        return await userLeagues.findOne({ where: { userId: id } });
    },
    async getAllUserByLeagueId(id) {
        return await userLeagues.findAll({ where: { leagueId: id } });
    },
    async updateUserLeague(data, id) {
        return await userLeagues.update(data, { where: { userId: id } });
    },
    async destroyUserDevices(userId) {
        return await userDevices.destroy({ where: { userId: userId } });
    },
    async destroyUserDevicesById(id) {
        return await userDevices.destroy({ where: { id: id } });
    },
    async addAsset(data) {
        return await rfmAssets.create(data);
    },
    async getAllAssetFile() {
        return await rfmAssets.findAll();
    },
    async updateUserLeagueForRank(data, id) {
        return await userLeagues.update(data, { where: { id: id } });
    },
    async findAllUserLeagues() {
        return await userLeagues.findAll({
            include: [
                {
                    model: users,
                    required: true, // INNER JOIN to only get users that exist in the users table
                    attributes: [], // Exclude all attributes from the users table
                },
            ],
            raw: true
        });
    },
    async findAllUserLeaguesByLeagueId(leagueId) {
        return await userLeagues.findAll({ where: { leagueId: leagueId } });
    },
    async findMaxLeagueRankByLeagueId(leagueId) {
        return await userLeagues.findAll({
            where: { leagueId: leagueId },
            attributes: [[Sequelize.fn('max', Sequelize.col('rankByLeague')), 'maxRankByLeague']]
        });
    },
    async findMaxSeariesRankByLeagueId(leagueId) {
        return await userLeagues.findAll({
            where: { leagueId: leagueId },
            attributes: [[Sequelize.fn('max', Sequelize.col('rankBySeries')), 'maxRankBySeries']]
        });
    },
    async getAllUserLeagueBySeriesId(seriesId, pageNumber, pageSize) {
        let offset = pageSize * (pageNumber - 1);
        return await users.findAndCountAll({
            distinct: true,
            offset: offset,
            limit: pageSize,
            attributes: {
                exclude: ['userType', 'userInfo', 'nonce', 'isVerified', 'isRegister', 'isDeleted', 'createdAt', 'updatedAt']
            },
            include: [
                {
                    required: true,
                    attributes: {
                        exclude: ['createdAt', 'updatedAt', 'rankByLeague', 'rankBySeries']
                    },
                    where: { seriesId: seriesId },
                    model: userLeagues,
                    include: [
                        {
                            attributes: { exclude: ['createdAt', 'updatedAt'] },
                            model: leagues,
                            include: [
                                {
                                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                                    model: leaguesDetails
                                }
                            ]
                        },
                        {
                            attributes: { exclude: ['createdAt', 'updatedAt'] },
                            model: series
                        }
                    ]
                }
            ],
            order: [[{ model: userLeagues, as: 'userLeague' }, 'rating', 'DESC']]
        });
    },
    async getUserLeagueBySeries(seriesId) {
        return await users.findAndCountAll({
            distinct: true,
            attributes: {
                exclude: ['userType', 'userInfo', 'nonce', 'isVerified', 'isRegister', 'isDeleted', 'createdAt', 'updatedAt']
            },
            include: [
                {
                    required: true,
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                    where: { seriesId: seriesId },
                    model: userLeagues,
                    include: [
                        {
                            attributes: { exclude: ['createdAt', 'updatedAt'] },
                            model: leagues,
                            include: [
                                {
                                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                                    model: leaguesDetails
                                }
                            ]
                        },
                        {
                            attributes: { exclude: ['createdAt', 'updatedAt'] },
                            model: series
                        }
                    ]
                }
            ],
            order: [[{ model: userLeagues, as: 'userLeague' }, 'rankBySeries', 'ASC']]
        });
    },
    async bulkUpdateLeagueData(data) {
        return userLeagues.bulkCreate(data, { updateOnDuplicate: ['id'] });
    },

    async updateUserLeagueSeason(data, leagueId) {
        return userLeagues.update(data, { where: { leagueId: leagueId } });
    },

    async findsingleUserLeagues(userId) {
        return await userLeagues.findAll({
            where: { userId: userId }
        });
    },

    async check_LP_in_league(leagueId, rating) {
        return await leaguesDetails.findOne({ where: { leagueId, min: { [Op.lte]: rating }, max: { [Op.gte]: rating } }, raw: true });
    },

    async get_all_leagues_v2() {
        return await leagues.findAll({
            attributes: ['id', 'name'],
            include: {
                model: leaguesDetails,
                // attributes: ['defaultPoint']
            },
            raw: true
        });
    },

    async destroyUsersRFMDevices(userId, native_app_id) {
        return await userDevices.destroy({ where: { userId, native_app_id } })
    },

    async destroyDeviceByDeviceId(deviceId) {
        return await userDevices.destroy({ where: { deviceId } })
    },

    async findAllUserInLeagues(leagueIds) {
        return await userLeagues.findAll({
            where: { leagueId: { [Op.in]: leagueIds } },
            include: [
                {
                    model: users,
                    required: true, // INNER JOIN to only get users that exist in the users table
                    attributes: [], // Exclude all attributes from the users table
                    where: { isDeleted: false, role: 2 }
                },
            ],
            raw: true
        });
    },

    async getUserByRanks(leagueId, page, pageSize) {
        const offset = (page - 1) * pageSize;
        return await userLeagues.findAndCountAll({
            // attributes: ['name', 'avatar', 'tcgAvatar'],
            // include: [
            //   {
            //     model: userLeagues,
            //     where: { leagueId },
            //     attributes: ['rating', 'rankByLeague'],
            //   },
            // ],
            // order: [
            //   [userLeagues, 'rankByLeague', 'ASC'],
            //   [userLeagues, 'rating', 'DESC'],
            // ],

            where: {
                leagueId: leagueId,
            },
            attributes: ['rating', ['rankByLeague', 'rank'], 'leagueId', 'battles', 'wins', 'loose', 'draw', 'seasonId', 'userId', ['maxStreak', 'winningStreak']],
            include: [
                {
                    model: users,
                    attributes: ['name', 'avatar', 'tcgAvatar'],
                    where: { isDeleted: false }
                },
            ],
            order: [
                ['rating', 'DESC'],
                ['rankByLeague', 'ASC'],
            ],

            offset,
            limit: pageSize,
            raw: true
        })
            .then(data => {
                return {
                    count: data.count,
                    rows: data.rows.map(u => {
                        // u.user = u.user.toJSON();
                        // console.log(u);
                        u.name = u['user.name'];
                        u.avatar = u['user.avatar'];
                        u.tcgAvatar = u['user.tcgAvatar'];

                        delete u['user.name'];
                        delete u['user.avatar'];
                        delete u['user.tcgAvatar'];

                        return u;
                    })
                }
            })
    },

    async getUserUniversalRanks(page, pageSize) {
        const offset = (page - 1) * pageSize;
        return await userLeagues.findAndCountAll({
            attributes: ['rating', ['global_rank', 'rank'], ['rankByLeague', 'leagueRank'], 'leagueId', [db.col('league.name'), 'league'], 'battles', 'wins', 'loose', 'draw', 'seasonId', 'userId', ['maxStreak', 'winningStreak']],
            include: [
                {
                    model: users,
                    attributes: ['name', 'avatar', 'tcgAvatar', ["walletAddress", 'wallet']],
                    where: { isDeleted: false, role: 2 },
                    include: [ // Include avatars through user model
                        {
                            model: Models.rfm_user_avatar,
                            attributes: ['name', 'avatar_index'],
                            required: false // Left outer join
                        }
                    ]
                },
                {
                    model: leagues,
                    attributes: [],
                    // where: { id: { [Sequelize.Op.ne]: 1 } }
                },
            ],
            // order: [
            //   ['leagueId', 'DESC'],
            //   db.literal('CASE WHEN "userLeagues"."rating" = 0 THEN 1 ELSE 0 END'),
            //   db.literal('CASE WHEN "global_rank" = 0 THEN 9999 ELSE "global_rank" END'),
            //   ['rating', 'DESC'],
            //   [db.literal(`"rank"`), "ASC"],
            //   ['rankByLeague', 'ASC'],
            // ],
            order: [
                ['leagueId', 'DESC'],
                db.literal('CASE WHEN "userLeagues"."rating" = 0 THEN 1 ELSE 0 END'),
                db.literal('CASE WHEN "global_rank" = 0 THEN 1 ELSE 0 END'),
                [db.literal('"global_rank" = 0'), 'ASC'],
                ['global_rank', 'ASC'],
                ['rating', 'DESC'],
                ['updatedAt', 'asc'],
                // ['rankByLeague', 'ASC']
            ],

            offset,
            limit: pageSize,
            raw: true
        })
            .then(data => {
                return {
                    count: data.count,
                    rows: data.rows.map((u, index) => {
                        // u.user = u.user.toJSON();
                        // console.log(u);
                        u.name = u['user.name'];
                        u.tcgAvatar = u['user.tcgAvatar'];
                        // u.leagueRank = u.rank;
                        // u.rank = index + 1;
                        // u.rank = u.global_rank;

                        u.avatar = {
                            name: u['user.rfm_user_avatar.name'] || "no name",
                            index: u['user.rfm_user_avatar.avatar_index'] || 0
                        };

                        if (!u.name || /^\s*$/.test(u.name)) {
                            // If u.name is empty or contains only spaces
                            // Assign 5 characters from wallet address, or "NO NAME" if wallet address doesn't exist
                            u.name = u['user.wallet'] ? u['user.wallet'].substring(0, 6) : "NO NAME";
                        }

                        delete u['user.name'];
                        delete u['user.avatar'];
                        delete u['user.wallet'];
                        delete u['user.tcgAvatar'];
                        delete u['user.rfm_user_avatar.id']
                        delete u['user.rfm_user_avatar.name']
                        delete u['user.rfm_user_avatar.avatar_index']

                        return u;
                    })
                }
            })
    },

    async getUserDetailsByWallet(wallet) {
        return await users.findOne({
            attributes: ['id', 'name', 'email', 'avatar', 'tcgAvatar', 'walletAddress', "isHaveMinFuel"],
            where: { walletAddress: wallet, isDeleted: false, isVerified: true },
            include: [
                {
                    model: userLeagues,
                    attributes: ['rating', 'battles', 'maxStreak', 'rankByLeague', 'global_rank'],
                    include: [
                        {
                            model: leagues,
                            attributes: { exclude: ['createdAt', 'updatedAt'] },
                            include: [
                                {
                                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                                    model: leaguesDetails
                                }
                            ]
                        }
                    ],
                },
            ],
            raw: true
        });
    },

    async getRandomQuote() {
        const all_qoutes = await db.models.quotes.findAll({
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            raw: true
        })
        // select any random quote from the fetched list and return
        return all_qoutes[Math.floor(Math.random() * all_qoutes.length)];
    },

    async getRandomTip() {
        const all_qoutes = await db.models.tips.findAll({
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            raw: true
        })
        // select any random quote from the fetched list and return
        return all_qoutes[Math.floor(Math.random() * all_qoutes.length)];
    },

    async getUserDecks(userId) {
        return userDecks.findOne({ where: { userId: userId }, raw: true });
    },

    async getUsersAllDevices(userId, userInfo, app_id) {
        const whereClause = { userId: userId, userInfo: userInfo };
        if (app_id) whereClause.native_app_id = app_id;
        return await userDevices.findAll({ where: whereClause, raw: true });
    },

    // getUserDecks(userId) {
    //   return userDecks.findOne({ where: { userId: userId }, raw: true });
    // },


    async saveDBSyncAPICalls(data) {
        return await Models.xana_xanalia_sync_calls.create(data);
    },

    async deleteUserAccount(userId) {
        let updt = { isDeleted: true, deletedAt: new Date() }
        return await users.update(updt, { where: { id: userId }, returning: true, paranoid: true });
    },


    async bulkUserLeagueDataV2(data) {
        return await userLeagues.bulkUpdate(data);
    },


}