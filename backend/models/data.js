const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  RSVPNeeded: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  muLifeLink: {
    type: String,
  },
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'club',
    required: true,
  },
  image: {
    type: String,
    default: 'ADD LATER',
  },
  // TTL field: document will be removed by Mongo when deleteAt is reached
  deleteAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// TTL index: expire documents when deleteAt is reached
dataSchema.index({ deleteAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Data', dataSchema);