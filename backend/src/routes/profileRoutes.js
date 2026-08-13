const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile,
  addSubject,
  updateSubject,
  deleteSubject,
  addTopic,
  updateTopic,
  deleteTopic,
} = require('../controllers/profileController');

// All routes require authentication
router.use(protect);

// Profile Management Endpoints
router.route('/').get(getProfile).patch(updateProfile);

// Subject CRUD Endpoints
router.route('/subjects').post(addSubject);
router.route('/subjects/:id').patch(updateSubject).delete(deleteSubject);

// Topic CRUD Endpoints
router.route('/subjects/:subjectId/topics').post(addTopic);
router.route('/topics/:id').patch(updateTopic).delete(deleteTopic);

module.exports = router;
