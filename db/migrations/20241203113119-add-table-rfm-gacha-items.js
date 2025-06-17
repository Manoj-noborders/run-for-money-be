'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rfm_gacha_items', {
      id: {
        type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false,
      },
      gacha_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'rfm_gachas', key: 'id', },
      },
      ability_id: {
        type: Sequelize.INTEGER, allowNull: false, references: { model: 'rfm_abilities', key: 'id', },
      },
      boost_value: {
        type: Sequelize.INTEGER, allowNull: true,
      },
      description: {
        type: Sequelize.TEXT, allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.DATE,
      },
    });

    // Fetch the IDs of the basic abilities from the rfm_abilities table
    const abilities = await queryInterface.sequelize.query(
      `SELECT id, name FROM rfm_abilities WHERE type = 'basic';`
    );
    const params_gacha = await queryInterface.sequelize.query(
      `SELECT id FROM rfm_gachas WHERE name = 'parameter';`
    );
    const paramGachaId = params_gacha[0][0].id;
    const abilityIds = abilities[0];

    // Insert entries for each basic ability into the rfm_gacha_items table
    const gachaItems = abilityIds.map(ability => ({
      ability_id: ability.id,
      gacha_id: paramGachaId,
      boost_value: 1, // Random boost value between 1 and 10
      description: `${ability.name} boost item`,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await queryInterface.bulkInsert('rfm_gacha_items', gachaItems, {});

    // Fetch the IDs of the advanced abilities from the rfm_abilities table
    const advancedAbilities = await queryInterface.sequelize.query(
      `SELECT id, name FROM rfm_abilities WHERE type = 'special';`
    );
    const special_gacha = await queryInterface.sequelize.query(
      `SELECT id FROM rfm_gachas WHERE name = 'skills';`
    );
    const spclgachaId = special_gacha[0][0].id;

    const advancedAbilityIds = advancedAbilities[0];

    // Insert entries for each advanced ability into the rfm_gacha_items table
    const specialGachaItems = advancedAbilityIds.map(ability => ({
      ability_id: ability.id,
      gacha_id: spclgachaId,
      boost_value: 1, // Random boost value between 1 and 10
      description: `${ability.name} boost item`,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await queryInterface.bulkInsert('rfm_gacha_items', specialGachaItems, {});

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('rfm_gacha_items');
  },
};
