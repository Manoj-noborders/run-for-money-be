'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_gacha_reward_settings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, },
      gacha_id: { type: Sequelize.INTEGER, allowNull: false },
      quantity: { type: Sequelize.INTEGER, defaultValue: 1 },
      probability: { type: Sequelize.DECIMAL, defaultValue: 100 },
      is_guaranteed: { type: Sequelize.BOOLEAN, defaultValue: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // seed entries for all available gachas now
    const gachas = await queryInterface.sequelize.query('SELECT id FROM rfm_gachas', {
      type: Sequelize.QueryTypes.SELECT,
      raw: true,
    });

    const gachaRewardSettings = gachas.map(gacha => ({
      gacha_id: gacha.id,
      quantity: 1,
      probability: 100,
      is_guaranteed: false,
      is_active: true,
    }));

    await queryInterface.bulkInsert('rfm_gacha_reward_settings', gachaRewardSettings);

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_gacha_reward_settings');
  }
};
