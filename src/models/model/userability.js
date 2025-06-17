const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const userAbility = sequelize.define('userAbility', {
        userId: { type: DataTypes.INTEGER, allowNull: false },
        abilityName: { type: DataTypes.STRING, allowNull: false },
        count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    }, {
        tableName: `${pkg.name}_user_ability`,
        // paranoid: true,
    });
    userAbility.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        delete values.password;
        return values;
    };
    return userAbility;
};
