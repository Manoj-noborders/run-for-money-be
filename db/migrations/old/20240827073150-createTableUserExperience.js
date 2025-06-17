'use strict';
module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable("rfm_user_experience", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      player_xp: { type: DataTypes.INTEGER, defaultValue: 0 },
      xp_level: { type: DataTypes.INTEGER, defaultValue: 1 },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });
  },
  down: function (queryInterface, DataTypes) {
    return queryInterface.dropTable("rfm_user_experience");
  },
};
