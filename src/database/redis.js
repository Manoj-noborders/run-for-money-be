//@ts-check
const { createClient } = require('redis');

class RedisClient {
    constructor() {
        this.redis = createClient({
            url: process.env.REDIS_URL,
            //@ts-ignore
            database: +process.env.REDIS_DB || 3,
        });

        this.errorCount = 0;

        this.redis.on('error', (err) => {
            console.error('Redis error: ', err);
            this.errorCount++;
            if (this.errorCount >= 5) {
                console.error('Too many Redis errors, terminating process');
                // process.exit(1);
            }
        });

        this.redis.on('ready', () => {
            this.errorCount = 0;
        });

    }

    async init(dailyKey, weeklyKey) {
        try {
            await this.redis.connect();
            console.info('******   Redis ready   ********');
            // Ensure the leaderboards exist
            await Promise.all([
                this.ensureLeaderboardExists(dailyKey, 12 * 24 * 60 * 60), // 12 days expiration for daily
                this.ensureLeaderboardExists(weeklyKey, 60 * 24 * 60 * 60), // 60 days expiration for weekly
            ]);

        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }

    async ensureLeaderboardExists(key, expirationSeconds) {
        const exists = await this.redis.exists(key);
        if (!exists) {
            // Initialize the sorted set (implicitly created when we use ZADD)
            await this.redis.zAdd(key, [{ score: 0, value: 'dummy' }]);
            // Set an expiration time
            await this.redis.expire(key, expirationSeconds);
        } else {
            console.log('Leaderboard exists:', key);
            await this.redis.zRem(key, 'dummy')
        }
    }

}


module.exports = RedisClient;