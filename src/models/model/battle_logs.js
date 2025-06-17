const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const battle_logs = sequelize.define('battle_logs', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        battle_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'rfm_battles', key: 'id' }, // Foreign key to battles table
            onDelete: 'CASCADE',
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' }, // Foreign key to users table
            onDelete: 'CASCADE',
        },
        role: {
            type: DataTypes.ENUM('hunter', 'runner'),
            allowNull: false
        },
        battle_result: {
            type: DataTypes.ENUM('win', 'lose', 'draw'),
            allowNull: true
        },
        caught_runners: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: true,
            defaultValue: null // For hunters
        },
        is_caught: {
            type: DataTypes.BOOLEAN,
            allowNull: true, // For runners
        },
        time_survived: {
            type: DataTypes.INTEGER,
            allowNull: true, // In seconds, for runners
        },
        gold_earned: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        team_reward: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        participation_fee_deducted: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        force_quit: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
    }, {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: `${pkg.name}_battle_logs`,
    });

    return battle_logs;
};
