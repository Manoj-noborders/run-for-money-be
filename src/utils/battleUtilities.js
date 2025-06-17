const battleService = require('../services/battle.service');
const userService = require('../services/users.service');

class BattleUtils {
  async createNewObj(newLeagueId, rating, battles, wins, maxStreak, rewards, loose, draw, userId = null) {
    let updateData = {
      leagueId: newLeagueId,
      rating: rating,
      battles: battles,
      wins: wins,
      maxStreak: maxStreak,
      rewards: rewards,
      loose: loose,
      draw: draw
    };
    if (userId) updateData['userId'] = userId;
    return updateData;
  }

  async updateFields(newObj, timestamp, userNameRes, userId = null, getUserLeagueRes) {
    newObj['date'] = timestamp;
    newObj['name'] = userNameRes.name;
    newObj['rankByLeague'] = getUserLeagueRes.rankByLeague;
    newObj['rankBySeries'] = getUserLeagueRes.rankBySeries;
    if (userId) newObj['userId'] = userId;
    return newObj;
  }

  async filterUniqueArray(leagueArray, seriesArray) {
    let uniqueLeagueArray = leagueArray.filter((c, index) => {
      return leagueArray.indexOf(c) === index;
    });
    let uniqueSeriesArray = seriesArray.filter((c, index) => {
      return seriesArray.indexOf(c) === index;
    });
    return { uniqueLeagueArray, uniqueSeriesArray };
  }

  async updateUserRanks(leagueArray, seriesArray) {
    return new Promise(async (resolve, reject) => {
      try {
        let allUsersLeagueRes = await userService.findAllUserLeagues();
        let dataToUpdate = [];
        for (const leagueId of leagueArray) {
          let usersByLeagueId = allUsersLeagueRes.filter((x) => x.leagueId == leagueId);
          if (usersByLeagueId && usersByLeagueId.length > 0) {
            usersByLeagueId.forEach((element) => {
              element.winPercentage = element.wins / (element.wins + element.loose);
              if (Number.isNaN(element.winPercentage)) {
                element.winPercentage = 0;
              }
            });
            usersByLeagueId = await this.sortUserLeagueArray(usersByLeagueId);
            for (let i = 0; i < usersByLeagueId.length; i++) {
              let element = usersByLeagueId[i];
              let obj = {
                id: element.id,
                data: {
                  rankByLeague: i + 1
                }
              };
              if (dataToUpdate.length == 0) {
                dataToUpdate.push(obj);
              } else {
                let index = dataToUpdate.findIndex((x) => x.id == element.id);
                if (index == -1) {
                  dataToUpdate.push(obj);
                } else {
                  dataToUpdate[index].data['rankByLeague'] = i + 1;
                }
              }
            }
          }
        }
        for (const seriesId of seriesArray) {
          let usersBySeriesId = allUsersLeagueRes.filter((x) => x.seriesId == seriesId);
          if (usersBySeriesId && usersBySeriesId.length > 0) {
            usersBySeriesId.forEach((element) => {
              element.winPercentage = element.wins / (element.wins + element.loose);
              if (Number.isNaN(element.winPercentage)) {
                element.winPercentage = 0;
              }
            });
            usersBySeriesId = await this.sortUserLeagueArray(usersBySeriesId);
            for (let i = 0; i < usersBySeriesId.length; i++) {
              let element = usersBySeriesId[i];
              let obj = {
                id: element.id,
                data: {
                  rankBySeries: i + 1
                }
              };
              if (dataToUpdate.length == 0) {
                dataToUpdate.push(obj);
              } else {
                let index = dataToUpdate.findIndex((x) => x.id == element.id);
                if (index == -1) {
                  dataToUpdate.push(obj);
                } else {
                  dataToUpdate[index].data['rankBySeries'] = i + 1;
                }
              }
            }
          }
        }
        if (dataToUpdate && dataToUpdate.length > 0) {
          const updateLeague = await userService.bulkUserLeagueData(dataToUpdate);
          // console.log(dataToUpdate);
          // const updateLeague = await userService.bulkUpdateLeagueData(dataToUpdate);
          resolve(updateLeague);
        } else resolve();
      } catch (error) {
        console.error('error in update User Ranks', error);
        reject(error);
      }
    });
  }

