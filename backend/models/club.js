const mongoose = require('mongoose');

/**
 * Club Schema
 * Represents a club/socirty in the DB
 * Each club can have multiple admins and events
 */
const clubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    admins: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: [],
    },
    logo: {
        type: String,
        default: 'ADD LATER',
    },
    gallery: {
        type: [String],
        default: [],
    },
}, {
   timestamps: true, // Adds createdAt and updatedAt 
});

module.exports = mongoose.model('Club', clubSchema);