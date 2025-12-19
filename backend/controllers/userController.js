const mongoose = require('mongoose');
const User = require('../models/user');

exports.updateFavorites = async (req, res) => {
  try {
    const { eventId, action } = req.body;
    if (!eventId || !['add', 'remove'].includes(action)) {
      return res.status(400).json({ error: 'eventId and action ("add" or "remove") are required' });
    }

    const uid = req.user && (req.user._id || req.user.id);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    // sanitize eventId -> ObjectId if valid, otherwise keep as string
    let eid = eventId;
    try {
      // handle payloads like { $oid: "..." }
      if (eventId && typeof eventId === 'object' && eventId.$oid) {
        eid = new mongoose.Types.ObjectId(String(eventId.$oid));
      } else if (typeof eventId === 'string' && mongoose.isValidObjectId(eventId)) {
        eid = new mongoose.Types.ObjectId(eventId);
      }
      // otherwise leave as-is (string) and Mongo will cast if schema expects ObjectId
    } catch (e) {
      console.warn('Failed to coerce eventId to ObjectId, using raw value', e);
      eid = eventId;
    }

    const update = action === 'add'
      ? { $addToSet: { favoritedEvents: eid } }
      : { $pull: { favoritedEvents: eid } };

    const user = await User.findByIdAndUpdate(uid, update, { new: true }).select('-password -passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ success: true, user });
  } catch (err) {
    console.error('updateFavorites error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const uid = req.user && (req.user._id || req.user.id);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    // Load user + populate event details
    const user = await User.findById(uid)
      .populate("favoritedEvents")   // <--- important
      .select("-password -passwordHash");

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json(user.favoritedEvents);
  } catch (err) {
    console.error("getFavorites error:", err);
    return res.status(500).json({ error: "Server error loading favorites" });
  }
};