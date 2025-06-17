'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_game_settings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      interval_minutes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 30 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    },);


    await queryInterface.addIndex('rfm_game_settings', ['interval_minutes'], {
      name: 'rfm_game_settings_interval_minutes_index'
    });

    await queryInterface.sequelize.query(`
      INSERT INTO rfm_game_settings (interval_minutes, created_at, updated_at)
      VALUES (30, NOW(), NOW());
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_game_settings');
  }
};
