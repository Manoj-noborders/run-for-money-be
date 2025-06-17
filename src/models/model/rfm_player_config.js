//* create model definition for rfm_player_config table and export it
// Path: src/models/model/rfm_player_config.js
const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const rfm_player_config = sequelize.define('rfm_player_config', {
        hunterCount: { type: DataTypes.INTEGER, allowNull: true },
        runnerCount: { type: DataTypes.INTEGER, allowNull: true },
        hunterSpeed: { type: DataTypes.INTEGER, allowNull: true },
        runnerSpeed: { type: DataTypes.INTEGER, allowNull: true },
    }, {
        timestamps: true,
        tableName: `${pkg.name}_player_config`,
    });
    // rfm_player_config.prototype.toJSON = function () {
    //     const values = Object.assign({}, this.get());
    //     return values;
    // };
    return rfm_player_config;
}
