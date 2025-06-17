

module.exports = (sequelize, DataTypes) => {
    const user_gacha_tickets = sequelize.define('user_gacha_tickets', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false, },
        user_id: { type: DataTypes.INTEGER, allowNull: false, },
        gacha_id: { type: DataTypes.INTEGER, allowNull: false, },
        purchase_id: { type: DataTypes.INTEGER, allowNull: false, },
        used_at: { type: DataTypes.DATE, allowNull: true },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
    }, {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'rfm_user_gacha_tickets',
    });
    return user_gacha_tickets;
}