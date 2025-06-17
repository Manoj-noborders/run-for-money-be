'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_player_config', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      hunterCount: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      runnerCount: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      hunterSpeed: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      runnerSpeed: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('rfm_player_config');
  }
};