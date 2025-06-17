const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const battles = sequelize.define('battles', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false, },
        hunter_ids: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
        runner_ids: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false },
        room_id: { type: DataTypes.STRING, allowNull: true },
        league_id: { type: DataTypes.INTEGER, allowNull: true },
        start_date: { type: DataTypes.DATE, allowNull: false },
        end_date: { type: DataTypes.DATE, allowNull: true },
        winning_team: { type: DataTypes.STRING, allowNull: true, validate: { isIn: [['hunter', 'runner', 'force_end']] } },
        is_draw: { type: DataTypes.BOOLEAN, allowNull: true },
        has_ended: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
        participation_fee_each: { type: DataTypes.FLOAT, allowNull: false },
        total_participation_fee: { type: DataTypes.FLOAT, allowNull: false },
        total_reward: { type: DataTypes.FLOAT, allowNull: true },
        results: { type: DataTypes.JSONB, allowNull: true },
        season_id: { type: DataTypes.INTEGER, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: `${pkg.name}_battles`,
    });

    return battles;
}