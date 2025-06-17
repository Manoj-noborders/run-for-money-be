'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_gachas', {
      id: {
        type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
      },
      name: {
        type: Sequelize.STRING, allowNull: false,
      },
      description: {
        type: Sequelize.TEXT, allowNull: true,
      },
      cost_gold: {
        type: Sequelize.DECIMAL, allowNull: false, defaultValue: 1000,
      },
      cost_fiat: {
        type: Sequelize.DECIMAL, allowNull: false, defaultValue: 10,
      },
      cost_token: {
        type: Sequelize.DECIMAL, allowNull: false, defaultValue: 0,
      },
      base_mean: {
        type: Sequelize.INTEGER, allowNull: true,
      },
      standard_deviation: {
        type: Sequelize.DECIMAL, allowNull: true,
      },
      scale_factor: {
        type: Sequelize.DECIMAL, allowNull: true,
      },
      growth_rate: {
        type: Sequelize.DECIMAL, allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW
      }
    });

    // Insert entries for each gacha item into the rfm_gachas table
    const gachaItems = [
      {
        name: 'parameter',
        description: 'Gacha for parameters',
        cost_gold: 8000,
        cost_fiat: 0.3,
        cost_token: -1, // not available via token
        standard_deviation: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'items',
        description: 'Gacha for items',
        cost_gold: 8000,
        cost_fiat: 0.3,
        cost_token: -1, // not available via token
        scale_factor: 1,
        growth_rate: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'skills',
        description: 'Gacha for skills',
        cost_gold: -1,  // means its not available via gold
        cost_fiat: 1,
        cost_token: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('rfm_gachas', gachaItems, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_gachas');
  }
};
