'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rfm_abilities', 'default_val', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('rfm_abilities', 'min', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('rfm_abilities', 'max', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('rfm_abilities', 'default_val');
    await queryInterface.removeColumn('rfm_abilities', 'min');
    await queryInterface.removeColumn('rfm_abilities', 'max');
  }
};
