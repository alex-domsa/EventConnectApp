// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/auth');          // NEW
const adminController = require('../controllers/adminController');

// Assign a club admin
router.post(
  '/assign-club-admin',
  requireAuth,                          // NEW
  adminController.assignClubAdmin
);

// List admins for a club
router.get(
  '/club-admins/:clubId',
  requireAuth,                          // NEW
  adminController.getClubAdmins
);

// Remove a club admin
router.post(
  '/remove-club-admin',
  requireAuth,                          // NEW
  adminController.removeClubAdmin
);

module.exports = router;
