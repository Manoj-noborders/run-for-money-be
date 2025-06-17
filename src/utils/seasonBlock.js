const moment = require('moment');
const gamePlayService = require('../services/gamePlay.service');
// const blockSeasonBattleTime=Number(process.env.BLOCK_BATTLE_SEASON_TIME)
// const blockSeasonBattleTime= 5 // days

module.exports = {
  async getBlockSeasonTime() {
    let seasonBlockTime = false;
    const result=await gamePlayService.getSeason();
    // 2 hrs block when season end
    let blockStartTime = moment.utc(result.endTime)
    let blockEndTime = moment.utc(result.endTime).add('h', 3)
    let currentTime = moment.utc();
    console.log( 'blockStartTime:', blockStartTime,'currentTime: ',currentTime,'blockEndTime:',blockEndTime);
    const checkIsExist =moment(currentTime).isBetween(blockStartTime, blockEndTime);
    if (checkIsExist) {
      seasonBlockTime = true;
    }
    return seasonBlockTime;
  }
};
