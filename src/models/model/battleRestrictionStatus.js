const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const battleRestrictionStatus = sequelize.define('battleRestrictionStatus', {
        isLimitedBattles: { type: DataTypes.BOOLEAN, defaultValue: false }
    }, {
        tableName: `${pkg.name}_battle_restriction_status`
    });
    battleRestrictionStatus.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return battleRestrictionStatus;
}