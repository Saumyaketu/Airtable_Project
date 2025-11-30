const Form = require('../models/Form');
const Response = require('../models/Response');

exports.handleWebhook = async (req, res) => {
  console.log("Webhook received:", req.body);
  res.status(200).send('OK');
};