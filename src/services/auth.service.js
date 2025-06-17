const jwt = require('jsonwebtoken');
const config = require('../config');
module.exports = {
  async issueJwtToken(payload) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: 3600 * 24 * 7 }); // 7 days expiration
  },
  async issueJwtFiveMinutesToken(payload) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: 300 }); // 5 min expiration
  },
  async verifyJwtToken(token, cb) {
    // console.info(token, "---token---11")
    // console.info(config.jwtSecret, "---config.jwtSecret---12")
    // console.info(cb, "---cb---13")
    jwt.verify(token, config.jwtSecret, {}, cb);
  }
};
