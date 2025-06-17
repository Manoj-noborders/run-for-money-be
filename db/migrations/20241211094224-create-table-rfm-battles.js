'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_battles', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false, },
      hunter_ids: { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: false },
      runner_ids: { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: false },
      room_id: { type: Sequelize.STRING, allowNull: true },
      league_id: { type: Sequelize.INTEGER, allowNull: true },
      start_date: { type: Sequelize.DATE, allowNull: false },
      end_date: { type: Sequelize.DATE, allowNull: true },
      winning_team: { type: Sequelize.STRING, allowNull: true, validate: { isIn: [['hunter', 'runner', 'force_end']] } },
      is_draw: { type: Sequelize.BOOLEAN, allowNull: true },
      has_ended: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      participation_fee_each: { type: Sequelize.FLOAT, allowNull: false },
      total_participation_fee: { type: Sequelize.FLOAT, allowNull: false },
      total_reward: { type: Sequelize.FLOAT, allowNull: true },
      results: { type: Sequelize.JSONB, allowNull: true },
      season_id: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_battles');
  }
};
