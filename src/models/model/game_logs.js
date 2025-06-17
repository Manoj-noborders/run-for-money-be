'use strict';
const { Model } = require('sequelize');
const app_name = require('../../../package.json').name;

module.exports = (sequelize, DataTypes) => {
    class game_logs extends Model {
        static associate(models) {
            // Define associations if needed
        }
    }

    game_logs.init({
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        duelId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'rfm_battles',
                key: 'id'
            }
        },
        entityType: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'USER'
        },
        fileUrl: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'game_logs',
        tableName: `${app_name}_game_logs`,
        timestamps: true,
    });

    return game_logs;
};