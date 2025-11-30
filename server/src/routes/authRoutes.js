const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/callback', authController.airtableCallback);

module.exports = router;