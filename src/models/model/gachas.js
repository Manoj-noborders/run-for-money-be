const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const gachas = sequelize.define('gachas', {
        id: {
            type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
        },
        name: {
            type: DataTypes.STRING, allowNull: false,
        },
        description: {
            type: DataTypes.TEXT, allowNull: true,
        },
        cost_gold: {
            type: DataTypes.DECIMAL, allowNull: false, defaultValue: 1000,
            get() {
                return parseFloat(this.getDataValue('cost_gold'));
            }
        },
        cost_fiat: {
            type: DataTypes.DECIMAL, allowNull: false, defaultValue: 10,
            get() {
                return parseFloat(this.getDataValue('cost_fiat'));
            }
        },
        cost_token: {
            type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0,
            get() {
                return parseFloat(this.getDataValue('cost_token'));
            }
        },
        cost_white_jewel: {
            type: DataTypes.FLOAT, allowNull: false, defaultValue: 0,
        },
        cost_white_jewel2: {
            type: DataTypes.FLOAT, allowNull: false, defaultValue: 0,
        },
        base_mean: {
            type: DataTypes.INTEGER, allowNull: true,
        },
        standard_deviation: {
            type: DataTypes.DECIMAL, allowNull: true,
            get() {
                return parseFloat(this.getDataValue('standard_deviation'));
            }
        },
        scale_factor: {
            type: DataTypes.DECIMAL, allowNull: true,
            get() {
                return parseFloat(this.getDataValue('scale_factor'));
            }
        },
        growth_rate: {
            type: DataTypes.DECIMAL, allowNull: true,
            get() {
                return parseFloat(this.getDataValue('growth_rate'));
            }
        },
        created_at: {
            type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW
        }
    }, {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'rfm_gachas',
    });

    return gachas;
}