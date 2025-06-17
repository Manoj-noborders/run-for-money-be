'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_user_skills', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false, },
      skill_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'rfm_skills', key: 'id' } },
      acquired_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    }, {}).then(() => {
      queryInterface.addConstraint('rfm_user_skills', {
        fields: ['user_id', 'skill_id'],
        type: 'unique',
        name: 'unique_user_skill'
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_user_skills');
  }
};
