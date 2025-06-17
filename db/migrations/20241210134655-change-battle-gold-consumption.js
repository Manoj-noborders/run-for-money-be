'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE rfm_league_details
      SET "fuelConsumption" = 80000
      RETURNING *;
      `)
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE rfm_league_details
      SET "fuelConsumption" = 100
      RETURNING *;
      `
    );
  }
};
