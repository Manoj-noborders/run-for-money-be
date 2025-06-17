const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const user_battle_reward_logs = sequelize.define('user_battle_reward_logs', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        battle_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        reward_type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        reward_value: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: `${pkg.name}_user_battle_reward_logs`,
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return user_battle_reward_logs;
};