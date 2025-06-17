'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_abilities', {
      id: {
        type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
      },
      name: { type: Sequelize.STRING, allowNull: false, unique: true, },
      type: {
        type: Sequelize.STRING, allowNull: false,
      },
      description: {
        type: Sequelize.TEXT, allowNull: true,
      },
      effect_value: {
        type: Sequelize.INTEGER, allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.DATE,
      },
    });


    // Insert basic abilities
    await queryInterface.bulkInsert('rfm_abilities', [
      { name: 'Speed', type: 'basic', created_at: new Date(), updated_at: new Date() },
      { name: 'Dash Speed', type: 'basic', created_at: new Date(), updated_at: new Date() },
      { name: 'Dash Time', type: 'basic', created_at: new Date(), updated_at: new Date() },
      { name: 'Dash Recovery', type: 'basic', created_at: new Date(), updated_at: new Date() },
      { name: 'Jump', type: 'basic', created_at: new Date(), updated_at: new Date() },
      { name: 'Capture Avoidance', type: 'basic', created_at: new Date(), updated_at: new Date() },
      { name: 'Capture Power', type: 'basic', created_at: new Date(), updated_at: new Date() }
    ]);

    // Insert special abilities
    await queryInterface.bulkInsert('rfm_abilities', [
      { name: 'Transparency', type: 'special', effect_value: 30, created_at: new Date(), updated_at: new Date() },
      { name: 'Super Dash', type: 'special', effect_value: 30, created_at: new Date(), updated_at: new Date() },
      { name: 'Super Jump', type: 'special', effect_value: 30, created_at: new Date(), updated_at: new Date() },
      { name: 'GPS', type: 'special', effect_value: 30, created_at: new Date(), updated_at: new Date() },
      { name: 'Eavesdropping', type: 'special', effect_value: 30, created_at: new Date(), updated_at: new Date() },
      { name: 'Lock On', type: 'special', effect_value: 30, created_at: new Date(), updated_at: new Date() },
      { name: 'Time Stop', type: 'special', effect_value: 30, created_at: new Date(), updated_at: new Date() },
      { name: 'Bomb', type: 'special', effect_value: 30, created_at: new Date(), updated_at: new Date() }
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_abilities');
  },
};
