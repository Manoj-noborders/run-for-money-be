const sequelize = require('sequelize');
const config = require('../config');
const path = require('path');
const dbLogger = require('./db.logger');
const normalizedPath = require('path').join(__dirname, '../models/model');
const bulkupdate = require('./sqlz.bulkUpdate');

bulkupdate(sequelize);

console.log(normalizedPath)

let db = new sequelize(config.db.database, config.db.user, config.db.password, {
  replication: {
    read: {
      host: config.db.db_host_reader
    },
    write: {
      host: config.db.db_host_writer
    }
  },
  port: config.db.port,
  dialect: 'postgres',
  pool: {
    max: config.db.max,
    min: 0,
    idle: config.db.idleTimeoutMillis
  },
  storage: path.join(process.cwd(), 'db', 'database.sqlite'),
  logging: dbLogger
});

const models = {};
require('fs').readdirSync(normalizedPath).forEach((file) => {
  if (file.indexOf('.js') >= 0) {
    const model = require(`${normalizedPath}/${file}`);
    if (typeof model === 'function') {
      models[file.replace('.js', '')] = model(db, sequelize);
    }
  }
});

db.models = models;
db.Sequelize = sequelize;

module.exports = db;
