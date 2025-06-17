//@ts-check
const pkg = require('../../package.json');
const Redis = require('../database/redis');
const models = require('../models');
const {
    userLeagues,
} = models;
const { UserInputError } = require('../utils/classes');

const app_name = pkg.name;
const SCORE_MULTIPLIER = 1000000;

const RedisService = new Redis();
RedisService.init(getLBKey('daily'), getLBKey('weekly'))

const client = RedisService.redis;

function getISOWeek(date) {
    const target = new Date(date.valueOf());
    const dayNumber = (date.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNumber + 3);
    const firstThursday = target.valueOf();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
        target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    }
    //@ts-ignore
    return 1 + Math.ceil((firstThursday - target) / 604800000);
}

function getLBKey(type) {
    const now = new Date();
    switch (type) {
        case 'daily':
            return `${app_name}:leaderboard:daily:${now.toISOString().split('T')[0]}`;
        case 'weekly':
            const weekNumber = getISOWeek(now);
            return `${app_name}:leaderboard:weekly:${now.getFullYear()}-W${weekNumber}`;
        default:
            throw new UserInputError('Invalid leaderboard type');
    }
}

function getUserkey(uId) {
    return `user_${uId}`
}

function getUserIdFromKey(userKey) {
    return userKey.split('_').pop();
}

// function calculateCompoundScore(score, winRatio, gamesPlayed) {
//     const normalizedScore = Math.floor(score * SCORE_MULTIPLIER);
//     const normalizedWinRatio = Math.floor(winRatio * 10000);
//     const normalizedGames = Math.min(gamesPlayed, 9999);

//     return (normalizedScore * 100000000) + (normalizedWinRatio * 10000) + normalizedGames;
// }


function calculateCompoundScore(score, winRatio, gamesPlayed) {
    // Convert main score to integer (multiply by 100 to preserve 2 decimal places)
    const normalizedScore = Math.floor(score * 100);

    // Convert win ratio to integer between 0-10000 (4 decimal precision)
    const normalizedWinRatio = Math.floor(winRatio * 10000);

    // Cap games at 999 to maintain score structure
    const normalizedGames = Math.min(gamesPlayed, 999);

    // Combine all factors:
    // Score: 12 digits (allowing for scores up to 9,999,999,999.99)
    // Win Ratio: 4 digits (0000-9999)
    // Games: 3 digits (000-999)
    return (normalizedScore * 10000000) + (normalizedWinRatio * 1000) + normalizedGames;
}

function decomposeScore(compoundScore) {
    const games = compoundScore % 1000;
    const winRatio = (Math.floor(compoundScore / 1000) % 10000) / 10000;
    const score = Math.floor(compoundScore / 10000000) / 100;

    return { score, winRatio, games };
}

function getStatsKey(type, userId) {
    const lbKey = getLBKey(type);
    return `${lbKey}:stats:${userId}`;
}

