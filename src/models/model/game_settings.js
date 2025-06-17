

module.exports = (sequelize, DataTypes) => {
    const game_settings = sequelize.define('game_settings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        interval_minutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 30
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'rfm_game_settings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

    return game_settings;
}