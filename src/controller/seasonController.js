//@ts-check
const svc = require('../services/season.service');
const moment = require('moment');

/**
 * @api {post} /season/add-new-season Add New Game Season
 * @apiName Add New Game Season
 * @apiGroup Game Seasons
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {Number}  seasonId  Unique ID for newly created season. `Mandatory`
 * @apiParam {String}  startTime  startTime of game `Mandatory`.
 * @apiParam {String}  endTime  endTime of game `Mandatory`.
 * @apiParam {String}  [block_time='03:00']  Duration to block gameplay in `HH:mm` format before and after season start/end. `Mandatory`
 * @apiParam {Number}  [default_league=1]  Default Non changing league ID for whole season. `Mandatory`
 * @apiParam {Number}  [default_rating=0]  Default Non changing Rating/LP for whole season. `Mandatory`
 * @apiDescription Game Play Service..
 * @apiSuccessExample Success-Sample-Response:
 *     HTTP/1.1 200 OK
 *      {
 *    "success": true,
 *    "data": {
 *        "id": 1704,
 *        "seasonId": 108,
 *        "startTime": "2023-08-10T05:30:00.000Z",
 *        "endTime": "2023-08-10T08:30:00.000Z",
 *        "default_league": 2,
 *        "default_rating": 200,
 *        "updatedAt": "2023-08-10 11:38:39.140 +00:00",
 *        "createdAt": "2023-08-10 11:38:39.140 +00:00",
 *        "leagueId": null,
 *        "block_time": null
 *    },
 *    "msg": "New game season created successfully"
 *    }
 */
module.exports.addNewGamePlaySeason = async (req, res) => {
  try {
    // leagueId
    const { startTime, endTime, block_time, default_league = 1, default_rating = 0, seasonId } = req.body;
    if (new Date(startTime) < new Date()) throw new Error('Start time should be greater than current time');
    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({ success: true, data: null, msg: 'End time should be greater than start time' });
    }

    let createRes = await svc.createSeason({ seasonId, startTime, endTime, block_time, default_league, default_rating });

    return res.status(200).json({ success: true, data: createRes, msg: 'New game season created successfully' });
  } catch (error) {
    console.info('57 error--game--', error);
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};

/**
 * @api {put} /season/:seasonId Update Game Season Details
 * @apiName Update Game Season Details
 * @apiGroup Game Seasons
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiParam {String}  startTime  startTime of game `Mandatory`.
 * @apiParam {String}  endTime  endTime of game `Mandatory`.
 * @apiParam {String}  [block_time='03:00']  Duration to block gameplay in `HH:mm` format before and after season start/end. `Mandatory`
 * @apiDescription Game Season Service..
 * @apiSuccessExample Success-Sample-Response:
 *     HTTP/1.1 200 OK
 *          {
 *            "success": true,
 *            "data": [1],
 *           "msg": "Game season details updated successfully"
 *          }
 */
