const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const appVersion = sequelize.define('app_version', {
        name: { type: DataTypes.STRING, allowNull: false },
        forceUpdateRestricted: { type: DataTypes.BOOLEAN, defaultValue: false },
        isMaintenance: { type: DataTypes.BOOLEAN, defaultValue: false },
        apple_guest_login: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    }, {
        tableName: `${pkg.name}_app_version`,
    });
    appVersion.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return appVersion;
}