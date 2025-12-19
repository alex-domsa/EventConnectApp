// backend/controllers/adminController.js
const User = require('../models/user');

// POST /api/admin/assign-club-admin
exports.assignClubAdmin = async (req, res) => {
  try {
    const actingUser = req.user; // set by requireAuth

    // CHANGED: Only superAdmins can assign club admins
    if (!actingUser || !actingUser.isSuperAdmin) { // CHANGED
      return res
        .status(403)
        .json({ message: 'Only superAdmins can assign club admins' });
    }

    const { email, clubId } = req.body;

    if (!email || !clubId) {
      return res
        .status(400)
        .json({ message: 'Both email and clubId are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentAdminOf = Array.isArray(user.adminOf)
      ? user.adminOf.map((id) => id.toString())
      : [];

    const clubIdStr = clubId.toString();

    if (!currentAdminOf.includes(clubIdStr)) {
      user.adminOf.push(clubId);
    }

    // CHANGED: make them a regular club admin
    user.isAdmin = true; // CHANGED

    await user.save();

    return res.status(200).json({
      message: `User ${user.email} is now an admin of club ${clubId}`,
      user: {
        id: user._id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin, // NEW
        isAdmin: user.isAdmin,
        adminOf: user.adminOf,
      },
    });
  } catch (err) {
    console.error('assignClubAdmin error:', err);
    res
      .status(500)
      .json({ message: 'Failed to assign club admin', error: err.message });
  }
};

// GET /api/admin/club-admins/:clubId   (list admins for a club)
exports.getClubAdmins = async (req, res) => { // NEW
  try {
    const actingUser = req.user;

    if (!actingUser || !actingUser.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: 'Only superAdmins can view club admins' });
    }

    const { clubId } = req.params;
    if (!clubId) {
      return res.status(400).json({ message: 'clubId is required' });
    }

    const admins = await User.find({ adminOf: clubId }).select(
      '_id email isAdmin isSuperAdmin adminOf'
    );

    return res.status(200).json({ admins }); // NEW
  } catch (err) {
    console.error('getClubAdmins error:', err);
    res
      .status(500)
      .json({ message: 'Failed to fetch club admins', error: err.message });
  }
};

// POST /api/admin/remove-club-admin
exports.removeClubAdmin = async (req, res) => { // NEW
  try {
    const actingUser = req.user;

    if (!actingUser || !actingUser.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: 'Only superAdmins can remove club admins' });
    }

    const { userId, clubId } = req.body;

    if (!userId || !clubId) {
      return res
        .status(400)
        .json({ message: 'userId and clubId are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.adminOf = (user.adminOf || []).filter(
      (id) => id.toString() !== clubId.toString()
    );

    // If they no longer admin ANY club, drop isAdmin flag
    if (user.adminOf.length === 0) {
      user.isAdmin = false;
    }

    await user.save();

    return res.status(200).json({
      message: `User ${user.email} is no longer an admin of club ${clubId}`,
      user: {
        id: user._id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
        isAdmin: user.isAdmin,
        adminOf: user.adminOf,
      },
    });
  } catch (err) {
    console.error('removeClubAdmin error:', err);
    res
      .status(500)
      .json({ message: 'Failed to remove club admin', error: err.message });
  }
};
