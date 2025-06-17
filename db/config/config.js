// const { config } = require('../../config');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB,
    host: process.env.DB_HOST_WRITER,
    port: Number(process.env.DB_PORT),
    dialect: 'postgres',
    logging: true,
    force: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB,
    host: process.env.DB_HOST_WRITER,
    port: Number(process.env.DB_PORT),
    dialect: 'postgres',
    logging: true,
    force: false
  },
  local: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB,
    host: process.env.DB_HOST_WRITER,
    port: Number(process.env.DB_PORT),
    dialect: 'postgres',
    logging: true,
    force: false
  }
};
