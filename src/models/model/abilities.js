const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const abilities = sequelize.define('abilities', {
        id: {
            type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
        },
        name: { type: DataTypes.STRING, allowNull: false, unique: true, },
        type: {
            type: DataTypes.STRING, allowNull: false,
        },
        description: {
            type: DataTypes.TEXT, allowNull: true,
        },
        effect_value: {
            type: DataTypes.INTEGER, allowNull: true,
        },
        default_val: {
            type: DataTypes.INTEGER, allowNull: true,
        },
        min: {
            type: DataTypes.INTEGER, allowNull: true,
        },
        max: {
            type: DataTypes.INTEGER, allowNull: true,
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
        tableName: 'rfm_abilities',
    });

    // abilities.associate = function (models) {
    //     abilities.hasMany(models.user_inventory, { foreignKey: 'ability_id' });
    //     abilities.hasMany(models.gacha_items, { foreignKey: 'ability_id' });
    // };

    return abilities;
}