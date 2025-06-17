module.exports = (sequelize, DataTypes) => {
    const loginStatus = sequelize.define('loginStatus', {
        isLoginRestricted: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_tcg_battle_restricted:{type: DataTypes.BOOLEAN, allowNull: false,defaultValue: true }
    }, {});
    loginStatus.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return loginStatus;
}