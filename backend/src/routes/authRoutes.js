const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google-login', async (req, res) => {
  try {
    const { credential } = req.body;
   
    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // Check if user exists in DB, else create new
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = new User({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      });
      await user.save();
    }

    // Create our own JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Set token in HttpOnly Cookie (Industry Standard!)
    res.cookie('token', token, {
      httpOnly: true, // Browser JS cannot access this cookie (Protects from XSS)
      secure: process.env.NODE_ENV === 'production', // Only over HTTPS in production
      sameSite: 'lax', 
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ success: false, message: 'Authentication failed' });
  }
});

// Logout Route - Clears the cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;