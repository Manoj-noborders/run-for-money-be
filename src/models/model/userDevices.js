module.exports = (sequelize, DataTypes) => {
    const userDevices = sequelize.define('userDevices', {
        userId: { type: DataTypes.INTEGER, allowNull: false },
        userInfo: { type: DataTypes.INTEGER, allowNull: false },
        deviceId: { type: DataTypes.STRING, allowNull: false },
        expiredIn: { type: DataTypes.DATE, allowNull: false },
        native_app_id: { type: DataTypes.STRING, allowNull: true },
    }, {});
    userDevices.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return userDevices;
};
