const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const user_gacha_levels = sequelize.define('user_gacha_levels', {
        id: {
            type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' },
        },
        gacha_id: {
            type: DataTypes.INTEGER, allowNull: false, references: { model: 'gachas', key: 'id' },
        },
        level: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 0,
        },
        mean_value: {
            type: DataTypes.FLOAT, allowNull: false, defaultValue: 20,
        },
        counter: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 0,
        },
        spins_to_next: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 1,
        },
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
        tableName: `${pkg.name}_user_gacha_levels`,
    });

    user_gacha_levels.associate = function (models) {
        user_gacha_levels.belongsTo(models.users, { foreignKey: 'user_id' });
        user_gacha_levels.belongsTo(models.gachas, { foreignKey: 'gacha_id' });
    };

    return user_gacha_levels;

}