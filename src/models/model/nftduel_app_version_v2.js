'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class nftduel_app_version_v2 extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  nftduel_app_version_v2.init({
    version: { type: DataTypes.STRING, allowNull: false },
    platform: { type: DataTypes.STRING, allowNull: false },
    is_live: { type: DataTypes.BOOLEAN, defaultValue: false },
    forceUpdateRestricted: { type: DataTypes.BOOLEAN, defaultValue: false },
    isMaintenance: { type: DataTypes.BOOLEAN, defaultValue: false },
    apple_guest_login: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    sequelize,
    tableName: 'nftduel_app_version_v2',
    paranoid: true,
  });
  return nftduel_app_version_v2;
};