const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const experienceLevels = sequelize.define('experienceLevels', {
        level: { type: DataTypes.INTEGER, allowNull: false },
        min_xp: { type: DataTypes.INTEGER, allowNull: false },
        max_xp: { type: DataTypes.INTEGER, allowNull: false },
    }, {
        tableName: `${pkg.name}_experience_levels`,
    });
    experienceLevels.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return experienceLevels;
}
