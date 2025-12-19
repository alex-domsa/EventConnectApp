// backend/models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // NEW: Super admin flag
    // - can edit ANY event/club
    // - can assign/remove club admins
    isSuperAdmin: {                         // NEW
      type: Boolean,
      default: false,
    },

    // NEW: Regular club admin flag
    // - has admin powers ONLY for clubs in adminOf[]
    isAdmin: {                              // CHANGED (meaning)
      type: Boolean,
      default: false,
    },

    // List of club IDs this user is an admin of
    // (bi-directional with Club.admins[])
    adminOf: {                              // CHANGED ref
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Club',
      default: [],
    },

    // Clubs the user is a member of (no admin powers)
    memberOf: {                             // CHANGED ref
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Club',
      default: [],
    },

    // Favourited events
    favoritedEvents: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Event',
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