module.exports = {

    addToLeaderboard: async (userId, points) => {
        const dailyLBKey = getLBKey('daily');
        const weeklyLBKey = getLBKey('weekly');
        const userKey = getUserkey(userId);
        const adds = Promise.all([
            await client.zAdd(dailyLBKey, [{ score: points, value: userKey }], { NX: true }),
            await client.zAdd(weeklyLBKey, [{ score: points, value: userKey }], { NX: true }),
        ]);

        return adds;
    },

    async checkIfUserExistsInLB(userId,) {
        const dailyLBKey = getLBKey('daily');
        const weeklyLBKey = getLBKey('weekly');
        const userKey = getUserkey(userId);
        const checks = Promise.all([
            await client.zRank(dailyLBKey, userKey),
            await client.zRank(weeklyLBKey, userKey),
        ]);

        return checks;
    },

    getLeaderboard: async (startIndex, endIndex, type) => {
        try {
            const lbKey = getLBKey(type);
            // Correcting limit handling by calculating end index
            const users = await client.zRangeWithScores(lbKey, startIndex, endIndex, { REV: true });
            console.info(users);

            // Filter out the 'dummy' entry
            const filteredUsers = users.filter(user => user.value !== 'dummy');

            console.info('Filtered users:', filteredUsers);

            const userDetails = await Promise.all(filteredUsers.map(async (user) => {
                const { value: userKey, score } = user;
                //@ts-ignore
                const userRank = await client.zRevRank(lbKey, userKey) + 1;
                return { user_id: Number(getUserIdFromKey(userKey)), score, userRank };
            }));

            return userDetails;
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            throw error; // Rethrowing the error to be handled by the caller
        }
    },

    async getLeaderboardCount(type) {
        const lbKey = getLBKey(type);
        // get total count of leaderboard
        let total = await client.zCard(lbKey);
        // remove dummy user from total count
        return total;
    },

    async updateLeaderboard(userId, earnedMoney) {
        const dailyLBKey = getLBKey('daily');
        const weeklyLBKey = getLBKey('weekly');

        const userKey = getUserkey(userId);
        // Update the user's score
        const updts = await Promise.all([
            client.zIncrBy(dailyLBKey, earnedMoney, userKey),  // Update the user's score by the earned money Daily
            client.zIncrBy(weeklyLBKey, earnedMoney, userKey),  // Update the user's score by the earned money Weekly
        ]);

        console.log('Leaderboard updated:', updts);

        return updts;
    },

    async getUserRank(userId, type) {
        const lbKey = getLBKey(type);
        const userKey = getUserkey(userId);
        // let userRank = await userLeagues.findOne({
        //     attributes: ['id'],
        //     where: { userId }
        // })
        console.log(lbKey, userKey, "---lbKey, userKey---174")
        let userRank = await client.zRevRank(lbKey, userKey)
        console.log(userRank, "---userRank---175")
        if (userRank !== null || userRank !== undefined) {
            //@ts-ignore
            userRank = userRank == 0 ? 0 : userRank + 1 // 0-based index
            // userRank = userRank>1 ? userRank + 1 : 0 // 0-based index
        }

        return userRank;
    },

    async getLeaderboardCountV2(type) {
        try {
            const lbKey = getLBKey(type);
            // Get total count of leaderboard
            const total = await client.zCard(lbKey);
            console.log('Total users in leaderboard =>:', total);
            // Subtract dummy user if exists
            const hasDummy = await client.zScore(lbKey, 'dummy');
            console.log('Has dummy:', hasDummy);
            return hasDummy ? total - 1 : total;
        } catch (error) {
            console.error('Failed to get leaderboard count:', error);
            throw error;
        }
    },

    addToLeaderboardV2: async (userId) => {
        const dailyLBKey = getLBKey('daily');
        const weeklyLBKey = getLBKey('weekly');
        const userKey = getUserkey(userId);

        // Initialize with 0 score and stats
        const initialCompoundScore = calculateCompoundScore(0, 0, 0);

        // Initialize stats in Redis
        const dailyStatsKey = getStatsKey('daily', userId);
        const weeklyStatsKey = getStatsKey('weekly', userId);

        await Promise.all([
            // Add to leaderboards
            client.zAdd(dailyLBKey, [{ score: initialCompoundScore, value: userKey }], { NX: true }),
            client.zAdd(weeklyLBKey, [{ score: initialCompoundScore, value: userKey }], { NX: true }),
            // Initialize stats
            client.hSet(dailyStatsKey, {
                wins: 0,
                losses: 0,
                score: 0
            }),
            client.hSet(weeklyStatsKey, {
                wins: 0,
                losses: 0,
                score: 0
            })
        ]);
    },

    updateLeaderboardV2: async (userId, earnedMoney, teamReward, battleResult = null) => {
        const dailyLBKey = getLBKey('daily');
        const weeklyLBKey = getLBKey('weekly');
        const userKey = getUserkey(userId);

        const dailyStatsKey = getStatsKey('daily', userId);
        const weeklyStatsKey = getStatsKey('weekly', userId);

        console.info(dailyStatsKey, weeklyStatsKey);

        // Start a Redis transaction
        const multi = client.multi();

        // Update stats based on battle result
        if (battleResult) {
            multi.hIncrBy(dailyStatsKey, battleResult === 'win' ? 'wins' : 'losses', 1);
            multi.hIncrBy(weeklyStatsKey, battleResult === 'win' ? 'wins' : 'losses', 1);
        }

        // Update scores
        multi.hIncrByFloat(dailyStatsKey, 'score', earnedMoney);
        multi.hIncrByFloat(weeklyStatsKey, 'score', (earnedMoney + teamReward));

        // Execute stats updates
        await multi.exec();

        // Get updated stats
        const [dailyStats, weeklyStats] = await Promise.all([
            client.hGetAll(dailyStatsKey),
            client.hGetAll(weeklyStatsKey)
        ]);

        // Calculate new compound scores
        const calculateStats = (stats) => {
            const wins = parseInt(stats.wins || 0);
            const losses = parseInt(stats.losses || 0);
            const gamesPlayed = wins + losses;
            const winRatio = gamesPlayed > 0 ? wins / gamesPlayed : 0;
            return calculateCompoundScore(parseFloat(stats.score || 0), winRatio, gamesPlayed);
        };

        // Update leaderboard scores
        await Promise.all([
            client.zAdd(dailyLBKey, [{
                score: calculateStats(dailyStats),
                value: userKey
            }]),
            client.zAdd(weeklyLBKey, [{
                score: calculateStats(weeklyStats),
                value: userKey
            }])
        ]);
    },

    getLeaderboardV2: async (startIndex, endIndex, type) => {
        try {
            const lbKey = getLBKey(type);
            const users = await client.zRangeWithScores(lbKey, startIndex, endIndex, { REV: true });

            const filteredUsers = users.filter(user => user.value !== 'dummy');

            const userDetails = await Promise.all(filteredUsers.map(async (user) => {
                const { value: userKey, score: compoundScore } = user;
                const userId = getUserIdFromKey(userKey);
                //@ts-ignore
                const userRank = await client.zRevRank(lbKey, userKey) + 1;

                // Get user stats
                const statsKey = getStatsKey(type, userId);
                const stats = await client.hGetAll(statsKey);

                // Decompose the compound score
                const { score } = decomposeScore(compoundScore);

                //@ts-ignore
                const wins = parseInt(stats.wins || 0);
                //@ts-ignore
                const losses = parseInt(stats.losses || 0);
                const gamesPlayed = wins + losses;
                const winRatio = gamesPlayed > 0 ? wins / gamesPlayed : 0;

                return {
                    user_id: Number(userId),
                    //@ts-ignore
                    score: parseInt(score || 0),
                    userRank,
                    wins,
                    losses,
                    gamesPlayed,
                    winRatio
                };
            }));

            return userDetails;
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            throw error;
        }
    },

    async updateLeaderboardOnAccDelete(userId) {
        const dailyLBKey = getLBKey('daily');
        const weeklyLBKey = getLBKey('weekly');
        const userKey = getUserkey(userId);

        const dailyStatsKey = getStatsKey('daily', userId);
        const weeklyStatsKey = getStatsKey('weekly', userId);

        console.info(dailyLBKey, weeklyLBKey, "---dailyLBKey, weeklyLBKey---");
        console.info(userKey, "---userKey---");
        console.info(dailyStatsKey, weeklyStatsKey, "---dailyStatsKey, weeklyStatsKey---");

        try {
            // Fetch the complete daily leaderboard
            const dailyLeaderboard01 = await client.zRangeWithScores(dailyLBKey, 0, -1, { REV: true });
            console.info('Updated Daily Leaderboard:', dailyLeaderboard01);

            const totalRecords01 = await client.zCard(dailyLBKey);
            console.info('Total records in daily leaderboard:', totalRecords01);

            // Remove user from leaderboards
            await Promise.all([
                client.zRem(dailyLBKey, userKey),
                client.zRem(weeklyLBKey, userKey)
            ]);

            // Remove user's stats
            await Promise.all([
                client.del(dailyStatsKey),
                client.del(weeklyStatsKey)
            ]);

            // Verify removal
            const [dailyExists, weeklyExists, dailyStatsExists, weeklyStatsExists] = await Promise.all([
                client.zScore(dailyLBKey, userKey), // Check if user still exists in daily leaderboard
                client.zScore(weeklyLBKey, userKey), // Check if user still exists in weekly leaderboard
                client.exists(dailyStatsKey), // Check if daily stats key still exists
                client.exists(weeklyStatsKey) // Check if weekly stats key still exists
            ]);

            if (dailyExists || weeklyExists || dailyStatsExists || weeklyStatsExists) {
                console.warn(`Data for user ${userId} was not fully removed from Redis.`);
                return false;
            }

            console.info(`Successfully removed user ${userId} from leaderboard and stats.`);

            // Fetch the complete daily leaderboard
            const dailyLeaderboard = await client.zRangeWithScores(dailyLBKey, 0, -1, { REV: true });
            console.info('Updated Daily Leaderboard:', dailyLeaderboard);

            const totalRecords02 = await client.zCard(dailyLBKey);
            console.info('Total records in daily leaderboard:', totalRecords02);

            return dailyLeaderboard;
        } catch (error) {
            console.error(`Failed to remove user ${userId} from leaderboard and stats:`, error);
            throw error;
        }
    }

}
