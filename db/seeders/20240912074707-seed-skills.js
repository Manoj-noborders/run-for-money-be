'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('rfm_skills', [
      // Economy Skills
      {
        skill_name: 'Stamina Boost',
        category: 'ECONOMY',
        xp_required: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Quick Swap',
        category: 'ECONOMY',
        xp_required: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Resourcefulness',
        category: 'ECONOMY',
        xp_required: 1500,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Extended Vision',
        category: 'ECONOMY',
        xp_required: 1500,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Sprint Mastery',
        category: 'ECONOMY',
        xp_required: 4500,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Strategic Planning',
        category: 'ECONOMY',
        xp_required: 4500,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Efficiency Expert',
        category: 'ECONOMY',
        xp_required: 9000,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Economy Champion',
        category: 'ECONOMY',
        xp_required: 9000,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Defense Skills
      {
        skill_name: 'Easy Recovery',
        category: 'DEFENSE',

        xp_required: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Camouflage',
        category: 'DEFENSE',

        xp_required: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Fortification',
        category: 'DEFENSE',
        xp_required: 1500,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Silent Movement',
        category: 'DEFENSE',
        xp_required: 1500,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Stealth Master',
        category: 'DEFENSE',
        xp_required: 4500,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Trap Master',
        category: 'DEFENSE',
        xp_required: 4500,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Defensive Tactician',
        category: 'DEFENSE',
        xp_required: 9000,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Defense Champion',
        category: 'DEFENSE',
        xp_required: 9000,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Rush Skills
      {
        skill_name: 'Speed Burst',
        category: 'RUSH',

        xp_required: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Quick Reflexes',
        category: 'RUSH',

        xp_required: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Adrenaline Boost',
        category: 'RUSH',
        xp_required: 1500,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Aggressive Tactics',
        category: 'RUSH',
        xp_required: 1500,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'High Jumper',
        category: 'RUSH',
        xp_required: 4500,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Combat Mastery',
        category: 'RUSH',
        xp_required: 4500,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Rage Mode',
        category: 'RUSH',
        xp_required: 9000,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        skill_name: 'Rush Champion',
        category: 'RUSH',
        xp_required: 9000,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('rfm_skills', null, {});
  }
};