module.exports.updateGamePlaySeason = async (req, res) => {
  try {
    const { startTime, endTime, block_time, } = req.body;
    const s = await svc.getSeasonById(req.params.seasonId);
    if (!s) {
      return res.status(400).json({ success: false, data: null, msg: 'Game season not found' });
    }
    if (new Date(startTime) < new Date(endTime)) throw new Error('Start time should be greater than current time');
    const updateRes = await svc.updateSeasons({ startTime, endTime, block_time }, req.params.seasonId);
    return res.status(200).json({ success: true, data: updateRes, msg: 'Game season details updated successfully' });
  } catch (error) {
    console.error(error, '***error when update game play***');
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};


/**
 * @api {delete} /season/:seasonId Delete Game season
 * @apiName Delete Game season Season
 * @apiGroup Game Seasons
 * @apiHeader {String} Authorization Users unique access-key.
 * @apiDescription Game season Service..
 */
module.exports.deleteNewGamePlaySeason = async (req, res) => {
  try {
    let findVersionRes = await svc.getSeasonById(req.params.seasonId);
    if (findVersionRes) {
      // await findVersionRes.destroy();
      //  delete all season based on id
      await svc.deleteSeasonDetails(req.params.seasonId);
      return res.status(200).json({ success: true, data: null, msg: 'Game season deleted successfully' });
    } else {
      return res.status(400).json({ success: false, data: null, msg: 'Game season not found' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};

/**
 * @api {get} /season/latest-season  Get current game Season
 * @apiGroup Game Seasons
 * @apiDescription Game Play Service..
 */
module.exports.getLatestGame = async (req, res) => {
  try {
    let seasonData = await svc.getExistingSeason();
    if (!seasonData) {
      return res.status(200).json({ success: false, data: null, msg: 'There is no season running currently.' });
    }
    // Extract data from the payload
    const { seasonId, startTime, endTime, } = seasonData;

    // Calculate total duration of the season
    const startDate = moment(startTime);
    const endDate = moment(endTime);
    const duration = moment.duration(endDate.diff(startDate));

    // Calculate the current hour/day of the ongoing season
    const currentTimeMoment = moment();
    let currentDayOrHour;
    if (duration.asDays() >= 1) {
      currentDayOrHour = Math.ceil(currentTimeMoment.diff(startDate, 'days', true));
    } else {
      currentDayOrHour = Math.ceil(currentTimeMoment.diff(startDate, 'hours', true));
    }

    // Construct response object
    const formattedSeasonId = seasonId < 10 && seasonId > 0 ? `0${seasonId}` : seasonId;
    let humanizeDuration = duration.humanize() == 'a day' ? '1 day' : duration.humanize()
    humanizeDuration = humanizeDuration == 'a month' ? duration.asDays() + ' days' : humanizeDuration;
    const responseObject = {
      seasonId: seasonId,
      totalDuration: humanizeDuration,
      currentDayOrHour: currentDayOrHour,
      homeScreenTemplate: `season ${formattedSeasonId}  |  ${currentDayOrHour}/${humanizeDuration}`
    };

    return res.status(200).json({ success: true, data: { ...seasonData, ...responseObject }, msg: 'Game season details fetched successfully' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
};

/**
 * @api {get} /season/get-next-season  Get Next game Season
 * @apiGroup Game Seasons
 * @apiDescription Tjis API gives details of next upcoming season
 */
exports.getUpcomingSeason = async (req, res) => {
  try {
    let seasonData = await svc.getNextSeason();
    if (!seasonData) {
      return res.status(200).json({ success: false, data: null, msg: 'There is no next season currently.' });
    }
    // Extract data from the payload
    const { seasonId, startTime, endTime, } = seasonData;

    // Calculate total duration of the season
    const startDate = moment(startTime);
    const endDate = moment(endTime);
    const duration = moment.duration(endDate.diff(startDate));

    // Calculate the current hour/day of the ongoing season
    const currentTimeMoment = moment();
    let currentDayOrHour, timeUnit;
    if (duration.asDays() >= 1) {
      currentDayOrHour = Math.ceil(currentTimeMoment.diff(startDate, 'days', true));
      timeUnit = 'day/s'
    } else {
      currentDayOrHour = Math.ceil(currentTimeMoment.diff(startDate, 'hours', true));
      timeUnit = 'hour/s'
    }

    let timeLeftToStart = '0';
    if (currentDayOrHour < 0) {
      const diff = moment.duration(startDate.diff(currentTimeMoment));
      const days = diff.days();
      const hours = diff.hours();
      const minutes = diff.minutes();

      if (days > 0) {
        timeLeftToStart = `${days} day/s ${hours} hour/s`;
      } else if (hours > 0) {
        timeLeftToStart = `${hours} hour/s ${minutes} minute/s`;
      } else {
        timeLeftToStart = `${minutes} minute/s`;
      }
    }

    // Construct response object
    const formattedSeasonId = seasonId < 10 ? `0${seasonId}` : seasonId;
    const humanizeDuration = duration.humanize() == 'a day' ? '1 day' : duration.humanize()
    const responseObject = {
      seasonId: seasonId,
      totalDuration: humanizeDuration,
      currentDayOrHour: currentDayOrHour > 0 ? currentDayOrHour : 0,
      homeScreenTemplate: `season ${formattedSeasonId}  |  ${currentDayOrHour > 0 ? currentDayOrHour : 0}/${humanizeDuration}`,
      timeLeftToStart: timeLeftToStart
    };

    return res.status(200).json({ success: true, data: { ...seasonData, ...responseObject }, msg: 'Game season details fetched successfully' });


  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
  }
}



// 
//  * @api {get} /season/get-user-season-treasure-boxes/:userId  Get user season treasure boxes
//  * @apiHeader {String} Authorization Users unique access-key.
//  * @apiParam {Number} userId  User ID `Mandatory`. 
//  * @apiGroup Game Seasons
//  * @apiDescription This API gives list of treasure boxes for a user obtained throuhout season.
//  
// exports.getUsersSeasonTreasureBoxes = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const userSeasonTreasureBoxes = await svc.getUserSeasonTreasureBoxes(userId);
//     return res.status(200).json({ success: true, data: userSeasonTreasureBoxes, msg: 'User season rewards treasure boxes fetched successfully' });
//   } catch (error) {
//     console.error('error--', error);
//     return res.status(500).json({ success: false, data: error, msg: 'Internal server error' });
//   }
// }
