'use strict';
module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable("rfm_experience_levels", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      level: { type: DataTypes.INTEGER, allowNull: false },
      min_xp: { type: DataTypes.INTEGER, allowNull: false },
      max_xp: { type: DataTypes.INTEGER, allowNull: false },
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
    return queryInterface.dropTable("rfm_experience_levels");
  },
};
