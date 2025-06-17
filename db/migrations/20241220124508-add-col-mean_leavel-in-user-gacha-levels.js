'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('rfm_user_gacha_levels', 'mean_value', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 20
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('rfm_user_gacha_levels', 'mean_value');
  }
};
