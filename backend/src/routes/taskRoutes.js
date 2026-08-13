const express = require('express');
const router = express.Router();
const {
  generatePlan,
  adaptPlan,
  getTodayTasks,
  getUpcomingTasks,
  getOverdueTasks,
  getStudyPlan,
  downloadPDF,
  updateTaskStatus,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Study Plan Routes
router.post('/study-plan/generate', protect, generatePlan);
router.post('/study-plan/adapt', protect, adaptPlan);
router.get('/study-plan', protect, getStudyPlan);
router.get('/study-plan/pdf', protect, downloadPDF);

// Task Routes
router.get('/tasks/today', protect, getTodayTasks);
router.get('/tasks/upcoming', protect, getUpcomingTasks);
router.get('/tasks/overdue', protect, getOverdueTasks);
router.put('/tasks/:id/status', protect, updateTaskStatus);
router.put('/tasks/:id', protect, updateTask);
router.delete('/tasks/:id', protect, deleteTask);

module.exports = router;
