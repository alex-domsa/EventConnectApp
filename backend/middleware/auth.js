// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // CHANGED: unify secret with authController & auth routes
    const secret = (process.env.JWT_SECRET || 'devsecret').trim(); // CHANGED
    const decoded = jwt.verify(token, secret);                     // CHANGED

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // attach full user doc to request
    req.user = user;
    next();
  } catch (err) {
    console.error('AUTH ERROR:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
