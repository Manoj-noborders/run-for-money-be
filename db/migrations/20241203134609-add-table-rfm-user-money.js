'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_user_money', {
      id: {
        type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id', },
      },
      gold: {
        type: Sequelize.DECIMAL, allowNull: false, defaultValue: 60000,
      },
      run_token: {
        type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0,
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
    await queryInterface.dropTable('rfm_user_money');
  }
};
