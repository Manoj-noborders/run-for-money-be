const pkg = require('../../../package.json');

module.exports = (sequelize, DataTypes) => {
    const tips = sequelize.define('tips', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        tips: { type: DataTypes.STRING, allowNull: false },
        createdAt: { type: DataTypes.DATE, },
        updatedAt: { type: DataTypes.DATE, }
    }, {
        tableName: `${pkg.name}_tips`,
        timestamps: true,
    });

    tips.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return tips;
};