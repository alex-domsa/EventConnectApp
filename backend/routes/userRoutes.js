const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const requireAuth = require('../middleware/auth'); // existing auth middleware

// PATCH /api/user/favorites
router.patch('/favorites', requireAuth, userController.updateFavorites);

// GET /api/user/favorites  → returns the user's saved events
router.get('/favorites', requireAuth, userController.getFavorites);


module.exports = router;