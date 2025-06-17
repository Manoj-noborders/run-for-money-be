'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_user_inventory', {
      id: {
        type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id', },
      },
      ability_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'rfm_abilities', key: 'id', },
      },
      level: {
        type: Sequelize.INTEGER, allowNull: false, defaultValue: 1,
      },
      is_equipped: {
        type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false,
      },
      acquired_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.DATE,
      },
    });
    await queryInterface.addConstraint('rfm_user_inventory', {
      fields: ['user_id', 'ability_id'],
      type: 'unique',
      name: 'unique_user_ability',
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_user_inventory');
  },
};
