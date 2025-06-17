const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const user_gacha_logs = sequelize.define('user_gacha_logs', {
        id: {
            type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
        },
        user_id: {
            type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id', },
        },
        gacha_id: {
            type: DataTypes.INTEGER, allowNull: false, references: { model: 'rfm_gachas', key: 'id', },
        },
        gacha_ticket_id: {
            type: DataTypes.INTEGER, allowNull: false, 
            // references: { model: 'rfm_gacha_tickets', key: 'id', },
        },
        is_applied: {
            type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
        },
        result: {
            type: DataTypes.JSONB, allowNull: false,
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
        tableName: 'rfm_user_gacha_logs',
    });

    user_gacha_logs.associate = function (models) {
        user_gacha_logs.belongsTo(models.users, { foreignKey: 'user_id' });
        user_gacha_logs.belongsTo(models.gachas, { foreignKey: 'gacha_id' });
    };

    return user_gacha_logs;
}