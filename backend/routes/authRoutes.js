// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const authController = require('../controllers/authController');

// standard auth endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// start Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // CHANGED: include isSuperAdmin, isAdmin, adminOf in OAuth token
    const payload = {                               // CHANGED block
      userId: req.user.id,
      email: req.user.email,
      isSuperAdmin: !!req.user.isSuperAdmin,        // NEW
      isAdmin: !!req.user.isAdmin,
      adminOf: req.user.adminOf || [],
    };

    const token = jwt.sign(
      payload,
      (process.env.JWT_SECRET || 'devsecret').trim(),
      { expiresIn: '7d' }
    );

    console.log('OAuth callback succeeded for user:', req.user.email || req.user.id);
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
    const redirectUrl = `${frontend}/oauth-callback#token=${encodeURIComponent(
      token
    )}`;
    console.log('Redirecting to frontend token URL:', redirectUrl);

    return res.redirect(redirectUrl);
  }
);

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader ? authHeader.split(' ')[1] : null;
    const token = tokenFromHeader || (req.cookies && req.cookies.token);

    if (!token) return res.status(401).json({ error: 'No token' });

    let payload;
    try {
      payload = jwt.verify(token, (process.env.JWT_SECRET || 'devsecret').trim());
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await User.findById(payload.userId).select('-password -passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ user });
  } catch (err) {
    console.error('/api/auth/me error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
