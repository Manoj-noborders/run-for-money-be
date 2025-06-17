const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const user_inventory = sequelize.define('user_inventory', {
        id: {
            type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id', },
        },
        ability_id: {
            type: DataTypes.INTEGER, allowNull: false, references: { model: 'abilities', key: 'id', },
        },
        ability_type: {     // currently im mapping it to gacha id based on their type so it'll be 1:parameter,2:items,3:special
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 1,
        },
        level: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 1,
        },
        is_equipped: {
            type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
        },
        acquired_at: {
            type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW,
        },
    }, {
        underscored: true,
        timestamps: false,
        // createdAt: 'created_at',
        // updatedAt: 'updated_at',
        tableName: `${pkg.name}_user_inventory`,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'ability_id', 'ability_type'],
                name: 'user_inventory_unique_ability'
            }
        ]
    });

    user_inventory.associate = function (models) {
        user_inventory.belongsTo(models.abilities, { foreignKey: 'ability_id' });
        user_inventory.belongsTo(models.users, { foreignKey: 'user_id' });
    };
    return user_inventory;

}