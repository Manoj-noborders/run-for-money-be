const database = require('./database.js');
const fs = require('fs');
const sequelize = require('sequelize');
const normalizedPath = require('path').join(__dirname, '../models/model');
let models = {};
fs.readdirSync(normalizedPath).forEach((file) => {
  if (file.indexOf('.js') >= 0) {
    models[file.replace('.js', '')] = require(`${normalizedPath}/${file}`)(database, sequelize);
  }
});
const dbService = {
  authenticateDB() {
    return database.authenticate();
  },
  // dropDB = () => database.drop();

  syncDB() {
    return database
      .sync()
      .then((res) => {
        console.info('[****   Database Sync Done...!!!   ***]');
      })
      .catch((error) => {
        console.error(error);
      });
  },

  async successfulDBStart() {
    console.info('connection to the database has been established successfully');
  },

  async errorDBStart(err) {
    console.info('unable to connect to the database:', err);
    console.info('Error staring the server. Database connection not established');
  },

  async startMigrateTrue() {
    try {
      this.syncDB();
      await this.successfulDBStart();
    } catch (err) {
      this.errorDBStart(err);
    }
  },

  async startProd() {
    try {
      await this.authenticateDB();
      await this.startMigrateTrue();
    } catch (err) {
      this.errorDBStart(err);
    }
  },

  async start() {
    await this.startProd();
  },

  async close(time) {
    console.info('******  Draining database pool  ********');
    setTimeout(async () => await database.close(), time);
    // await database.close();
  }
};

module.exports = dbService;
