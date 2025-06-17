'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class XanaXanaliaSyncCalls extends Model {
        static associate(models) {
            // associations can be defined here
        }
    }
    XanaXanaliaSyncCalls.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        request: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        response: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        error: {
            type: DataTypes.TEXT,
            allowNull: true
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
        sequelize,
        modelName: 'xana_xanalia_sync_calls',
        tableName: 'xana_xanalia_sync_calls',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return XanaXanaliaSyncCalls;
};