  async sortUserLeagueArray(userLeagueArray) {
    return userLeagueArray.sort((a, b) => {
      if (a.leagueId < b.leagueId) return 1;
      if (a.leagueId > b.leagueId) return -1;
      if (a.rating > b.rating) return -1;
      if (a.rating < b.rating) return 1;
      if (a.rating == b.rating && a.rating !== 0 && b.rating !== 0) {
        if (a.winPercentage > b.winPercentage) return -1;
        if (a.winPercentage < b.winPercentage) return 1;
        if (a.winPercentage == b.winPercentage) {
          if (new Date(a.updatedAt).getTime() > new Date(b.updatedAt).getTime()) return 1;
          if (new Date(a.updatedAt).getTime() < new Date(b.updatedAt).getTime()) return -1;
        }
      } else {
        if (a.winPercentage > b.winPercentage) return -1;
        if (a.winPercentage < b.winPercentage) return 1;
        if (a.winPercentage == b.winPercentage) {
          if (a.winPercentage !== 0 && b.winPercentage !== 0) {
            if (new Date(a.updatedAt).getTime() > new Date(b.updatedAt).getTime()) return 1;
            if (new Date(a.updatedAt).getTime() < new Date(b.updatedAt).getTime()) return -1;
          } else if (a.winPercentage == 0 && b.winPercentage == 0) {
            if (a.battles > b.battles) return -1;
            if (a.battles < b.battles) return 1;
            if (a.battles == b.battles) {
              if (new Date(a.updatedAt).getTime() > new Date(b.updatedAt).getTime()) return 1;
              if (new Date(a.updatedAt).getTime() < new Date(b.updatedAt).getTime()) return -1;
            }
          }
        }
      }
    });
  }

  async updateUserRanks_v2(leagueArray, seriesArray) {
    try {
      const allUsersLeagueRes = await userService.findAllUserInLeagues(leagueArray);
      // console.log(allUsersLeagueRes)
      const dataToUpdate = [];

      for (const leagueId of leagueArray) {
        let usersByLeagueId = allUsersLeagueRes.filter((x) => x.leagueId == leagueId);
        if (usersByLeagueId && usersByLeagueId.length > 0) {
          usersByLeagueId.forEach((element) => {
            // element.winPercentage = element.wins / (element.wins + element.loose);
            element.winPercentage = element.battles !== 0 ? (element.wins / element.battles) * 100 : 0;
            if (Number.isNaN(element.winPercentage)) {
              element.winPercentage = 0;
            }
          });
          usersByLeagueId = await this.sortUserLeagueArray(usersByLeagueId);
          this.payloadDataOfUserLeague_v2(dataToUpdate, usersByLeagueId, 'rankByLeague');
        }
      }

      //*** since we are not using series in any client app, to reduce the overhead im removing this extra code to shorten DB transactions   __grey */

      // for (const seriesId of seriesArray) {
      //   let usersBySeriesId = allUsersLeagueRes.filter((x) => x.seriesId == seriesId);
      //   if (usersBySeriesId && usersBySeriesId.length > 0) {
      //     usersBySeriesId.forEach((element) => {
      //       element.winPercentage = element.wins / (element.wins + element.loose);
      //       if (Number.isNaN(element.winPercentage)) {
      //         element.winPercentage = 0;
      //       }
      //     });
      //     usersBySeriesId = await this.sortUserLeagueArray_v2(usersBySeriesId);
      //     await this.payloadDataOfUserLeague(dataToUpdate, usersBySeriesId, 'rankBySeries');
      //   }
      // }

      if (dataToUpdate && dataToUpdate.length > 0) {
        // console.log(dataToUpdate)
        // const updateLeague = await userService.bulkUserLeagueData(dataToUpdate);
        const updateLeague = await battleService.bulkUserLeagueData(dataToUpdate);
        return updateLeague;
      }
    } catch (error) {
      console.error('Error in updateUserRanks', error);
      throw error;
    }
  }

