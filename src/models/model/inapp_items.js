

module.exports = (sequelize, DataTypes) => {
    const inapp_items = sequelize.define('inapp_items', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false, },
        name: { type: DataTypes.STRING, allowNull: false, },
        description: { type: DataTypes.STRING, allowNull: false, },
        image: { type: DataTypes.STRING, allowNull: false, },
        cost_gold: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
        cost_fiat: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
        cost_token: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
    }, {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'rfm_inapp_items',
    });
    return inapp_items;
}
