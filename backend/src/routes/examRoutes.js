const express = require('express');
const router = express.Router();
const {
  createExam,
  getUserExams,
  getExamById,
  createSubject,
  addTopic,
  completeOnboarding,
} = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');

// Onboarding route
router.post('/onboarding', protect, completeOnboarding);

// Exam routes
router.route('/exams').post(protect, createExam).get(protect, getUserExams);
router.route('/exams/:id').get(protect, getExamById);

// Subject & Topic routes
router.post('/subjects', protect, createSubject);
router.post('/topics', protect, addTopic);

module.exports = router;