  payloadDataOfUserLeague(dataToUpdate, users, rankType) {
    for (let i = 0; i < users.length; i++) {
      let element = users[i];
      let obj = {
        id: element.id,
        data: {
          [rankType]: i + 1
        }
      };
      if (dataToUpdate.length == 0) {
        dataToUpdate.push(obj);
      } else {
        let index = dataToUpdate.findIndex((x) => x.id == element.id);
        if (index == -1) {
          dataToUpdate.push(obj);
        } else {
          dataToUpdate[index].data[rankType] = i + 1;
        }
      }
    }
  }


  processMultipleUsersBattlePostWork = async (userDataArray, duel_id) => {
    try {
      const timestamp = new Date();
      const leagueArray = [];
      const seriesArray = [];

      // Loop through user data array
      for (const userData of userDataArray) {
        const { leagueObj, leagueDetailsObj, seriesId } = userData;
        leagueArray.push(leagueObj.leagueId, leagueDetailsObj.leagueId);
        seriesArray.push(leagueObj.seriesId, seriesId);

      }

      // Use your existing filter and update functions
      const filterArray = await battle_utils.filterUniqueArray_v2(leagueArray, seriesArray);
      await battle_utils.updateUserRanks_v2(filterArray.uniqueLeagueArray, filterArray.uniqueSeriesArray);

      for (const userData of userDataArray) {
        const { userId, userNameRes, leaguePayload, battle_result } = userData;

        // this fetching can be removed for optimization but for now keeping it as it is
        let getUserLeagueRes = await userService.findUserLeague(userId);
        // const returnObj = await battle_utils.updateFields(leaguePayload, timestamp, userNameRes, userId, getUserLeagueRes);
        getUserLeagueRes = getUserLeagueRes.toJSON()
        delete getUserLeagueRes.id
        const returnObj = { ...getUserLeagueRes, date: timestamp, name: userNameRes.name, battle_status: battle_result, duel_id }
        await battleService.addLeagueHistory(returnObj);
      }
    } catch (error) {
      throw error;
    }
  };

  async filterUniqueArray_v2(leagueArray, seriesArray) {
    let uniqueLeagueArray = [... new Set(leagueArray)]
    let uniqueSeriesArray = [... new Set(seriesArray)]
    return { uniqueLeagueArray, uniqueSeriesArray };
  }

  async sortUserLeagueArray_v2(userLeagueArray) {
    return userLeagueArray.sort((a, b) => {
      // Sort primarily based on leagueId, higher first
      if (a.leagueId > b.leagueId) return -1;
      if (a.leagueId < b.leagueId) return 1;

      // If leagueIds are equal, sort by rating, higher first
      if (a.rating > b.rating) return -1;
      if (a.rating < b.rating) return 1;

      // If winPercentage is less than or equal to 0, sort by number of battles, higher first
      if (a.winPercentage <= 0 && b.winPercentage <= 0) {
        if (a.battles > b.battles) return -1;
        if (a.battles < b.battles) return 1;
        if (a.battles == b.battles) {
          if (new Date(a.updatedAt).getTime() > new Date(b.updatedAt).getTime()) return 1;
          if (new Date(a.updatedAt).getTime() < new Date(b.updatedAt).getTime()) return -1;
        }
      }
      // If leagueIds and ratings are similar, sort by winPercentage, higher first
      if (a.winPercentage > b.winPercentage) return -1;
      if (a.winPercentage < b.winPercentage) return 1;

      // If leagueIds, ratings, and winPercentages are equal, sort by updatedAt, oldest first
      const aUpdatedAt = new Date(a.updatedAt).getTime();
      const bUpdatedAt = new Date(b.updatedAt).getTime();
      if (aUpdatedAt < bUpdatedAt) return -1;
      if (aUpdatedAt > bUpdatedAt) return 1;

      // If all properties are equal, return 0 (no change in ordering)
      return 0;
    });
  }

