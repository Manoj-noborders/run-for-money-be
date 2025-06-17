const axios = require('axios');
const config = require('../config');

const notifyOnSlack = async (currentBalance) => {
  const webhookUrl = config.rfm_slack_webhook;
  const message = `Warning: Insufficient balance! Your account balance (${currentBalance}) is below the minimum required amount. Please ensure you have enough funds to continue using the service.`;
  const payload = { text: message };
  await axios
    .post(webhookUrl, payload)
    .then((resp) => {
      console.log(`[SUCCESS] Successfully notified on slack at: ${new Date()}\n`);
    })
    .catch((err) => {
      console.log("[ERROR] Couldn't notify on slack:", err, '\n');
    });
};

module.exports = { notifyOnSlack };
