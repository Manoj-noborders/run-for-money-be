'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('rfm_battle_logs', 'battle_result', {
      type: Sequelize.ENUM('win', 'lose', 'draw'),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('rfm_battle_logs', 'battle_result');
  }
};