  async calculatePlayersStreakMagnification({ p1_battle_result, p2_battle_result, p1_leagueId, p2_leagueId, p1_rating, p2_rating, p1_maxStreak, p2_maxStreak }) {
    const getWinStreakMagnification = await battleService.getWinStreakMagnification();
    const magnificationArray = getWinStreakMagnification.map((wm, index) => wm.magnification);
    if (p1_battle_result === 'WIN' && p1_leagueId > 1) {
      p1_maxStreak += 1;
      const streak_win_bonus = battle_utils.evalWinStreakBonus(p1_maxStreak, p1_rating, magnificationArray);
      let streak_stop_bonus = 0
      if (p2_maxStreak > 0) {
        streak_stop_bonus = battle_utils.evalWinStreakBonus(p2_maxStreak, p2_rating, magnificationArray);
        p2_maxStreak = 0;
      };
      p1_rating = p1_rating + streak_win_bonus + streak_stop_bonus;
    }
    if (p2_battle_result === 'WIN' && p2_leagueId > 1) {
      p2_maxStreak += 1;
      const streak_win_bonus = battle_utils.evalWinStreakBonus(p2_maxStreak, p2_rating, magnificationArray);
      let streak_stop_bonus = 0;
      if (p1_maxStreak > 0) {
        streak_stop_bonus = battle_utils.evalWinStreakBonus(p1_maxStreak, p2_rating, magnificationArray);
        p1_maxStreak = 0;
      }

      p2_rating = p2_rating + streak_win_bonus + streak_stop_bonus;
    }

    return { p1_new_rating: Math.round(p1_rating), p2_new_rating: Math.round(p2_rating), p1_new_streak: p1_maxStreak, p2_new_streak: p2_maxStreak };
  }

  async calculateLPandStreakBonus(p1_battle_data, p2_battle_data) {
    p1_battle_data.battles += 1;
    p2_battle_data.battles += 1;

    if (p1_battle_data.battle_result === 'DRAW' && p2_battle_data.battle_result === 'DRAW') {
      p1_battle_data.draw += 1;
      p2_battle_data.draw += 1;
      return { p1_battle_data, p2_battle_data };
    }

    if (p1_battle_data.battle_result === 'WIN' || p2_battle_data.battle_result === 'WIN') {
      const [winner_data, loser_data] = p1_battle_data.battle_result === 'WIN' ? [p1_battle_data, p2_battle_data] : [p2_battle_data, p1_battle_data];
      const bonus = await this.calculateWinStreakBonus(winner_data, loser_data);
      // increase win count for winner
      winner_data.wins += 1;
      //* calc rating for winner
      let winner_new_lp = winner_data.rating + loser_data.leaguePoint + bonus;
      //** if winner new LP exceeds current league max LP, set it to next league's min LP
      const newLeague = await battleService.getLeagueDetailByRating(winner_new_lp);
      if (newLeague.id > winner_data.leagueId) {
        winner_data.rating = newLeague.min;
      } else {
        //* else just give the new LP with streak bonus
        winner_data.rating += loser_data.leaguePoint + bonus;
      }

      //* calc LP for loser, if League is Trial ie 1, then reduce 10 LP else reduce league point
      let loser_new_lp = loser_data.rating - (loser_data.leagueId === 1 ? 10 : loser_data.leaguePoint);
      //* if loser new LP is less than 0, set it to 0
      if (loser_data.rating < loser_data.leagueMinLP) {
        loser_data.rating = Math.max(loser_new_lp, 0);
      } else {
        //* if new LP goes below League's min LP, set it to min LP else just give the new LP
        loser_data.rating = loser_new_lp < loser_data.leagueMinLP ? loser_data.leagueMinLP : loser_new_lp;
      }
      //* increase loose count for loser
      loser_data.loose += 1;
    }

    return { p1_battle_data, p2_battle_data };
  }

  evalWinStreakBonus(streak_count, points, magnificationTable) {
    const magnification = magnificationTable[Math.min(streak_count - 1, magnificationTable.length - 1)];
    return points * magnification;
  }

