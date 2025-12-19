// backend/routes/clubRoutes.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const clubController = require('../controllers/clubController');

//  Fetch all users (super admin)
router.get('/users/all', requireAuth, clubController.getAllUsers);

//  Assign admin
router.post('/add-admin', requireAuth, clubController.addAdminToClub);

//  Remove admin
router.post('/remove-admin', requireAuth, clubController.removeAdminFromClub);

//  Fetch admins for this club
router.get('/:clubId/admins', requireAuth, clubController.getClubAdmins);



// GET /api/clubs/admin
// returns { clubs: [ { _id, name } ] } for clubs the user administers/owns
router.get('/admin', clubController.adminClubs);

// POST /api/clubs/:id/join
// joins the user to the club
router.post('/:id/join', clubController.joinClub);

// POST /api/clubs/:id/leave
// leaves the club (remove from user's memberOf array)
router.post('/:id/leave', clubController.leaveClub);

module.exports = router;

