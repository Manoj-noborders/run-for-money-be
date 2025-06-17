const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const leaguesDetails = sequelize.define('leaguesDetails', {
        leagueId: { type: DataTypes.INTEGER, allowNull: false },
        defaultPoint: { type: DataTypes.INTEGER, allowNull: false },
        min: { type: DataTypes.INTEGER, allowNull: false },
        max: { type: DataTypes.INTEGER, allowNull: false },
        target: { type: DataTypes.INTEGER, allowNull: false },
        fuelConsumption: { type: DataTypes.INTEGER, allowNull: false },
    }, {
        tableName: `${pkg.name}_league_details`,
    });
    leaguesDetails.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        return values;
    };
    return leaguesDetails;
}