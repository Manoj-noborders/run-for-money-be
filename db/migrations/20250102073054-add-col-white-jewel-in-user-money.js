'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rfm_user_money', 'white_jewel', {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    });

    // rename gold to red_jewel
    // await queryInterface.renameColumn('rfm_user_money', 'gold', 'red_jewel');

    // remove column alltime_gold
    // await queryInterface.removeColumn('rfm_user_money', 'alltime_gold');
  },

  async down(queryInterface, Sequelize) {
    // await queryInterface.addColumn('rfm_user_money', 'alltime_gold', {
    //   type: Sequelize.FLOAT,
    //   allowNull: false,
    //   defaultValue: 0,
    // });

    // rename red_jewel to gold
    // await queryInterface.renameColumn('rfm_user_money', 'red_jewel', 'gold');

    // remove column white_jewel
    await queryInterface.removeColumn('rfm_user_money', 'white_jewel');
  }
};
