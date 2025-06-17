const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const userLeagues = sequelize.define('userLeagues', {
        userId: { type: DataTypes.INTEGER, allowNull: false },
        leagueId: { type: DataTypes.INTEGER, allowNull: false },
        seasonId: { type: DataTypes.INTEGER, allowNull: true },
        rating: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        battles: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        wins: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        loose: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        draw: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        maxStreak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        rewards: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        global_rank: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        is_playing: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
        tableName: `${pkg.name}_user_leagues`,
    });
    userLeagues.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return userLeagues;
}