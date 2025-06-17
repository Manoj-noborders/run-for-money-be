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
const userAbility = Models.userAbility;
const userOccupiedAssets = Models.userOccupiedAssets;
const userExperience = Models.userExperience;
const userSkills = Models.user_skills;
const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const db = require('../database/database');
const { UserInputError } = require('../utils/classes');
const LBservice = require('../services/leaderboard.service');
const lodash = require('lodash');

module.exports = {

  async getXetaBalanceByUserId(userId) {
    return await userXetaBalance.findOne({ where: { userId } });
  },
  async createUserLeague(data) {
    return await userLeagues.create(data);
  },
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
  async findMaxGlobalRankOverAll() {
    return await userLeagues.findOne({
      attributes: [[Sequelize.fn('max', Sequelize.col('global_rank')), 'maxGlobalRank']],
      raw: true
    });
  },

  async getMultiplayerData(userIds) {
    if (!Array.isArray(userIds) && userIds.length > 0) throw new Error('Invalid user ids, must be an array of user ids');
    return await users.findAll({
      where: { id: userIds },
      include: [
        {
          model: userXetaBalance,
          as: 'userXetaBalances'
        },
        {
          model: userLeagues,
          // attributes: ['leagueId', 'rating', 'battles', 'wins', 'loose', 'draw', 'maxStreak']
        },
      ]
    });
  },

  async getUserAbilityByName(userId, abilityName) {
    return await userAbility.findOne({
      where: { userId, abilityName }
    });
  },

  async getUserAbilityByUserId(userId) {
    return await userAbility.findAll({
      where: { userId }
    });
  },

  async createUserAbility(data) {
    return await userAbility.create(data);
  },

  async updateUserAbility(data, id) {
    return await userAbility.update(data, { where: { id: id }, returning: true });
  },

  async removeUserAbility(userId, abilityName) {
    return await userAbility.destroy({ where: { userId, abilityName } });
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
        if (obj.id) {
          userLeagues.update(obj.data, {
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

  async getUserAllDataByWallet(walletAddress) {
    // return await users.findOne({
    //   where: {
    //     walletAddress: {
    //       [Sequelize.Op.iLike]: walletAddress
    //     },
    //     isDeleted: false
    //   }
    // });

    return await users.findOne({
      // where: { id: userId },
      where: {
        walletAddress: {
          [Sequelize.Op.iLike]: walletAddress
        },
        isDeleted: false
      },
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
                exclude: ['createdAt', 'updatedAt', 'minFuelReq', 'fuelConsuption']
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
          model: userLeaguesHistories
        },
        {
          model: userXetaBalance,
          as: 'userXetaBalances'
        }
      ]
    });
  },

  async getUserProfilePicture(userId) {
    const user = await Models.users.findOne({
      attributes: ['avatar'],
      where: { id: userId },
      raw: true
    });
    return user;
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
                exclude: ['createdAt', 'updatedAt', 'minFuelReq', 'fuelConsuption']
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
          model: userLeaguesHistories
        },
        {
          model: userXetaBalance,
          as: 'userXetaBalances'
        },
        {
          model: userExperience
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
  async getLeagueDeatilsById(leagueId) {
    return await leagues.findOne({
      where: { id: leagueId },
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });
  },
  async getLeagueById(leagueId) {
    return await leagues.findOne({
      where: { id: leagueId },
      // raw: true,
      include: { model: leaguesDetails }
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
          where: { isDeleted: false }
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
      attributes: ['rating', 'global_rank', 'leagueId', 'battles', 'wins', 'loose', 'draw', 'seasonId', 'userId', ['maxStreak', 'winningStreak'], 'updatedAt'],
      include: [
        {
          model: users,
          attributes: ['id', 'name', 'avatar', 'tcgAvatar', ["walletAddress", 'wallet'], ['avatar', 'profileImg'], 'profileIconColor'],
          where: { isDeleted: false, role: 2 },
          include: [ // Include avatars through user model
            {
              model: Models.rfm_user_avatar,
              attributes: ['id', 'user_id', 'name', 'avatar_index'],
              required: false // Left outer join
            }
          ]
        },
        {
          model: leagues,
          attributes: [['name', 'league']],
        },
      ],
      order: [
        // ['leagueId', 'DESC'],
        // db.literal('CASE WHEN "userLeagues"."rating" = 0 THEN 1 ELSE 0 END'),
        // db.literal('CASE WHEN "userLeagues"."rank" = 0 THEN 1 ELSE 0 END'),
        // [db.literal('"userLeagues"."rank" = 0'), 'ASC'],
        // // ['global_rank', 'ASC'],
        // ['rating', 'DESC'],
        // ['updatedAt', 'asc'],

        // ['leagueId', 'DESC'],
        // db.literal('CASE WHEN "userLeagues"."rating" = 0 THEN 1 ELSE 0 END'),
        db.literal('CASE WHEN "userLeagues"."global_rank" = 0 THEN 1 ELSE 0 END'),
        [db.literal('"userLeagues"."global_rank" = 0'), 'ASC'],
        ["global_rank", 'ASC'],
        // ['rating', 'DESC'],
        // ['updatedAt', 'asc'],
      ],
      offset,
      limit: pageSize,
      // order: [['global_rank', 'ASC']],
      raw: true,
      // group: [db.literal('"userLeagues"."rank"')],
    })
      .then(data => {
        return {
          count: data.count,
          rows: data.rows.map((u, index) => {
            u.name = u['user.name'];
            u.tcgAvatar = u['user.tcgAvatar'];
            u.rank = u.global_rank;
            u.league = u['league.league'];
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
            delete u['user.id'];
            delete u['user.avatar'];
            delete u['user.wallet'];
            delete u['user.tcgAvatar'];
            delete u['league.league'];
            delete u['user.rfm_user_avatars.id']
            delete u['user.rfm_user_avatars.user_id']
            delete u['user.rfm_user_avatars.name']
            delete u['user.rfm_user_avatars.avatar_index']

            return u;
          })
        }
      })
  },

  async getUserClothJsonData(id) {
    return userOccupiedAssets.findOne({ where: { id } });
  },

  async getUserClothJsonDataByCreator(createdBy) {
    return userOccupiedAssets.findOne({ where: { createdBy }, order: [['updatedAt', 'DESC']] });
  },

  async getLeagueDetailsById(leagueId) {
    return await leaguesDetails.findOne({ where: { leagueId: leagueId }, raw: true });
  },


  async getUserDetailsByWallet(wallet) {
    return await users.findOne({
      attributes: ['id', 'name', 'email', 'avatar', 'tcgAvatar', 'walletAddress', "isHaveMinFuel"],
      where: { walletAddress: wallet, isDeleted: false, isVerified: true },
      include: [
        {
          model: userLeagues,
          // attributes: ['rating', 'battles', 'maxStreak', 'global_rank'],
          include: [
            {
              model: leagues,
              // attributes: { exclude: ['createdAt', 'updatedAt'] },
              include: [
                {
                  // attributes: { exclude: ['createdAt', 'updatedAt'] },
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

    // delete user's all records from respective tables
    await Models.user_money.destroy({ where: { user_id: userId } });
    await Models.user_battle_reward_logs.destroy({ where: { user_id: userId } });
    await Models.battle_logs.destroy({ where: { user_id: userId } });

    return await users.update(updt, { where: { id: userId }, returning: true, paranoid: true });
  },


  async getHomeScreenDetailsOfUser(userId) {
    const respObj = {
      user: {},
      skills: [],
      stats: {
        ranking: 0, total_gold_earned: 0
      },
      items: {
        item_gacha_level: 0,
        basic_abilitiies: []
      },
      parameter: {
        param_gacha_level: 0,
        // basic abilities here
      }
    }
    // get user details
    const user = await Models.users.findOne({
      attributes: ['id', 'name', 'walletAddress', 'avatar',],
      where: { id: userId }, raw: true
    });
    // console.info(user, 'user');
    // get user money
    const userBalance = await Models.user_money.findOne({ where: { user_id: userId }, raw: true });
    // console.info(userBalance, 'userBalance');

    //* get total earned gold from battle logs
    const totalGoldEarned = await Models.battle_logs.sum('gold_earned', { where: { user_id: userId } });
    console.log(totalGoldEarned, 'totalGoldEarned');
    // get user ranking
    const userRank = await userLeagues.findOne({ where: { userId: userId }, raw: true });
    // console.info(userRank, 'userRank');

    // get user gacha levels
    const usrGachaLevels = await Models.user_gacha_levels.findAll({ where: { user_id: userId, }, raw: true });
    const paramGacha = usrGachaLevels.find(g => g.gacha_id === 1);
    const itemsGacha = usrGachaLevels.find(g => g.gacha_id === 2);
    // console.info(paramGachaLevel, 'paramGachaLevel');

    // get users acquired skills from inventory
    const userSkills = await Models.user_inventory.findAll({
      attributes: ['ability_id', 'level', 'is_equipped',
        [db.Sequelize.col('ability.name'), 'ability_name'],
        [db.Sequelize.col('ability.type'), 'ability_type'],
      ],
      where: { user_id: userId }, raw: true,
      include: [
        {
          model: Models.abilities,
          attributes: [],
        }
      ]
    });
    // console.info(userSkills, 'userSkills');

    // const basicSkillLevels = userSkills.filter(skill => skill.ability_type === 'basic')
    const baseSkillObject = {};
    userSkills.forEach(skill => {
      if (skill.ability_type === 'basic')
        baseSkillObject[skill.ability_name] = skill.level;
    });


    // console.log(baseSkillObject);

    const specialSkills = userSkills.filter(skill => skill.ability_type === 'special' && skill.level > 0) || [];
    const items = userSkills.filter(skill => skill.ability_type === 'basic') || [];

    respObj.skills = specialSkills;
    respObj.user = user;
    respObj.stats.ranking = userRank?.global_rank || 0;
    // respObj.stats.total_gold_earned = totalGoldEarned || 0;
    respObj.stats.total_gold_earned = userBalance?.gold || 0;
    respObj.parameter.param_gacha_level = paramGacha?.level || 0;
    respObj.parameter = { ...respObj.parameter, ...baseSkillObject };
    respObj.items.item_gacha_level = itemsGacha?.level || 0;
    respObj.items.basic_abilitiies = items
    respObj.current_gold = userBalance?.gold || 0;
    return respObj

  },

  async getUserProfilePicture(userId) {
    const user = await Models.users.findOne({
      attributes: ['avatar'],
      where: { id: userId },
      raw: true
    });
    return user;
  },

  async getHomeScreenDetailsOfUserV2(userId) {
    const respObj = {
      user: {},
      // skills: [], insert list here
      stats: {
        ranking: 0, total_gold_earned: 0
      },
      items: {
        item_gacha_level: 0,
        // items_list: [] insert list here
      },
      parameter: {
        param_gacha_level: 0,
        // basic abilities here
      }
    }
    // get user details
    let user = await Models.users.findOne({
      attributes: ['id', 'name', 'walletAddress', 'avatar',],
      where: { id: userId },
      include: [{
        model: Models.rfm_user_avatar,
        attributes: [['avatar_index', 'avatarIndex']],
      }],
      // raw: true
    });

    if (user && user.dataValues && user.dataValues.rfm_user_avatars && user.dataValues.rfm_user_avatars.length > 0) {
      user.dataValues['avatarIndex'] = user.dataValues.rfm_user_avatars[0].dataValues.avatarIndex;
    } else {
      user.dataValues['avatarIndex'] = -1;
    }
    delete user.dataValues.rfm_user_avatars;
    // console.info(user, 'user---1090');
    // get user money
    const userBalance = await Models.user_money.findOne({ where: { user_id: userId }, raw: true });
    // console.info(userBalance, 'userBalance');

    //* get total earned gold from battle logs
    const totalGoldEarned = await Models.battle_logs.sum('gold_earned', { where: { user_id: userId } });
    console.log(totalGoldEarned, 'totalGoldEarned');
    // get user ranking
    let userRank;
    let userBattleCheck = await Models.userLeagues.findOne({ where: { userId, battles: { [Op.gte]: 1 } } })
    if (userBattleCheck) {
      // const userRank = await userLeagues.findOne({ where: { userId: userId }, raw: true });
      userRank = await LBservice.getUserRank(userId, 'weekly');
      console.info(userRank, 'userRank');
    } else {
      userRank = 0;
      console.info(userRank, 'userRank');
    }

    // get user gacha levels
    const usrGachaLevels = await Models.user_gacha_levels.findAll({ where: { user_id: userId, }, raw: true });
    const paramGacha = usrGachaLevels.find(g => g.gacha_id === 1);
    const itemsGacha = usrGachaLevels.find(g => g.gacha_id === 2);
    // console.info(paramGacha, '---paramGachaLevel---1133');

    // get users acquired skills from inventory
    const userSkills = await Models.user_inventory.findAll({
      attributes: ['id', 'ability_id',
        [db.Sequelize.col('ability.name'), 'name'],
        [db.Sequelize.col('ability.type'), 'type'],
        'level',
        'is_equipped',
        'acquired_at',
        'ability_type',
        [db.Sequelize.col('ability.description'), 'description'],
        [db.Sequelize.col('ability.effect_value'), 'effect_value'],
        [db.Sequelize.col('ability.min'), 'min'],
        [db.Sequelize.col('ability.max'), 'max'],
      ],
      where: { user_id: userId },
      include: [{
        model: Models.abilities,
        attributes: [],
      }],
      raw: true,
    });
    // console.info(userSkills, 'userSkills');

    // const basicSkillLevels = userSkills.filter(skill => skill.ability_type === 'basic')
    const baseSkillObject = {};
    const specialSkills = [];
    const items = [];
    const basicAbilities = [];

    for (const skill of userSkills) {
      if (skill.type === 'basic' && skill.ability_type === paramGacha.gacha_id) {
        baseSkillObject[skill.name] = skill.level;

        basicAbilities.push({
          name: skill.name,
          // level: skill.level,
          min: skill.min,
          max: skill.max,
        })

      } else if (skill.type === 'special' && skill.level > 0) {
        skill.ability_id = skill.id;
        delete skill.id;
        specialSkills.push(skill);
      } else if (skill.ability_type === itemsGacha.gacha_id) {
        delete skill.ability_type;
        skill.ability_id = skill.id;
        delete skill.id;
        items.push(skill);
      }
    }

    // let leagueInfo = await leaguesDetails.findOne({ where: { leagueId: 1 }, raw: true });
    // const participationFee = leagueInfo.fuelConsumption;
    const participationFee = 0;     // participation_fee set to 0

    respObj.user = user;
    respObj.stats.ranking = userRank || 0;
    respObj.stats.total_gold_earned = totalGoldEarned || 0;
    respObj.current_gold = userBalance?.gold || 0;
    respObj.parameter.param_gacha_level = paramGacha?.level || 0;
    respObj.parameter = { ...respObj.parameter, ...baseSkillObject };
    respObj.items.item_gacha_level = itemsGacha?.level || 0;
    respObj.items.items_list = items;
    respObj.skills = specialSkills;
    respObj.basic_abilitiies = basicAbilities;
    respObj.participation_fee = participationFee;

    return respObj

  },


  async getHomeScreenDetailsOfUserV3(userId) {
    const respObj = {
      user: {},
      // skills: [], insert list here
      stats: {
        ranking: 0, total_gold_earned: 0
      },
      items: {
        item_gacha_level: 0,
        // items_list: [] insert list here
      },
      parameter: {
        param_gacha_level: 0,
        // basic abilities here
      },
      captureDelay: 1
    }
    // get user details
    let user = await Models.users.findOne({
      attributes: ['id', 'name', 'walletAddress', 'avatar',],
      where: { id: userId },
      include: [{
        model: Models.rfm_user_avatar,
        attributes: [['avatar_index', 'avatarIndex']],
      }],
      // raw: true
    });

    if (user && user.dataValues && user.dataValues.rfm_user_avatars && user.dataValues.rfm_user_avatars.length > 0) {
      user.dataValues['avatarIndex'] = user.dataValues.rfm_user_avatars[0].dataValues.avatarIndex;
    } else {
      user.dataValues['avatarIndex'] = -1;
    }
    delete user.dataValues.rfm_user_avatars;
    // console.info(user, 'user---1090');
    // get user money
    const userBalance = await Models.user_money.findOne({ where: { user_id: userId }, raw: true });
    // console.info(userBalance, 'userBalance');

    //* get total earned gold from battle logs
    const totalGoldEarned = await Models.battle_logs.sum('gold_earned', { where: { user_id: userId } });
    console.log(totalGoldEarned, 'totalGoldEarned');
    // get user ranking
    let userRank;
    let userBattleCheck = await Models.userLeagues.findOne({ where: { userId, battles: { [Op.gte]: 1 } } })
    if (userBattleCheck) {
      // const userRank = await userLeagues.findOne({ where: { userId: userId }, raw: true });
      userRank = await LBservice.getUserRank(userId, 'weekly');
      console.info(userRank, 'userRank');
    } else {
      userRank = 0;
      console.info(userRank, 'userRank');
    }

    // get user gacha levels
    const usrGachaLevels = await Models.user_gacha_levels.findAll({ where: { user_id: userId, }, raw: true });
    const paramGacha = usrGachaLevels.find(g => g.gacha_id === 1);
    const itemsGacha = usrGachaLevels.find(g => g.gacha_id === 2);
    // console.info(paramGacha, '---paramGachaLevel---1133');

    // get users acquired skills from inventory
    const userSkills = await Models.user_inventory.findAll({
      attributes: ['id', 'ability_id',
        [db.Sequelize.col('ability.name'), 'name'],
        [db.Sequelize.col('ability.type'), 'type'],
        'level',
        'is_equipped',
        'acquired_at',
        'ability_type',
        [db.Sequelize.col('ability.description'), 'description'],
        [db.Sequelize.col('ability.effect_value'), 'effect_value'],
        [db.Sequelize.col('ability.min'), 'min'],
        [db.Sequelize.col('ability.max'), 'max'],
      ],
      where: { user_id: userId },
      include: [{
        model: Models.abilities,
        attributes: [],
      }],
      raw: true,
    });
    // console.info(userSkills, 'userSkills');

    // const basicSkillLevels = userSkills.filter(skill => skill.ability_type === 'basic')
    const baseSkillObject = {};
    const specialSkills = [];
    const items = [];
    const basicAbilities = [];

    for (const skill of userSkills) {
      if (skill.type === 'basic' && skill.ability_type === paramGacha.gacha_id) {
        baseSkillObject[skill.name] = skill.level;

        basicAbilities.push({
          name: skill.name,
          // level: skill.level,
          min: skill.min,
          max: skill.max,
        })

      } else if (skill.type === 'special' && skill.level > 0) {
        skill.ability_id = skill.id;
        delete skill.id;
        specialSkills.push(skill);
      } else if (skill.ability_type === itemsGacha.gacha_id) {
        delete skill.ability_type;
        skill.ability_id = skill.id;
        delete skill.id;
        items.push(skill);
      }
    }

    // let leagueInfo = await leaguesDetails.findOne({ where: { leagueId: 1 }, raw: true });
    // const participationFee = leagueInfo.fuelConsumption;
    const participationFee = 0;     // participation_fee set to 0

    console.info(baseSkillObject, '---baseSkillObject---1191');
    console.info(respObj.parameter, '---respObj.parameter---1192');
    console.info(items, '---items---1193');

    items.map(item => {
      if (item.is_equipped) {
        console.info(item, baseSkillObject[item.name], '---item---1329');
        baseSkillObject[item.name] = baseSkillObject[item.name] + item.level;
      }
    })

    respObj.user = user;
    respObj.stats.ranking = userRank || 0;
    respObj.stats.total_gold_earned = totalGoldEarned || 0;
    respObj.current_gold = userBalance?.gold || 0;
    respObj.parameter.param_gacha_level = paramGacha?.level || 0;
    respObj.parameter = { ...respObj.parameter, ...baseSkillObject };
    respObj.items.item_gacha_level = itemsGacha?.level || 0;
    respObj.items.items_list = items;
    respObj.skills = specialSkills;
    respObj.basic_abilitiies = basicAbilities;
    respObj.participation_fee = participationFee;

    return respObj

  },


  async getAiClothAssetJsonData(id) {
    const dummyJson = [
      {
        "id": "136064",
        "name": "Test",
        "thumbnail": "https://cdn.xana.net/xanaprod/Defaults/1680177561873_file.png",
        "gender": "Female",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 12541,
            "ItemName": "Girl_Pant_V001",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1417,
            "ItemName": "Girl_Shirt_V001",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1225,
            "ItemName": "Girl_H_010",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1145,
            "ItemName": "Shoes_478",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "FeMale 1",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136065",
        "name": "Test",
        "thumbnail": "https://cdn.xana.net/xanaprod/Defaults/1680100976117_file.png",
        "gender": "Male",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 913,
            "ItemName": "Boy_Pant_V002",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1415,
            "ItemName": "Boy_Shirt_V002",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1215,
            "ItemName": "Boy_H_014",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1078,
            "ItemName": "Shoes_381",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Male 2",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136066",
        "name": "Test",
        "thumbnail": "https://cdn.xana.net/xanaprod/Defaults/1680100976117_file.png",
        "gender": "Female",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 913,
            "ItemName": "Girl_Pant_V009",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1415,
            "ItemName": "Girl_Shirt_V009",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1215,
            "ItemName": "Girl_H_020",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1078,
            "ItemName": "Shoes_478",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Female 2",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136067",
        "name": "Test",
        "thumbnail": "https://cdn.xana.net/xanaprod/Defaults/1680176897662_file.png",
        "gender": "Male",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1277,
            "ItemName": "Boy_Pant_V003",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1295,
            "ItemName": "Boy_Shirt_V003",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1231,
            "ItemName": "Boy_H_028",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1085,
            "ItemName": "Shoes_378",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Male 3",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136068",
        "name": "Test",
        "thumbnail": "https://cdn.xana.net/xanaprod/Defaults/1680176897662_file.png",
        "gender": "Female",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1277,
            "ItemName": "Girl_Pant_V008",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1295,
            "ItemName": "Girl_Shirt_V008",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1231,
            "ItemName": "Girl_H_022",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1085,
            "ItemName": "Shoes_478",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Female 3",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136069",
        "name": "Test",
        "thumbnail": "https://cdn.xana.net/xanaprod/Defaults/1680177258349_file.png",
        "gender": "Male",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1274,
            "ItemName": "Boy_Pant_V005",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1312,
            "ItemName": "Boy_Shirt_V005",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1527,
            "ItemName": "Boy_H_029",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1185,
            "ItemName": "Shoes_332",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Male 4",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136070",
        "name": "Test",
        "thumbnail": "https://cdn.xana.net/xanaprod/Defaults/1680177258349_file.png",
        "gender": "Female",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1274,
            "ItemName": "Girl_Pant_V007",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1312,
            "ItemName": "Girl_Shirt_V007",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1527,
            "ItemName": "Girl_H_029",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1185,
            "ItemName": "Shoes_478",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Female 4",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136071",
        "name": "Test",
        "thumbnail": "",
        "gender": "Male",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1369,
            "ItemName": "Boy_Pant_V004",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1388,
            "ItemName": "Boy_Shirt_V004",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1530,
            "ItemName": "Boy_H_029",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1085,
            "ItemName": "Shoes_068",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Glove",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chain",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Male 5",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136072",
        "name": "Test",
        "thumbnail": "",
        "gender": "Female",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1369,
            "ItemName": "Girl_Pant_V006",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1388,
            "ItemName": "Girl_Shirt_V006",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1530,
            "ItemName": "Girl_H_025",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1085,
            "ItemName": "Shoes_478",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Glove",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chain",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Female 5",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136073",
        "name": "Test",
        "thumbnail": "",
        "gender": "Male",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1363,
            "ItemName": "Boy_Pant_V006",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1373,
            "ItemName": "Boy_Shirt_V006",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1201,
            "ItemName": "Boy_H_023",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1149,
            "ItemName": "Shoes_325",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Glove",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chain",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Male 6",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136074",
        "name": "Test",
        "thumbnail": "",
        "gender": "Female",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1363,
            "ItemName": "Girl_Pant_V003",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1373,
            "ItemName": "Girl_Shirt_V003",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1201,
            "ItemName": "Girl_H_011",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1149,
            "ItemName": "Shoes_478",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Glove",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chain",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Female 6",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136075",
        "name": "Test",
        "thumbnail": "",
        "gender": "Male",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 902,
            "ItemName": "Boy_Pant_V007",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1390,
            "ItemName": "Boy_Shirt_V007",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1195,
            "ItemName": "Boy_H_022",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1186,
            "ItemName": "Shoes_366",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Glove",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chain",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Male 7",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136076",
        "name": "Test",
        "thumbnail": "",
        "gender": "Female",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 902,
            "ItemName": "Girl_Pant_V002",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1390,
            "ItemName": "Girl_Shirt_V002",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1195,
            "ItemName": "Girl_H_015",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1186,
            "ItemName": "Shoes_478",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Glove",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chain",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Female 7",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136077",
        "name": "Test",
        "thumbnail": "",
        "gender": "Male",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 902,
            "ItemName": "Boy_Pant_V009",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1390,
            "ItemName": "Boy_Shirt_V009",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1195,
            "ItemName": "Boy_H_003",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1186,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Glove",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chain",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Male 8",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136078",
        "name": "Test",
        "thumbnail": "",
        "gender": "Female",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 902,
            "ItemName": "Girl_Pant_V003_1",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1390,
            "ItemName": "Girl_Shirt_V003_1",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1195,
            "ItemName": "Girl_H_022",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1186,
            "ItemName": "Shoes_478",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Glove",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chain",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Female 8",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136079",
        "name": "Test",
        "thumbnail": "",
        "gender": "Male",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 902,
            "ItemName": "Boy_Pant_V011",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1390,
            "ItemName": "Boy_Shirt_V011",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1195,
            "ItemName": "Boy_H_006",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1186,
            "ItemName": "Shoes_090",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Glove",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chain",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Male 9",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136080",
        "name": "Test",
        "thumbnail": "",
        "gender": "Female",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 902,
            "ItemName": "Girl_Pant_V008_1",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1390,
            "ItemName": "Girl_Shirt_004",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1195,
            "ItemName": "Girl_H_004",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1186,
            "ItemName": "Shoes_475",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Glove",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chain",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Female 9",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136081",
        "name": "Test",
        "thumbnail": "",
        "gender": "Male",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 902,
            "ItemName": "Boy_Pant_V012",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1390,
            "ItemName": "Boy_Shirt_V012",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1195,
            "ItemName": "Boy_H_025",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1186,
            "ItemName": "Shoes_387",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Glove",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chain",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Male 10",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      },

      {
        "id": "136082",
        "name": "Test",
        "thumbnail": "",
        "gender": "Female",
        "myItemObj": [
          {
            "Slug": "",
            "ItemType": "Legs",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 902,
            "ItemName": "Girl_Pant_V002_1",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chest",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1390,
            "ItemName": "Girl_Shirt_V008_1",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Hair",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1195,
            "ItemName": "Girl_H_006",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Feet",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 1186,
            "ItemName": "Shoes_478",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Glove",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          },
          {
            "Slug": "",
            "ItemType": "Chain",
            "ItemPrefab": { "instanceID": 0 },
            "ItemID": 0,
            "ItemName": "",
            "ItemDescription": "",
            "ItemLinkAndroid": "",
            "ItemLinkIOS": "",
            "SubCategoryname": "",
            "Stackable": false,
            "ItemIcon": { "instanceID": 0 }
          }
        ],
        "avatarType": "NewAvatar",
        "ai_gender": "",
        "hair_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "skin_color": "",
        "lip_color": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "face_gender": "",
        "faceItemData": 0,
        "lipItemData": 0,
        "noseItemData": 0,
        "hairItemData": "",
        "eyeItemData": "",
        "eyeShapeItemData": 0,
        "charactertypeAi": false,
        "SavedBones": [],
        "SkinId": 0,
        "Skin": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "LipColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "SssIntensity": 0.0,
        "SkinGerdientColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "isSkinColorChanged": false,
        "isLipColorChanged": false,
        "HairColorPaletteValue": 0,
        "BodyFat": 0,
        "FaceValue": 0,
        "NoseValue": 0,
        "EyeValue": 0,
        "EyesColorValue": 0,
        "EyesColorPaletteValue": 0,
        "EyeBrowValue": 0,
        "EyeBrowColorPaletteValue": 0,
        "EyeLashesValue": 0,
        "MakeupValue": 0,
        "LipsValue": 0,
        "LipsColorValue": 0,
        "LipsColorPaletteValue": 0,
        "faceMorphed": false,
        "eyeBrowMorphed": false,
        "eyeMorphed": false,
        "noseMorphed": false,
        "lipMorphed": false,
        "PresetValue": "Female 10",
        "eyeTextureName": "",
        "eyeLashesName": "",
        "eyebrrowTexture": "",
        "makeupName": "",
        "FaceBlendsShapes": [],
        "HairColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyebrowColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 },
        "EyeColor": { "r": 0.0, "g": 0.0, "b": 0.0, "a": 0.0 }
      }
    ];

    // return any random object from the array
    const randomObject = dummyJson.find((item) => item.id == id);

    const resultObj = {
      //@ts-ignore
      id: randomObject.id, name: randomObject.name, thumbnail: randomObject.thumbnail,
      json: randomObject,
      description: 'descrippption',
    };

    return resultObj;
  }



}