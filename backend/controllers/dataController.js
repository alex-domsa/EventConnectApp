// backend/controllers/dataController.js
const mongoose = require('mongoose');
const Data = require('../models/data');
const User = require('../models/user');
const { s3Client, BUCKET, REGION } = require('../config/spaces');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Compute deleteAt date (midnight of the next day after the provided date)
 * Accepts ISO strings, dd/mm/yyyy, mm/dd/yyyy, Date objects.
 * Returns a Date or null.
 */
function computeDeleteAt(dateInput) {
  if (!dateInput) return null;

  let d = null;

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    d = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  } else if (typeof dateInput === 'string') {
    // try ISO parse first
    const iso = new Date(dateInput);
    if (!isNaN(iso.getTime())) {
      d = new Date(iso.getFullYear(), iso.getMonth(), iso.getDate());
    } else {
      // try common day/month/year separators
      const sep = dateInput.includes('/') ? '/' : dateInput.includes('-') ? '-' : null;
      if (sep) {
        const parts = dateInput.split(sep).map((p) => p.trim());
        if (parts.length === 3) {
          let p0 = parseInt(parts[0], 10);
          let p1 = parseInt(parts[1], 10);
          let p2 = parseInt(parts[2], 10);
          if (isNaN(p0) || isNaN(p1) || isNaN(p2)) {
            d = null;
          } else {
            let day, month, year;
            // Heuristics: if first > 12 assume dd/mm/yyyy, else if second > 12 assume mm/dd/yyyy
            if (p0 > 12) {
              day = p0; month = p1; year = p2;
            } else if (p1 > 12) {
              day = p1; month = p0; year = p2;
            } else {
              // assume dd/mm/yyyy
              day = p0; month = p1; year = p2;
            }
            if (year < 100) year += 2000;
            d = new Date(year, month - 1, day);
            if (isNaN(d.getTime())) d = null;
          }
        }
      }
    }
  } else if (typeof dateInput === 'object' && dateInput !== null) {
    // handle Mongo-ish shapes like { $date: "..." } or { $oid: ... } (ignore $oid)
    if (dateInput.$date) {
      const maybe = new Date(dateInput.$date);
      if (!isNaN(maybe.getTime())) d = new Date(maybe.getFullYear(), maybe.getMonth(), maybe.getDate());
    } else if (dateInput.toString) {
      try {
        const maybe = new Date(String(dateInput));
        if (!isNaN(maybe.getTime())) d = new Date(maybe.getFullYear(), maybe.getMonth(), maybe.getDate());
      } catch {}
    }
  }

  if (!d) return null;

  // set to midnight of next day (local time)
  const deleteAt = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
  return deleteAt;
}

// GET all events
exports.getAllData = async (req, res) => {
  try {
    const events = await Data.aggregate([
      {
        $lookup: {
          from: 'clubs',
          localField: 'clubId',
          foreignField: '_id',
          as: 'club',
        },
      },
      {
        $unwind: {
          path: '$club',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    res.status(200).json(events);
  } catch (error) {
    console.error('getAllData error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET a single event by ID (with club lookup)
exports.getDataById = async (req, res) => {
  try {
    const [event] = await Data.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.id) },
      },
      {
        $lookup: {
          from: 'clubs',
          localField: 'clubId',
          foreignField: '_id',
          as: 'club',
        },
      },
      {
        $unwind: {
          path: '$club',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    return res.status(200).json(event);
  } catch (error) {
    console.error('getDataById error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// UPDATE an existing event (secured by roles)
exports.updateData = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const event = await Data.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const user = req.user;

    // CHANGED: use isSuperAdmin + isAdmin + adminOf
    const isSuperAdmin = !!user.isSuperAdmin;                 // NEW
    const isClubAdmin = !!user.isAdmin;                       // NEW

    const eventClubId = event.clubId ? event.clubId.toString() : null;
    const adminOfClubs = Array.isArray(user.adminOf)
      ? user.adminOf.map((c) => c.toString())
      : [];

    const isClubAdminForThisEvent =
      isClubAdmin && eventClubId && adminOfClubs.includes(eventClubId); // CHANGED

    const canEdit = isSuperAdmin || isClubAdminForThisEvent;            // CHANGED

    if (!canEdit) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to edit this event' });
    }

    // apply requested updates
    Object.assign(event, req.body);

    // recompute deleteAt from the event.date (use updated value if provided)
    const newDeleteAt = computeDeleteAt(event.date);
    if (newDeleteAt) {
      event.deleteAt = newDeleteAt;
    } else if (req.body.date === null || req.body.date === '') {
      // explicit clearing of date -> clear deleteAt
      event.deleteAt = null;
    }

    const updatedEvent = await event.save();

    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('updateData error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Upload to DigitalOcean Spaces and return a public URL
exports.generatePresignUrl = async (req, res) => {
  console.log('presign hit');
  try {
    const file = req.file;
    const filename = `${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    const publicUrl = `https://${BUCKET}.${REGION}.digitaloceanspaces.com/${filename}`;
    res.json({ publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Upload failed' });
  }
};

// Simple event creation (unchanged)
exports.createData = async (req, res) => {
  try {
    const payload = { ...(req.body || {}) };

    // compute deleteAt based on provided date (if any)
    const deleteAt = computeDeleteAt(payload.date);
    if (deleteAt) payload.deleteAt = deleteAt;

    const newEvent = await Data.create(payload);
    res.status(201).json({ success: true, data: newEvent });
  } catch (err) {
    console.error('createData error:', err);
    res
      .status(500)
      .json({ success: false, error: 'Failed to create event' });
  }
};

// Legacy AddEvent (unchanged)
exports.AddEvent = async (req, res) => {
  try {
    const {
      eventName,
      date,
      startTime,
      endTime,
      location,
      description,
      RSVPNeeded = false,
      tags = [],
      muLifeLink = '',
    } = req.body;

    if (!eventName || !date || !startTime || !endTime || !location || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const fallbackId = new mongoose.Types.ObjectId();

    const doc = await Data.add({
      eventName,
      date,
      startTime,
      endTime,
      RSVPNeeded: !!RSVPNeeded,
      location,
      description,
      tags: Array.isArray(tags) ? tags : [],
      muLifeLink,
      addedBy: fallbackId,
      lastUpdatedBy: fallbackId,
      clubId: fallbackId,
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error('AddEvent error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// DELETE an event (secured by roles)
exports.deleteData = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    // validate id
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event id' });
    }

    const event = await Data.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const user = req.user;
    const isSuperAdmin = !!user.isSuperAdmin;
    const isClubAdmin = !!user.isAdmin;

    const eventClubId = event.clubId ? String(event.clubId) : null;
    const adminOfClubs = Array.isArray(user.adminOf)
      ? user.adminOf.map((c) => String(c))
      : [];

    const isClubAdminForThisEvent =
      isClubAdmin && eventClubId && adminOfClubs.includes(eventClubId);

    const canDelete = isSuperAdmin || isClubAdminForThisEvent;

    if (!canDelete) {
      return res.status(403).json({ message: 'You are not allowed to delete this event' });
    }

    // perform delete
    await Data.findByIdAndDelete(id);

    // cleanup: remove references from users' favoritedEvents
    try {
      const eventObjId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
      await User.updateMany(
        { favoritedEvents: eventObjId },
        { $pull: { favoritedEvents: eventObjId } }
      );
    } catch (cleanupErr) {
      // non-fatal: log and continue
      console.warn('Failed to cleanup favorites for deleted event', cleanupErr);
    }

    return res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('deleteData error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};
