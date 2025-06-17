'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_user_gacha_levels', {
      id: {
        type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' },
      },
      gacha_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'rfm_gachas', key: 'id' },
      },
      level: {
        type: Sequelize.INTEGER, allowNull: false, defaultValue: 0,
      },
      counter: {
        type: Sequelize.INTEGER, allowNull: false, defaultValue: 0,
      },
      spins_to_next: {
        type: Sequelize.INTEGER, allowNull: false, defaultValue: 1,
      },
      created_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.DATE,
      },

    });

    await queryInterface.addConstraint('rfm_user_gacha_levels', {
      fields: ['user_id', 'gacha_id'],
      type: 'unique',
      name: 'unique_user_gacha_levels',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_user_gacha_levels');
  }
};
