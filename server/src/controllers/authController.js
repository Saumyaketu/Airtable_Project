const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const clientId = process.env.AIRTABLE_CLIENT_ID;
const clientSecret = process.env.AIRTABLE_CLIENT_SECRET;

exports.airtableCallback = async (req, res) => {
  const { code, codeVerifier } = req.body;
  
  if (!code || !codeVerifier) return res.status(400).json({ error: "Missing code or verifier" });

  try {

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await axios.post('https://www.airtable.com/oauth2/v1/token', 
      new URLSearchParams({
        code,
        redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    const userRes = await axios.get('https://api.airtable.com/v0/meta/whoami', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { id: airtableId, email } = userRes.data;

    const user = await User.findOneAndUpdate(
      { airtableId },
      { 
        email, 
        accessToken: access_token, 
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000)
      },
      { new: true, upsert: true }
    );

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user });

  } catch (error) {
    console.error("Auth Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Authentication failed" });
  }
};