  async calculateWinStreakBonus(winner_data, loser_data) {
    if (winner_data.battle_result === 'WIN' && winner_data.leagueId > 1) {
      winner_data.maxStreak += 1;
      const magnificationArray = (await battleService.getWinStreakMagnification()).map(ws => ws.magnification);
      const streak_win_bonus = this.evalWinStreakBonus(winner_data.maxStreak, loser_data.leaguePoint, magnificationArray);

      let streak_stop_bonus = 0;
      if (loser_data.maxStreak > 0) {
        streak_stop_bonus = this.evalWinStreakBonus(loser_data.maxStreak, loser_data.leaguePoint, magnificationArray);
        loser_data.maxStreak = 0;
      }

      return Math.floor(streak_win_bonus + streak_stop_bonus);
    }
    return 0;
  }

  async calculatePointsToNextLeague(userLeagueMaxLP, userLP, usrLeagueId) {
    const leagues = await battleService.getAllLeagues();
    const lastLeague = leagues[leagues.length - 1];
    const gameMaxLeague = lastLeague.id;
    // const gameMaxLP = 12299;   // Elite 3 league max value as per sheet.
    if (usrLeagueId >= gameMaxLeague) { return '-' }
    return String(userLeagueMaxLP + 1 - userLP);
  }

  async payloadDataOfUserLeague_v2(dataToUpdate, users, rankType) {
    for (let i = 0; i < users.length; i++) {
      let element = users[i];
      let obj = {
        id: element.id, userId: element.userId, [rankType]: i + 1
      };
      if (dataToUpdate.length == 0) {
        dataToUpdate.push(obj);
      } else {
        let index = dataToUpdate.findIndex((x) => x.id == element.id);
        if (index == -1) {
          dataToUpdate.push(obj);
        } else {
          dataToUpdate[index][rankType] = i + 1;
        }
      }
    }
  }

  async updateGlobalRankings() {
    try {
      // fetch all leagues
      const allLeagues = await battleService.getAllLeaguesBasic();
      const leagueArray = allLeagues.map((x) => x.id);
      // fetch all users in leagues
      let allUsersLeagueRes = await battleService.findAllUserInLeagues(leagueArray);
      // console.log(allUsersLeagueRes)
      const dataToUpdate = [];

      if (allUsersLeagueRes && allUsersLeagueRes.length > 0) {
        allUsersLeagueRes.forEach((element) => {
          element.winPercentage = element.wins / (element.wins + element.loose);
          if (Number.isNaN(element.winPercentage)) {
            element.winPercentage = 0;
          }
        });
        allUsersLeagueRes = await this.sortUserLeagueArray_v2(allUsersLeagueRes);
        // console.log(allUsersLeagueRes)
        this.payloadDataOfUserLeague_v2(dataToUpdate, allUsersLeagueRes, 'global_rank');
      }

      if (dataToUpdate && dataToUpdate.length > 0) {
        // console.log(dataToUpdate)
        // const updateLeague = await bulkUpdater('userLeagues', 'id', ['global_rank'], dataToUpdate);
        const updateLeague = await battleService.bulkUserLeagueData(dataToUpdate);
        return updateLeague;
      }
    } catch (error) {
      console.error('Error in updateUserRanks', error);
      throw error;
    }
  }

  async addUserDuelHistory(userId, duelId, duelStatus, seasonId = null, username = null) {
    const timestamp = new Date();
    const userLeagueRes = await userService.findUserLeague(userId);
    const userLeagueData = userLeagueRes?.toJSON();
    delete userLeagueData.id;
    const new_obj = { ...userLeagueData, date: timestamp, name: username, duel_id: duelId, battle_status: duelStatus, seasonId };
    // const new_obj = {
    //   userId: userId, duel_id: duelId, battle_status: duelStatus, seasonId: seasonId, date: timestamp,
    //   leagueId: userLeagueData.leagueId, name: username,
    //   rating: userLeagueData.rating, wins: userLeagueData.wins, loose: userLeagueData.loose, draw: userLeagueData.draw, maxStreak: userLeagueData.maxStreak,
    // }
    await battleService.addLeagueHistory(new_obj);
  }

