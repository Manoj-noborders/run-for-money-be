'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_inapp_items', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false, },
      name: { type: Sequelize.STRING, allowNull: false, },
      description: { type: Sequelize.STRING, allowNull: false, },
      image: { type: Sequelize.STRING, allowNull: false, },
      cost_gold: { type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0 },
      cost_fiat: { type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0 },
      cost_token: { type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW, },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW, },
    });


    const inappItems = [{
      name: 'parameter',
      description: 'Gacha for parameters',
      image: 'parameter.png',
      cost_gold: 8000,
      cost_fiat: 0.3,
      cost_token: -1, // not available via token
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'items',
      description: 'Gacha for items',
      image: 'items.png',
      cost_gold: 8000,
      cost_fiat: 0.3,
      cost_token: -1, // not available via token
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'skills',
      description: 'Gacha for skills',
      image: 'skills.png',
      cost_gold: 8000,
      cost_fiat: 0.3,
      cost_token: -1, // not available via token
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'sneakers',
      description: 'Gacha for sneakers',
      image: 'sneakers.png',
      cost_gold: 8000,
      cost_fiat: 0.3,
      cost_token: -1, // not available via token
      created_at: new Date(),
      updated_at: new Date()
    }]

    await queryInterface.bulkInsert('rfm_inapp_items', inappItems, {});

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_inapp_items');
  }
};
