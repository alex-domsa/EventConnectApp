const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const clientID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const callbackURL = (process.env.GOOGLE_CALLBACK_URL || `${(process.env.BACKEND_URL || 'http://localhost:5000').trim()}/api/auth/google/callback`).trim();

if (!clientID || !clientSecret) {
  console.warn('Google OAuth not configured: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable Google login.');
} else {
  passport.use(new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      let user = await User.findOne({ email });
      if (!user) {
        // generate a random password and store its bcrypt hash so Mongoose validation passes
        const randomPwd = crypto.randomBytes(16).toString('hex');
        const hash = await bcrypt.hash(randomPwd, 12);

        user = await User.create({
          email,
          displayName: profile.displayName,
          photoURL: profile.photos?.[0]?.value,
          password: hash
        });
      }
      done(null, { id: user._id, email: user.email, displayName: user.displayName, isAdmin: user.isAdmin });
    } catch (err) {
      done(err);
    }
  }));
}

// passport serialize/deserialize (safe to keep even if strategy not added)
passport.serializeUser((user, done) => done(null, user && user.id ? user.id : user));
passport.deserializeUser((id, done) => { done(null, id); });

module.exports = passport;