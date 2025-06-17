const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const nftduel_match_analytics = sequelize.define('nftduel_match_analytics', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false, },
        duel_id: { type: DataTypes.INTEGER, allowNull: true, },
        user_id: { type: DataTypes.INTEGER, allowNull: true, },
        opponent_id: { type: DataTypes.INTEGER, allowNull: true, },
        matching_time: { type: DataTypes.STRING, allowNull: true, },
        free_match: { type: DataTypes.BOOLEAN, allowNull: true, },
        player_vs_ai: { type: DataTypes.BOOLEAN, allowNull: true, },
        player_vs_player: { type: DataTypes.BOOLEAN, allowNull: true, },
        shutdown_time: { type: DataTypes.DATE, allowNull: true, },
        is_crash: { type: DataTypes.BOOLEAN, allowNull: true, },
        ai_user_id: { type: DataTypes.INTEGER, allowNull: true, },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.literal('CURRENT_TIMESTAMP'), },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.literal('CURRENT_TIMESTAMP'), },
    }, {
        tableName: `${pkg.name}_match_analytics`,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    nftduel_match_analytics.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };

    return nftduel_match_analytics;
};