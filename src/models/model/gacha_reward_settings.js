const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const gacha_reward_settings = sequelize.define('gacha_reward_settings', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, },
        gacha_id: { type: DataTypes.INTEGER, allowNull: false },
        quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
        probability: { type: DataTypes.DECIMAL, defaultValue: 100 },
        is_guaranteed: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: `${pkg.name}_gacha_reward_settings`,
    });

    return gacha_reward_settings;

}