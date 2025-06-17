'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('rfm_user_inventory',
      ['user_id', 'ability_id', 'ability_type'],
      {
        name: 'user_inventory_unique_ability',
        unique: true,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('rfm_user_inventory', 'user_inventory_unique_ability');
  }
};