'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_battle_logs', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      battle_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'rfm_battles', key: 'id' }, // Foreign key to battles tableonDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, // Foreign key to users tableonDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('hunter', 'runner'), allowNull: false
      },
      caught_runners: {
        type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: true, defaultValue: null // For hunters
      },
      is_caught: {
        type: Sequelize.BOOLEAN, allowNull: true, // For runners
      },
      time_survived: {
        type: Sequelize.INTEGER, allowNull: true, // In seconds, for runners
      },
      gold_earned: {
        type: Sequelize.FLOAT, allowNull: true
      },
      team_reward: {
        type: Sequelize.FLOAT, allowNull: true
      },
      participation_fee_deducted: {
        type: Sequelize.FLOAT, allowNull: true
      },
      created_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW
      },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_battle_logs');
  }
};
