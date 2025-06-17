'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_user_gacha_tickets', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false, },
      user_id: { type: Sequelize.INTEGER, allowNull: false, },
      gacha_id: { type: Sequelize.INTEGER, allowNull: false, },
      purchase_id: { type: Sequelize.INTEGER, allowNull: false, },
      used_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW, },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW, },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_user_gacha_tickets');
  }
};
