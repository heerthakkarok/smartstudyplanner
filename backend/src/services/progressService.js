const cron = require('node-cron');
const User = require('../models/User');
const Exam = require('../models/Exam');
const StudyTask = require('../models/StudyTask');
const Quiz = require('../models/Quiz');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const { sendMonthlyReportEmail } = require('./emailService');

const compileUserMonthlyReport = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const tasks = await StudyTask.find({
    userId,
    date: { $gte: thirtyDaysAgo },
  }).populate('subjectId', 'name').populate('topicId', 'name');

  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const missedTasksCount = tasks.filter((t) => t.status === 'missed' || t.status === 'overdue').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;
  const totalStudyHours = tasks
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (t.duration || 0), 0);

  const quizzes = await Quiz.find({
    userId,
    completedAt: { $gte: thirtyDaysAgo },
  });

  const totalAccuracy = quizzes.reduce((sum, q) => sum + (q.accuracy || 0), 0);
  const avgQuizScore = quizzes.length > 0 ? Math.round(totalAccuracy / quizzes.length) : 0;

  // Weak topics calculation
  const topics = await Topic.find({});
  const weakTopics = [];
  topics.forEach((t) => {
    if (t.masteryPercentage < 50) {
      weakTopics.push({ name: t.name, subjectName: 'Subject' });
    }
  });

  return {
    userName: user.name,
    userEmail: user.email,
    totalStudyHours,
    totalTasks,
    completedTasksCount,
    missedTasksCount,
    completionRate,
    avgQuizScore,
    studyStreak: 5,
    weakTopics: weakTopics.slice(0, 3),
  };
};

const sendMonthlyProgressReportsToAllUsers = async () => {
  console.log('[CRON JOB] Starting Monthly Progress Report Generation...');
  try {
    const users = await User.find({ isOnboarded: true });
    for (const user of users) {
      const report = await compileUserMonthlyReport(user._id);
      if (report) {
        await sendMonthlyReportEmail(user.email, user.name, report);
      }
    }
    console.log(`[CRON JOB] Completed sending monthly reports to ${users.length} users.`);
  } catch (error) {
    console.error('[CRON JOB ERROR] Failed sending monthly progress reports:', error.message);
  }
};

// Schedule cron job to run at 00:00 on the 1st of every month
const initMonthlyReportCron = () => {
  cron.schedule('0 0 1 * *', async () => {
    await sendMonthlyProgressReportsToAllUsers();
  });
  console.log('[CRON SERVICE] Monthly Report Cron Job Scheduled.');
};

module.exports = {
  compileUserMonthlyReport,
  sendMonthlyProgressReportsToAllUsers,
  initMonthlyReportCron,
};
