const express = require('express');
const router = express.Router();
const {
  generateQuiz,
  submitQuiz,
  getQuizHistory,
  getAIRecommendations,
} = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

// Quiz Routes
router.post('/quiz/generate', protect, generateQuiz);
router.post('/quiz/submit', protect, submitQuiz);
router.get('/quiz/history', protect, getQuizHistory);

// AI Recommendations Route
router.get('/ai/recommendations', protect, getAIRecommendations);

module.exports = router;
