const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const user_money = sequelize.define('user_money', {
        id: {
            type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id', },
        },
        gold: {
            type: DataTypes.DECIMAL, allowNull: false, defaultValue: 60000,
            // field: 'red_jewel',
            // virtual getter to convert values to FLOAT
            get() {
                return parseFloat(this.getDataValue('gold'));
            },
        },
        run_token: {
            type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0,
        },
        white_jewel: {
            type: DataTypes.FLOAT, allowNull: false, defaultValue: 0,
        },
        white_jewel2: {
            type: DataTypes.FLOAT, allowNull: false, defaultValue: 0,
        },
        // alltime_gold: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        created_at: {
            type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW,
        },
    }, {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: `${pkg.name}_user_money`,
    });

    user_money.associate = function (models) {
        user_money.belongsTo(models.users, { foreignKey: 'user_id' });
    };

    return user_money;
}