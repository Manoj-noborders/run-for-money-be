'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rfm_gachas', 'cost_white_jewel2', {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    });

    await queryInterface.addColumn('rfm_user_money', 'white_jewel2', {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('rfm_gachas', 'cost_white_jewel2');
    await queryInterface.removeColumn('rfm_user_money', 'white_jewel2');
  }
};
