const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const gacha_items = sequelize.define('gacha_items', {
        id: {
            type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
        },
        gacha_id: {
            type: DataTypes.INTEGER, allowNull: false, references: { model: 'gachas', key: 'id', },
        },
        ability_id: {
            type: DataTypes.INTEGER, allowNull: false, references: { model: 'abilities', key: 'id', },
        },
        boost_value: {
            type: DataTypes.INTEGER, allowNull: true,
        },
        description: {
            type: DataTypes.TEXT, allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW,
        }
    }, {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: `${pkg.name}_gacha_items`,
    });

    gacha_items.associate = function (models) {
        gacha_items.belongsTo(models.abilities, { foreignKey: 'ability_id' });
    };
    return gacha_items;
}