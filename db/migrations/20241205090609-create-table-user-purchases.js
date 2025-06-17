'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_user_purchases', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false, },
      user_id: { type: Sequelize.INTEGER, allowNull: false, },
      gacha_id: { type: Sequelize.INTEGER, allowNull: false, },
      txn_hash: { type: Sequelize.STRING, allowNull: true },
      cost: { type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0 },
      currency: { type: Sequelize.STRING, allowNull: false, },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW, },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW, },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_user_purchases');
  }
};
