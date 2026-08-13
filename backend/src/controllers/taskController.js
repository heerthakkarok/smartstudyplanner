const StudyTask = require('../models/StudyTask');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const User = require('../models/User');
const {
  generateStudyPlanAlgorithm,
  adaptStudyPlanAlgorithm,
  timeToMinutes,
  minutesToTimeStr,
} = require('../services/plannerService');
const { generateStudyPlanPDF } = require('../services/pdfService');

// @desc    Generate a new Study Plan
// @route   POST /api/study-plan/generate
// @access  Private
const generatePlan = async (req, res) => {
  try {
    const { examId } = req.body;
    let targetExamId = examId;

    if (!targetExamId) {
      const activeExam = await Exam.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      if (!activeExam) {
        return res.status(404).json({ success: false, message: 'No active exam found. Please complete onboarding first.' });
      }
      targetExamId = activeExam._id;
    }

    const planResult = await generateStudyPlanAlgorithm(req.user._id, targetExamId);

    return res.status(201).json({
      success: true,
      message: 'Study plan generated successfully',
      data: planResult,
    });
  } catch (error) {
    console.error('Generate Plan Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to generate study plan' });
  }
};

// @desc    Adapt Study Plan ("I Fell Behind")
// @route   POST /api/study-plan/adapt
// @access  Private
const adaptPlan = async (req, res) => {
  try {
    const { examId } = req.body;
    let targetExamId = examId;

    if (!targetExamId) {
      const activeExam = await Exam.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
      if (!activeExam) {
        return res.status(404).json({ success: false, message: 'No active exam found.' });
      }
      targetExamId = activeExam._id;
    }

    const adaptResult = await adaptStudyPlanAlgorithm(req.user._id, targetExamId);

    return res.json({
      success: true,
      message: 'Study plan adapted successfully based on missed tasks & quiz performance',
      data: adaptResult,
    });
  } catch (error) {
    console.error('Adapt Plan Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to adapt study plan' });
  }
};

// @desc    Get complete study plan tasks
// @route   GET /api/study-plan
// @access  Private
const getStudyPlan = async (req, res) => {
  try {
    const tasks = await StudyTask.find({ userId: req.user._id })
      .populate('subjectId', 'name difficulty')
      .populate('topicId', 'name difficulty estimatedHours')
      .sort({ date: 1, startTime: 1 });

    return res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error('Get Study Plan Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch study plan' });
  }
};

// @desc    Download Study Plan as PDF
// @route   GET /api/study-plan/pdf
// @access  Private
const downloadPDF = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const exam = await Exam.findOne({ userId: req.user._id }).sort({ createdAt: -1 });

    if (!exam) {
      return res.status(404).json({ success: false, message: 'No active exam found to export PDF.' });
    }

    const subjects = await Subject.find({ examId: exam._id, userId: req.user._id });
    const tasks = await StudyTask.find({ userId: req.user._id, examId: exam._id })
      .populate('subjectId', 'name')
      .populate('topicId', 'name')
      .sort({ date: 1, startTime: 1 });

    const pdfBuffer = await generateStudyPlanPDF(user, exam, subjects, tasks);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="smart_study_plan_${exam.name.toLowerCase().replace(/\s+/g, '_')}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Download PDF Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to generate PDF document' });
  }
};

// @desc    Get Today's Tasks
// @route   GET /api/tasks/today
// @access  Private
const getTodayTasks = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await StudyTask.find({
      userId: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('subjectId', 'name difficulty')
      .populate('topicId', 'name difficulty')
      .sort({ startTime: 1 });

    return res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error('Get Today Tasks Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch today tasks' });
  }
};

// @desc    Get Upcoming Tasks
// @route   GET /api/tasks/upcoming
// @access  Private
const getUpcomingTasks = async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tasks = await StudyTask.find({
      userId: req.user._id,
      date: { $gte: tomorrow },
    })
      .populate('subjectId', 'name difficulty')
      .populate('topicId', 'name difficulty')
      .sort({ date: 1, startTime: 1 })
      .limit(20);

    return res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error('Get Upcoming Tasks Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch upcoming tasks' });
  }
};

// @desc    Get Overdue Tasks
// @route   GET /api/tasks/overdue
// @access  Private
const getOverdueTasks = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const tasks = await StudyTask.find({
      userId: req.user._id,
      date: { $lt: startOfToday },
      status: { $in: ['pending', 'overdue', 'missed'] },
    })
      .populate('subjectId', 'name')
      .populate('topicId', 'name')
      .sort({ date: 1 });

    return res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error('Get Overdue Tasks Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch overdue tasks' });
  }
};

// @desc    Update Task Status
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'completed', 'missed', 'overdue'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid task status' });
    }

    const task = await StudyTask.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.status = status;
    await task.save();

    return res.json({
      success: true,
      message: `Task status updated to ${status}`,
      data: task,
    });
  } catch (error) {
    console.error('Update Task Status Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update task status' });
  }
};

// @desc    Edit Study Task (Date, Start Time, Duration, Priority) with Overlap Validation
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const { date, startTime, duration, priority, subjectId, topicId } = req.body;

    const task = await StudyTask.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const targetDate = date ? new Date(date) : task.date;
    const targetStartTime = startTime || task.startTime;
    const targetDuration = duration ? Number(duration) : task.duration;

    if (targetDuration <= 0) {
      return res.status(400).json({ success: false, message: 'Duration must be greater than 0 hours' });
    }

    // Check overlap with other tasks on targetDate (excluding current task)
    const targetStartMins = timeToMinutes(targetStartTime);
    const targetEndMins = targetStartMins + targetDuration * 60;

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sameDayTasks = await StudyTask.find({
      userId: req.user._id,
      _id: { $ne: task._id },
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    for (const other of sameDayTasks) {
      const otherStartMins = timeToMinutes(other.startTime);
      const otherEndMins = otherStartMins + (other.duration || 1) * 60;

      if (
        (targetStartMins >= otherStartMins && targetStartMins < otherEndMins) ||
        (targetEndMins > otherStartMins && targetEndMins <= otherEndMins) ||
        (targetStartMins <= otherStartMins && targetEndMins >= otherEndMins)
      ) {
        return res.status(400).json({
          success: false,
          message: `Time Overlap Conflict: The updated time (${targetStartTime} - ${minutesToTimeStr(
            targetEndMins
          )}) overlaps with another task starting at ${other.startTime}. Please choose a non-overlapping time slot.`,
        });
      }
    }

    if (date) task.date = targetDate;
    if (startTime) task.startTime = targetStartTime;
    if (duration) task.duration = targetDuration;
    if (priority) task.priority = priority;
    if (subjectId) task.subjectId = subjectId;
    if (topicId) task.topicId = topicId;

    await task.save();

    const populatedTask = await StudyTask.findById(task._id)
      .populate('subjectId', 'name')
      .populate('topicId', 'name');

    return res.json({
      success: true,
      message: 'Study task updated successfully',
      data: populatedTask,
    });
  } catch (error) {
    console.error('Update Task Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update study task' });
  }
};

// @desc    Delete Task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await StudyTask.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    return res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete Task Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete task' });
  }
};

module.exports = {
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
};
