// backend/controllers/clubController.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');
const Club = require('../models/club');



// GET clubs the current user admins (via token)
async function adminClubs(req, res) {
  try {
    console.log('[clubs.adminClubs] request received');
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader ? authHeader.split(' ')[1] : null;
    const token = tokenFromHeader || (req.cookies && req.cookies.token);
    if (!token) {
      console.log('[clubs.adminClubs] no token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    let payload;
    try {
      payload = jwt.verify(
        token,
        (process.env.JWT_SECRET || 'devsecret').trim()
      );
    } catch (err) {
      console.log('[clubs.adminClubs] token verification failed');
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = payload.userId || payload.user || payload.id;
    if (!userId) {
      console.log('[clubs.adminClubs] invalid token payload');
      return res.status(400).json({ error: 'Invalid token payload' });
    }

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const candidateFields = [
      'clubIds',
      'clubs',
      'adminClubs',
      'adminOf',
      'managedClubs',
      'organisations',
      'organisationIds',
      'clubsManaged',
      'clubId',
      'adminOf',
    ];

    const ids = new Set();
    candidateFields.forEach((f) => {
      const v = user[f];
      if (!v) return;
      if (Array.isArray(v)) {
        v.forEach((x) => {
          if (x) ids.add(String(x));
        });
      } else if (typeof v === 'string' || typeof v === 'number') {
        ids.add(String(v));
      } else if (v && v._id) {
        ids.add(String(v._id));
      }
    });

    const idsArr = Array.from(ids);

    let ClubModel;
    try {
      ClubModel = require('../models/club');
    } catch (e) {
      console.error('Club model not found:', e.message);
      return res.status(500).json({ error: 'Club model missing on server' });
    }

    const query =
      idsArr.length > 0
        ? { $or: [{ _id: { $in: idsArr } }, { admins: userId }] }
        : { admins: userId };

    let clubs = await ClubModel.find(query)
      .select(
        '_id name title displayName shortName admins owner createdBy members'
      )
      .lean();

    if (!clubs || clubs.length === 0) {
      try {
        const userObjId = mongoose.Types.ObjectId.isValid(userId)
          ? new mongoose.Types.ObjectId(userId)
          : null;
        if (userObjId) {
          const clubs2 = await ClubModel.find({ admins: userObjId })
            .select('_id name')
            .lean();
          if (clubs2 && clubs2.length) clubs = clubs2;
        }
      } catch (e) {
        console.warn('[clubs.adminClubs] fallback ObjectId match error');
      }
    }

    const out = clubs.map((c) => ({
      _id: c._id,
      name:
        c.name || c.title || c.displayName || c.shortName || String(c._id),
    }));

    return res.json({ clubs: out });
  } catch (err) {
    console.error('/api/clubs/admin error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/clubs/:id/join
async function joinClub(req, res) {
  try {
    console.log('[clubs.joinClub] called');
    const clubIdRaw = req.params.id;
    if (!clubIdRaw) return res.status(400).json({ error: 'Missing club id' });
    const clubId = mongoose.Types.ObjectId.isValid(clubIdRaw)
      ? new mongoose.Types.ObjectId(clubIdRaw)
      : clubIdRaw;

    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader ? authHeader.split(' ')[1] : null;
    const token = tokenFromHeader || (req.cookies && req.cookies.token);
    if (!token) return res.status(401).json({ error: 'No token provided' });

    let payload;
    try {
      payload = jwt.verify(
        token,
        (process.env.JWT_SECRET || 'devsecret').trim()
      );
    } catch (err) {
      console.log('[clubs.joinClub] token verification failed');
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = payload.userId || payload.user || payload.id;
    if (!userId) return res.status(400).json({ error: 'Invalid token payload' });

    const update = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { memberOf: clubId } },
      { new: true, select: '-password' }
    ).lean();

    if (!update) return res.status(404).json({ error: 'User not found' });

    let ClubModel;
    try {
      ClubModel = require('../models/club');
    } catch (e) {
      ClubModel = null;
    }
    if (ClubModel) {
      try {
        await ClubModel.findByIdAndUpdate(
          clubId,
          { $addToSet: { members: userId }, $inc: { memberCount: 1 } },
          { new: true }
        );
      } catch (e) {
        console.warn('Club model update skipped/error');
      }
    }

    return res.json({ success: true, user: update });
  } catch (err) {
    console.error('/api/clubs/:id/join error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/clubs/:id/leave
async function leaveClub(req, res) {
  try {
    console.log('[clubs.leaveClub] called');
    const clubIdRaw = req.params.id;
    const clubId = mongoose.Types.ObjectId.isValid(clubIdRaw)
      ? new mongoose.Types.ObjectId(clubIdRaw)
      : clubIdRaw;

    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader ? authHeader.split(' ')[1] : null;
    const token = tokenFromHeader || (req.cookies && req.cookies.token);
    if (!token) return res.status(401).json({ error: 'No token provided' });

    let payload;
    try {
      payload = jwt.verify(
        token,
        (process.env.JWT_SECRET || 'devsecret').trim()
      );
    } catch (err) {
      console.log('[clubs.leaveClub] token verification failed');
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = payload.userId || payload.user || payload.id;
    if (!userId) return res.status(400).json({ error: 'Invalid token payload' });

    const update = await User.findByIdAndUpdate(
      userId,
      { $pull: { memberOf: clubId } },
      { new: true, select: '-password' }
    ).lean();

    if (!update) return res.status(404).json({ error: 'User not found' });

    let ClubModel;
    try {
      ClubModel = require('../models/club');
    } catch (e) {
      ClubModel = null;
    }
    if (ClubModel) {
      try {
        await ClubModel.findByIdAndUpdate(
          clubId,
          { $pull: { members: userId }, $inc: { memberCount: -1 } },
          { new: true }
        );
      } catch (e) {
        console.warn('Club model update skipped/error');
      }
    }

    return res.json({ success: true, user: update });
  } catch (err) {
    console.error('/api/clubs/:id/leave error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}



// ⭐ Add Admin to Club
async function addAdminToClub(req, res) {
  try {
    const { userEmail, clubId } = req.body;

    // now we use isSuperAdmin
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!userEmail || !clubId) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const user = await User.findOne({ email: userEmail.toLowerCase().trim() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: 'Club not found' });

    // ensure adminOf is an array
    if (!Array.isArray(user.adminOf)) {
      user.adminOf = [];
    }
    if (!user.adminOf.map((id) => String(id)).includes(String(club._id))) {
      user.adminOf.push(club._id);
      // mark as regular admin
      user.isAdmin = true;
      await user.save();
    }

    // ensure club.admins exists
    if (!Array.isArray(club.admins)) {
      club.admins = [];
    }
    if (!club.admins.map((id) => String(id)).includes(String(user._id))) {
      club.admins.push(user._id);
      await club.save();
    }

    res.json({
      success: true,
      message: `${user.email} is now an admin of ${club.name}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ⭐ Get all admins of a club
async function getClubAdmins(req, res) {
  try {
    const { clubId } = req.params;
    const club = await Club.findById(clubId).populate('admins', 'email');
    if (!club) return res.status(404).json({ error: 'Club not found' });

    res.json({ success: true, admins: club.admins });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ⭐ Remove Admin from Club
async function removeAdminFromClub(req, res) {
  try {
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { userId, clubId } = req.body;
    if (!userId || !clubId) {
      return res.status(400).json({ error: 'Missing userId or clubId' });
    }

    await Club.updateOne({ _id: clubId }, { $pull: { admins: userId } });
    await User.updateOne({ _id: userId }, { $pull: { adminOf: clubId } });

    res.json({ success: true, message: 'Admin removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// ⭐ Get All Users (for super admin dropdown)
async function getAllUsers(req, res) {
  try {
    if (!req.user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const users = await User.find({}, 'email isAdmin isSuperAdmin adminOf');
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  adminClubs,
  joinClub,
  leaveClub,
  addAdminToClub,
  getClubAdmins,
  removeAdminFromClub,
  getAllUsers,
};
