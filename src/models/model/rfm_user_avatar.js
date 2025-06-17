//* create model definition for rfm_user_avatar table and export it
// Path: src/models/model/rfm_user_avatar.js
const pkg = require('../../../package.json');
module.exports = (sequelize, DataTypes) => {
    const rfm_user_avatar = sequelize.define('rfm_user_avatar', {
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING, allowNull: true },
        avatar_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: -1 }
    }, {
        timestamps: true,
        tableName: `${pkg.name}_user_avatar`,
    });
    // rfm_user_avatar.prototype.toJSON = function () {
    //     const values = Object.assign({}, this.get());
    //     return values;
    // };
    return rfm_user_avatar;
}
