const cron = require('node-cron');
const { getRunningBattles } = require('../services/battle.service');
const { forcefullyEndBattle } = require('../controller/battleController');


//force end battles scheduler
const force_end_battles = async () => {
    console.log('*******************   Running Event Scheduler every 20 mins  ********************');
    try {
        let battleList = await getRunningBattles();
        console.log(battleList, "---battleList---11")
        if (battleList) {
            for (let i = 0; i < battleList.length; i++) {
                const element = battleList[i];
                
                let duelPayload = {
                    dualId: element.id,
                    hunterId: element.hunterId,
                    hunterData: [],
                    runnerId: element.runnerId,
                    runnerData: [],
                    hunter_battleStatus: 'DRAW',
                    runner_battleStatus: 'DRAW'
                }

                element.hunterId.map(dt => {
                    duelPayload.hunterData.push({
                        "userId": dt,
                        "catches": 0
                    })
                })

                element.runnerId.map(dt => {
                    duelPayload.runnerData.push({
                        "userId": dt,
                        "isEscaped": false
                    })
                })
                await forcefullyEndBattle(duelPayload)
            }
            return 'Battles ended.';
        }
    } catch (error) {
        console.error(error);
        return false;
    }
};

// World Scheduler CronJOB
// const ForceEndBattleScheduler = cron.schedule('*/20 * * * * *', force_end_battles, { scheduled: false });        runs in 20 seconds for D&T
const ForceEndBattleScheduler = cron.schedule('*/20 * * * *', force_end_battles, { scheduled: false });

module.exports = {
    ForceEndBattleScheduler
}
