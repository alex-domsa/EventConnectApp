const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

/**
 * Search Router
 * Handles all search and filter operations for events
 */

//GET /api/search - Search events with query parameeters
router.get('/', searchController.searchEvents);

// gets events by club id
router.get('/events/:id', searchController.getEventByClubId);

//GET /api/search/tags - Get all available tags
router.get('/tags', searchController.getAllTags);

//GET /api/search/clubs - Get all clubs
router.get('/clubs', searchController.getAllClubs);

//GET /api/search/clubs/id - Get club by passed in id
router.get('/clubs/:id', searchController.getClubById);


//POST /api/search/advanced - Advanced filtering with request body
router.post('/advanced', searchController.advancedFilter);

module.exports = router;