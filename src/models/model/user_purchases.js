

module.exports = (sequelize, DataTypes) => {
    const user_purchases = sequelize.define('user_purchases', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false, },
        user_id: { type: DataTypes.INTEGER, allowNull: false, },
        gacha_id: { type: DataTypes.INTEGER, allowNull: false, },
        txn_hash: { type: DataTypes.STRING, allowNull: true },
        cost: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
        currency: { type: DataTypes.STRING, allowNull: false, },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
        updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, },
    }, {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'rfm_user_purchases',
    });
    return user_purchases;
}