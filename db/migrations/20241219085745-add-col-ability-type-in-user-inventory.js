'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rfm_user_inventory', 'ability_type', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });

    // remove old contraint and create new one
    await queryInterface.removeConstraint('rfm_user_inventory', 'unique_user_ability');

    await queryInterface.addConstraint('rfm_user_inventory', {
      fields: ['user_id', 'ability_id', 'ability_type'],
      type: 'unique',
      name: 'unique_user_ability',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('rfm_user_inventory', 'ability_type');
    await queryInterface.removeConstraint('rfm_user_inventory', 'unique_user_ability');

    // add old contraint
    await queryInterface.addConstraint('rfm_user_inventory', {
      fields: ['user_id', 'ability_id'],
      type: 'unique',
      name: 'unique_user_ability',
    });

  }
};
