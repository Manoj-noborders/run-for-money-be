const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const userExperience = sequelize.define('userExperience', {
        userId: { type: DataTypes.INTEGER, allowNull: false },
        player_xp: { type: DataTypes.INTEGER, defaultValue: 0 },
        xp_level: { type: DataTypes.INTEGER, defaultValue: 1 },
    }, {
        tableName: `${pkg.name}_user_experience`,
    });
    userExperience.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return userExperience;
}
