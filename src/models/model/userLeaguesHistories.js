const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const userLeaguesHistories = sequelize.define('userLeaguesHistories', {
        userId: { type: DataTypes.INTEGER, allowNull: false },
        leagueId: { type: DataTypes.INTEGER, allowNull: false },
        rating: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        battles: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        wins: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        loose: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        draw: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        maxStreak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        date: { type: DataTypes.DATE, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        duel_id: {
            type: DataTypes.INTEGER,
            // references: { model: `rfm_user_duels`, key: 'id' },
        },
        battle_status: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
        seasonId: {
            type: DataTypes.INTEGER, allowNull: true, 
            // references: { model: `rfm_seasons`, key: 'seasonId' },
        },
    }, {
        tableName: `${pkg.name}_user_duel_histories`,
    });
    userLeaguesHistories.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return userLeaguesHistories;
}
