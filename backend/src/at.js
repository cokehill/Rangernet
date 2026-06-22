const AfricasTalking = require("africastalking");

const credentials = {
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
};

const AT = AfricasTalking(credentials);

module.exports = {
  sms: AT.SMS,
  airtime: AT.AIRTIME,
};