  async calculateLPandStreakBonus_v2(player_battle_data, battle_status) {
    player_battle_data.battles += 1;
    if (battle_status === 'DRAW') {
      player_battle_data.draw += 1;
      return player_battle_data;
    }

    if (battle_status === 'WIN') {
      // increase win count for winner
      player_battle_data.wins += 1;
      player_battle_data.maxStreak += 1;

      //* calc rating for winner
      // let winner_new_lp = player_battle_data.rating + player_battle_data.leaguePoint       //old logic deprecated     
      let winner_new_lp;
      if (player_battle_data.leagueId === 1) {
        winner_new_lp = player_battle_data.rating + player_battle_data.leaguePoint*2;
      } else {
        winner_new_lp = player_battle_data.rating + player_battle_data.leaguePoint
      }

      //** if winner new LP exceeds current league max LP, set it to next league's min LP
      const newLeague = await battleService.getLeagueDetailByRating(winner_new_lp);
      if (newLeague && newLeague.id > player_battle_data.leagueId) {
        player_battle_data.rating = newLeague.min;
        player_battle_data.leagueId = newLeague.id;
      } else {
        player_battle_data.rating = winner_new_lp;
      }

    } else if (battle_status === 'LOOSE') {
      //* calc LP for loser, if League is Trial ie 1, then reduce 10 LP else reduce league point
      let loser_new_lp = player_battle_data.rating - player_battle_data.leaguePoint;
      //** if loser new LP is less than current league min LP, set user to prev league
      const newLeague = await battleService.getLeagueDetailByRating(loser_new_lp);
      if (newLeague && newLeague.id < player_battle_data.leagueId) {
        player_battle_data.rating = loser_new_lp <= 0 ? 0 : loser_new_lp;
        player_battle_data.leagueId = newLeague.id;
      } else {
        player_battle_data.rating = loser_new_lp <= 0 ? 0 : loser_new_lp;
      }
      //* increase loose count for loser
      player_battle_data.loose += 1;
      player_battle_data.maxStreak = 0;
    }
    return player_battle_data;
  }


  async sortUserLeagueArray_v3(userLeagueArray) {
    return userLeagueArray.sort((a, b) => {
      // Sort primarily based on leagueId, higher first
      // Sort by leagueId (high to low)
      if (a.leagueId !== b.leagueId) {
        return b.leagueId - a.leagueId;
      }

      // If in the same league, sort by rating (high to low)
      if (a.rating !== b.rating) {
        return b.rating - a.rating;
      }

      // If rating is same, sort by updatedAt (oldest first)
      return new Date(a.updatedAt) - new Date(b.updatedAt);
    });
  }

  async updateGlobalRankings_V2() {
    try {
      // fetch all leagues
      const allLeagues = await battleService.getAllLeaguesBasic();
      const leagueArray = allLeagues.map((x) => x.id);
      // fetch all users in leagues
      let allUsersLeagueRes = await battleService.findAllUserInLeagues(leagueArray);
      // console.info(allUsersLeagueRes)
      const dataToUpdate = [];

      if (allUsersLeagueRes && allUsersLeagueRes.length > 0) {
        // allUsersLeagueRes.forEach((element) => {
        //   element.winPercentage = element.wins / (element.wins + element.loose);
        //   if (Number.isNaN(element.winPercentage)) {
        //     element.winPercentage = 0;
        //   }
        // });
        allUsersLeagueRes = await this.sortUserLeagueArray_v3(allUsersLeagueRes);
        // console.info(allUsersLeagueRes)
        this.payloadDataOfUserLeague_v2(dataToUpdate, allUsersLeagueRes, 'global_rank');
      }

      if (dataToUpdate && dataToUpdate.length > 0) {
        console.info(dataToUpdate)
        // const updateLeague = await bulkUpdater('userLeagues', 'id', ['global_rank'], dataToUpdate);
        const updateLeague = await battleService.bulkUserLeagueDataV2(dataToUpdate);
        return updateLeague;
      }
    } catch (error) {
      console.error('Error in updateUserRanks', error);
      throw error;
    }
  }


}

const battle_utils = new BattleUtils();

module.exports = battle_utils;
