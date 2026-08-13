const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const StudyTask = require('../models/StudyTask');

// Helper to auto-mark overdue tasks
const markOverdueTasks = async (userId) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  await StudyTask.updateMany(
    {
      userId,
      date: { $lt: startOfToday },
      status: 'pending',
    },
    {
      status: 'overdue',
    }
  );
};

// @desc    Get complete real-data dashboard analytics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    await markOverdueTasks(userId);

    // 1. Fetch active exam
    const exam = await Exam.findOne({ userId }).sort({ createdAt: -1 });
    if (!exam) {
      return res.json({
        success: true,
        data: {
          hasExam: false,
          message: 'No exam found. Please complete onboarding.',
        },
      });
    }

    // 2. Exam Countdown
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(exam.examDate);
    targetDate.setHours(0, 0, 0, 0);

    const timeDiff = targetDate.getTime() - today.getTime();
    const daysRemaining = Math.max(Math.ceil(timeDiff / (1000 * 3600 * 24)), 0);

    // 3. Fetch all tasks for this exam
    const tasks = await StudyTask.find({ userId, examId: exam._id })
      .populate('subjectId', 'name difficulty')
      .populate('topicId', 'name difficulty estimatedHours masteryPercentage')
      .sort({ date: 1, startTime: 1 });

    const totalTasks = tasks.length;
    const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
    const pendingTasksCount = tasks.filter((t) => t.status === 'pending' || t.status === 'overdue').length;
    const overallProgress = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

    // 4. Today's Study Hours & Today's Plan
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayTasks = tasks.filter((t) => {
      const taskDate = new Date(t.date);
      return taskDate >= startOfToday && taskDate <= endOfToday;
    });

    const todayHoursScheduled = todayTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const todayHoursCompleted = todayTasks
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + (t.duration || 0), 0);

    // 5. Weekly Study Hours & Breakdown
    const dayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Start on Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyBreakdownMap = {};
    dayNames.forEach((day) => {
      weeklyBreakdownMap[day] = { day, completedHours: 0, scheduledHours: 0 };
    });

    let weeklyStudyHours = 0;
    tasks.forEach((t) => {
      const taskDate = new Date(t.date);
      if (taskDate >= startOfWeek && taskDate <= endOfWeek) {
        const dName = dayNames[taskDate.getDay()];
        weeklyBreakdownMap[dName].scheduledHours += t.duration || 0;
        if (t.status === 'completed') {
          weeklyBreakdownMap[dName].completedHours += t.duration || 0;
          weeklyStudyHours += t.duration || 0;
        }
      }
    });

    const weeklyBreakdown = dayNames.map((d) => weeklyBreakdownMap[d]);

    // 6. Calculate Current Streak
    const completedTasks = tasks
      .filter((t) => t.status === 'completed' && t.completedAt)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    let currentStreak = 0;
    if (completedTasks.length > 0) {
      const uniqueDates = new Set();
      completedTasks.forEach((t) => {
        const dStr = new Date(t.completedAt).toISOString().split('T')[0];
        uniqueDates.add(dStr);
      });

      const sortedDates = Array.from(uniqueDates).sort().reverse();
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      let checkStr = checkDate.toISOString().split('T')[0];
      // If no tasks completed today, check if streak continued from yesterday
      if (!sortedDates.includes(checkStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
        checkStr = checkDate.toISOString().split('T')[0];
      }

      while (sortedDates.includes(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
        checkStr = checkDate.toISOString().split('T')[0];
      }
    }

    // 7. Subject Progress Breakdown for Recharts
    const subjects = await Subject.find({ examId: exam._id, userId });
    const subjectProgress = await Promise.all(
      subjects.map(async (sub) => {
        const subTopics = await Topic.find({ subjectId: sub._id });
        const subTasks = tasks.filter((t) => t.subjectId?._id?.toString() === sub._id.toString());
        const totalSubTasks = subTasks.length;
        const completedSubTasks = subTasks.filter((t) => t.status === 'completed').length;
        const progressPercent = totalSubTasks > 0 ? Math.round((completedSubTasks / totalSubTasks) * 100) : 0;
        const totalHours = subTasks.reduce((sum, t) => sum + (t.duration || 0), 0);

        return {
          subjectId: sub._id,
          name: sub.name,
          difficulty: sub.difficulty,
          totalTopics: subTopics.length,
          totalTasks: totalSubTasks,
          completedTasks: completedSubTasks,
          progressPercent,
          totalHours,
        };
      })
    );

    // 8. Identify Weak Topics
    // Topics with low mastery percentage (<50%) OR hard difficulty topics with pending/overdue tasks
    const allTopics = await Topic.find({ subjectId: { $in: subjects.map((s) => s._id) } }).populate('subjectId', 'name difficulty');
    const weakTopics = [];

    allTopics.forEach((t) => {
      const topicTasks = tasks.filter((tk) => tk.topicId?._id?.toString() === t._id.toString());
      const hasPendingHardTask = t.subjectId?.difficulty === 'hard' && topicTasks.some((tk) => tk.status === 'pending' || tk.status === 'overdue');
      const lowMastery = t.masteryPercentage < 50;

      if (lowMastery || hasPendingHardTask) {
        weakTopics.push({
          topicId: t._id,
          name: t.name,
          subjectName: t.subjectId?.name || 'Subject',
          difficulty: t.difficulty || t.subjectId?.difficulty || 'medium',
          masteryPercentage: t.masteryPercentage || 0,
          estimatedHours: t.estimatedHours,
        });
      }
    });

    return res.json({
      success: true,
      data: {
        hasExam: true,
        exam: {
          _id: exam._id,
          name: exam.name,
          examDate: exam.examDate,
          targetScore: exam.targetScore,
          dailyStudyHours: exam.dailyStudyHours,
        },
        daysRemaining,
        overallProgress,
        todayStudyHours: {
          completed: todayHoursCompleted,
          scheduled: todayHoursScheduled,
          limit: exam.dailyStudyHours,
        },
        weeklyStudyHours,
        weeklyBreakdown,
        completedTasksCount,
        pendingTasksCount,
        currentStreak,
        subjectProgress,
        weakTopics: weakTopics.slice(0, 5), // Return top 5 weak topics
        todayStudyPlan: todayTasks,
      },
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error fetching dashboard stats' });
  }
};

module.exports = {
  getDashboardStats,
};
