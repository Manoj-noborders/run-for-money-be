const chalk = require('chalk');
const { logger } = require('../winston');

function dbLogger(logStr, execTime, opts) {
  if (!opts) {
    opts = execTime;
    execTime = undefined;
  }
  const junk1 = logStr.indexOf('CREATE TABLE IF NOT EXISTS');
  const junk2 = logStr.indexOf('SELECT i.relname AS name, ix.indisprimary');
  if (junk1 === -1 && junk2 === -1) {
    // if (logStr.indexOf('UPDATE') !== -1) {
    //   logger.sql(chalk.yellow(logStr));
    // } else if (logStr.indexOf('SELECT') !== -1) {
    //   logger.sql(chalk.blue(logStr));
    // } else if (logStr.indexOf('INSERT') !== -1) {
    //   logger.sql(chalk.green(logStr));
    // } else if (logStr.indexOf('DELETE') !== -1) {
    //   logger.sql(chalk.red(logStr));
    // } else {
    // console.info(JSON.stringify({ level: 'sql', message: logStr }));
    // logger.info({ level: 'sql'}, logStr);
    // logger.sql(chalk.white(logStr));
    // }
    console.info(logStr);
  }
}

module.exports = dbLogger;
