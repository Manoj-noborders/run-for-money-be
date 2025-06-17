'use strict';
module.exports = {
  up: function (queryInterface, DataTypes) {
    return queryInterface.createTable("rfm_user_ability", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      userId: { type: DataTypes.INTEGER, allowNull: false },
      abilityName: { type: DataTypes.STRING, allowNull: false },
      count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
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
    return queryInterface.dropTable("rfm_user_ability");
  },
};
