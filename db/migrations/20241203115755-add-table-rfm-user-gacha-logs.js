'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_user_gacha_logs', {
      id: {
        type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id', },
      },
      gacha_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'rfm_gachas', key: 'id', },
      },
      gacha_ticket_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'rfm_user_gacha_tickets', key: 'id', },
      },
      is_applied: {
        type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false,
      },
      result: {
        type: Sequelize.JSONB, allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_user_gacha_logs');
  }
};
