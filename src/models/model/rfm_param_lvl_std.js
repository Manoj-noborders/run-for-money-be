//* create model definition for rfm_param_lvl_std table and export it
// Path: src/models/model/rfm_param_lvl_std.js
const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const rfm_param_lvl_std = sequelize.define('rfm_param_lvl_std', {
        level: { type: DataTypes.INTEGER, allowNull: false },
        minGachaCount: { type: DataTypes.INTEGER, allowNull: false },
        nextLvlReqdCount: { type: DataTypes.INTEGER, allowNull: false },
    }, {
        timestamps: true,
        tableName: `${pkg.name}_param_lvl_std`,
    });
    // rfm_param_lvl_std.prototype.toJSON = function () {
    //     const values = Object.assign({}, this.get());
    //     return values;
    // };
    return rfm_param_lvl_std;
}
