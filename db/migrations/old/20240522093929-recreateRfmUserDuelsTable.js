'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the existing table if it exists
    await queryInterface.dropTable('rfm_user_duels');

    // Create a new table with modifications
    await queryInterface.createTable('rfm_user_duels', {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true, },
      userId: { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: false },
      opponentId: { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: false },
      battleId: { type: Sequelize.STRING, allowNull: false, unique: true },
      leagueId: { type: Sequelize.INTEGER, allowNull: false },
      duelStartDate: { type: Sequelize.DATE, allowNull: false },
      duelEndDate: { type: Sequelize.DATE, allowNull: true },
      winnerId: { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: true },
      loserId: { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: true },
      is_draw: { type: Sequelize.BOOLEAN, allowNull: true },
      has_ended: { type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      fuel_won: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
      fuel_win_percentage: { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 },
      seasonId: { type: Sequelize.INTEGER, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the changes in case of rollback
    console.log('It can not be reverted.')
    await queryInterface.dropTable('rfm_user_duels');
  },
};
