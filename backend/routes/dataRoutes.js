// backend/routes/dataRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const dataController = require('../controllers/dataController');
const requireAuth = require('../middleware/auth'); // NEW

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/presign',
  upload.single('file'),
  dataController.generatePresignUrl
);

// Public: list + view events
router.get('/', dataController.getAllData);
router.get('/:id', dataController.getDataById);

// CHANGED: protect create & update so req.user is set
router.put('/:id', requireAuth, dataController.updateData); // CHANGED
router.post('/', requireAuth, dataController.createData);   // CHANGED

// NEW: delete event (only allowed for super-admin or club admin of the event)
router.delete('/:id', requireAuth, dataController.deleteData); // NEW

module.exports = router;
