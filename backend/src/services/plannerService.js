const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const StudyTask = require('../models/StudyTask');
const User = require('../models/User');

const getDifficultyMultiplier = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'hard':
      return 1.5;
    case 'medium':
      return 1.2;
    case 'easy':
    default:
      return 1.0;
  }
};

// Convert HH:MM string to minutes from 00:00
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 480; // default 08:00
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Convert minutes to HH:MM string
const minutesToTimeStr = (totalMins) => {
  const normalizedMins = (totalMins + 1440) % 1440;
  const h = Math.floor(normalizedMins / 60);
  const m = normalizedMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Get non-overlapping minute windows for selected preferences
const getPreferenceMinuteWindows = (preferredTimes) => {
  const list = Array.isArray(preferredTimes) && preferredTimes.length > 0 ? preferredTimes : ['evening'];
  const windows = [];

  list.forEach((pref) => {
    switch (pref.toLowerCase()) {
      case 'morning':
        windows.push({ start: 8 * 60, end: 12 * 60 }); // 08:00 - 12:00
        break;
      case 'afternoon':
        windows.push({ start: 13 * 60, end: 17 * 60 }); // 13:00 - 17:00
        break;
      case 'evening':
        windows.push({ start: 18 * 60, end: 22 * 60 }); // 18:00 - 22:00
        break;
      case 'night':
        windows.push({ start: 22 * 60, end: 26 * 60 }); // 22:00 - 02:00
        break;
    }
  });

  // Sort windows chronologically
  windows.sort((a, b) => a.start - b.start);
  return windows.length > 0 ? windows : [{ start: 18 * 60, end: 22 * 60 }];
};

// Timetable Validator enforcing zero overlaps and daily hour limit
const validateTimetable = (scheduledTasks, dailyLimit) => {
  const tasksByDate = {};
  scheduledTasks.forEach((t) => {
    const dStr = new Date(t.date).toISOString().split('T')[0];
    if (!tasksByDate[dStr]) tasksByDate[dStr] = [];
    tasksByDate[dStr].push(t);
  });

  for (const [dStr, dayTasks] of Object.entries(tasksByDate)) {
    // Sort tasks by start time minutes
    dayTasks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    let dayTotalMins = 0;
    for (let i = 0; i < dayTasks.length; i++) {
      const taskStart = timeToMinutes(dayTasks[i].startTime);
      const taskDurationMins = (dayTasks[i].duration || 1) * 60;
      const taskEnd = taskStart + taskDurationMins;

      dayTotalMins += taskDurationMins;

      // Check overlap with next task
      if (i < dayTasks.length - 1) {
        const nextStart = timeToMinutes(dayTasks[i + 1].startTime);
        if (nextStart < taskEnd) {
          throw new Error(
            `Scheduling Overlap Error on ${dStr}: Task starting at ${dayTasks[i + 1].startTime} overlaps with previous task ending at ${minutesToTimeStr(taskEnd)}.`
          );
        }
      }
    }

    if (dayTotalMins > dailyLimit * 60) {
      throw new Error(`Daily limit exceeded on ${dStr}: Scheduled ${dayTotalMins / 60}h exceeds limit of ${dailyLimit}h.`);
    }
  }

  return true;
};

// Non-Overlapping Scheduling Engine
const scheduleTasksChronologically = (taskItems, dailyLimit, prefWindows, startDate) => {
  const scheduledTasks = [];
  let currentDayOffset = 0;
  let dayHoursScheduled = 0;
  let currentWindowIdx = 0;
  let currentPointerMins = prefWindows[0].start;

  for (const item of taskItems) {
    const itemMins = (item.duration || 1) * 60;

    // Check if daily limit exceeded or window overflow
    if (
      dayHoursScheduled + item.duration > dailyLimit ||
      currentPointerMins + itemMins > prefWindows[currentWindowIdx].end
    ) {
      // Try next window on same day if available
      if (currentWindowIdx < prefWindows.length - 1) {
        currentWindowIdx++;
        currentPointerMins = Math.max(currentPointerMins, prefWindows[currentWindowIdx].start);
      } else {
        // Move to next day
        currentDayOffset++;
        dayHoursScheduled = 0;
        currentWindowIdx = 0;
        currentPointerMins = prefWindows[0].start;
      }
    }

    // Double check window fit after day/window shift
    if (currentPointerMins + itemMins > prefWindows[currentWindowIdx].end) {
      currentPointerMins = prefWindows[currentWindowIdx].start;
    }

    const taskDate = new Date(startDate);
    taskDate.setDate(startDate.getDate() + currentDayOffset);
    const startTimeStr = minutesToTimeStr(currentPointerMins);

    scheduledTasks.push({
      subjectId: item.subjectId,
      topicId: item.topicId,
      date: taskDate,
      startTime: startTimeStr,
      duration: item.duration,
      priority: item.priority,
      status: 'pending',
    });

    dayHoursScheduled += item.duration;
    currentPointerMins += itemMins; // NO OVERLAP! Next task starts after previous ends.
  }

  return scheduledTasks;
};

const generateStudyPlanAlgorithm = async (userId, examId) => {
  const user = await User.findById(userId);
  const exam = await Exam.findOne({ _id: examId, userId });

  if (!exam) {
    throw new Error('Exam not found');
  }

  const dailyLimit = exam.dailyStudyHours || user.dailyStudyHours || 4;
  const preferredTimes = exam.preferredStudyTimes?.length > 0
    ? exam.preferredStudyTimes
    : user.preferredStudyTimes?.length > 0
    ? user.preferredStudyTimes
    : ['evening'];
  const prefWindows = getPreferenceMinuteWindows(preferredTimes);

  const subjects = await Subject.find({ examId: exam._id, userId });
  if (subjects.length === 0) {
    throw new Error('No subjects found for this exam. Please add subjects first.');
  }

  const subjectMap = {};
  subjects.forEach((sub) => {
    subjectMap[sub._id.toString()] = sub;
  });

  const subjectIds = subjects.map((sub) => sub._id);
  const topics = await Topic.find({ subjectId: { $in: subjectIds } });

  if (topics.length === 0) {
    throw new Error('No topics found for the subjects. Please add topics first.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(exam.examDate);
  targetDate.setHours(0, 0, 0, 0);
  const timeDiff = targetDate.getTime() - today.getTime();
  const daysAvailable = Math.max(Math.ceil(timeDiff / (1000 * 3600 * 24)), 1);

  const processedTopics = topics.map((topic) => {
    const parentSubject = subjectMap[topic.subjectId.toString()];
    const subMult = getDifficultyMultiplier(parentSubject?.difficulty);
    const topMult = getDifficultyMultiplier(topic.difficulty);
    const weightedScore = (topic.estimatedHours || 2) * subMult * topMult;

    let priority = 'medium';
    if (weightedScore >= 5 || topic.difficulty === 'hard' || parentSubject?.difficulty === 'hard') {
      priority = 'high';
    } else if (weightedScore <= 2.5 && topic.difficulty === 'easy') {
      priority = 'low';
    }

    return {
      topicId: topic._id,
      subjectId: topic.subjectId,
      name: topic.name,
      estimatedHours: topic.estimatedHours || 2,
      weightedScore,
      priority,
    };
  });

  processedTopics.sort((a, b) => b.weightedScore - a.weightedScore);

  const taskItems = [];
  processedTopics.forEach((item) => {
    let hoursRemaining = item.estimatedHours;
    while (hoursRemaining > 0) {
      const duration = hoursRemaining >= 2 ? 2 : hoursRemaining;
      taskItems.push({
        subjectId: item.subjectId,
        topicId: item.topicId,
        duration,
        priority: item.priority,
      });
      hoursRemaining -= duration;
    }
  });

  await StudyTask.deleteMany({ examId: exam._id, userId, status: 'pending' });

  const scheduledTasks = scheduleTasksChronologically(taskItems, dailyLimit, prefWindows, today);
  
  // Attach userId and examId
  const finalTasks = scheduledTasks.map((t) => ({ ...t, userId, examId: exam._id }));

  // Validate Timetable for zero overlaps
  validateTimetable(finalTasks, dailyLimit);

  const createdTasks = await StudyTask.insertMany(finalTasks);

  return {
    examId: exam._id,
    daysAvailable,
    totalTasks: createdTasks.length,
    tasks: createdTasks,
  };
};

const adaptStudyPlanAlgorithm = async (userId, examId) => {
  const user = await User.findById(userId);
  const exam = await Exam.findOne({ _id: examId, userId });

  if (!exam) {
    throw new Error('Exam not found');
  }

  const dailyLimit = exam.dailyStudyHours || user.dailyStudyHours || 4;
  const preferredTimes = exam.preferredStudyTimes?.length > 0
    ? exam.preferredStudyTimes
    : user.preferredStudyTimes?.length > 0
    ? user.preferredStudyTimes
    : ['evening'];
  const prefWindows = getPreferenceMinuteWindows(preferredTimes);

  const oldTasksRaw = await StudyTask.find({ userId, examId: exam._id })
    .populate('subjectId', 'name difficulty')
    .populate('topicId', 'name difficulty')
    .sort({ date: 1, startTime: 1 });

  const oldPlanSnapshot = oldTasksRaw.map((t) => ({
    taskId: t._id,
    subjectName: t.subjectId?.name || 'Subject',
    topicName: t.topicId?.name || 'Topic',
    date: t.date,
    startTime: t.startTime,
    duration: t.duration,
    priority: t.priority,
    status: t.status,
  }));

  const Quiz = require('../models/Quiz');
  const userQuizzes = await Quiz.find({ userId });
  const topicQuizMap = {};

  userQuizzes.forEach((q) => {
    const tId = q.topicId?.toString();
    if (tId) {
      if (!topicQuizMap[tId]) topicQuizMap[tId] = { totalAccuracy: 0, count: 0 };
      topicQuizMap[tId].totalAccuracy += q.accuracy || 0;
      topicQuizMap[tId].count++;
    }
  });

  const subjects = await Subject.find({ examId: exam._id, userId });
  const subjectMap = {};
  subjects.forEach((sub) => {
    subjectMap[sub._id.toString()] = sub;
  });

  const topics = await Topic.find({ subjectId: { $in: subjects.map((s) => s._id) } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(exam.examDate);
  targetDate.setHours(0, 0, 0, 0);
  const daysAvailable = Math.max(Math.ceil((targetDate - today) / (1000 * 3600 * 24)), 1);

  const processedTopics = topics.map((topic) => {
    const parentSubject = subjectMap[topic.subjectId.toString()];
    const subMult = getDifficultyMultiplier(parentSubject?.difficulty);
    const topMult = getDifficultyMultiplier(topic.difficulty);
    let weightedScore = (topic.estimatedHours || 2) * subMult * topMult;

    const qStats = topicQuizMap[topic._id.toString()];
    let quizAvgAccuracy = 100;
    if (qStats && qStats.count > 0) {
      quizAvgAccuracy = Math.round(qStats.totalAccuracy / qStats.count);
    }

    let extraHours = 0;
    if (quizAvgAccuracy < 60 || (topic.masteryPercentage && topic.masteryPercentage < 50)) {
      weightedScore *= 1.5;
      extraHours = 1;
    }

    const completedTopicTasks = oldTasksRaw.filter(
      (t) => t.topicId?._id?.toString() === topic._id.toString() && t.status === 'completed'
    );
    const completedHours = completedTopicTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const neededHours = Math.max((topic.estimatedHours || 2) + extraHours - completedHours, 1);

    let priority = 'medium';
    if (weightedScore >= 5 || topic.difficulty === 'hard' || quizAvgAccuracy < 60) {
      priority = 'high';
    } else if (weightedScore <= 2.5 && topic.difficulty === 'easy') {
      priority = 'low';
    }

    return {
      topicId: topic._id,
      subjectId: topic.subjectId,
      subjectName: parentSubject?.name || 'Subject',
      topicName: topic.name,
      neededHours,
      weightedScore,
      priority,
    };
  });

  processedTopics.sort((a, b) => b.weightedScore - a.weightedScore);

  const taskItems = [];
  processedTopics.forEach((item) => {
    let hoursRemaining = item.neededHours;
    while (hoursRemaining > 0) {
      const duration = hoursRemaining >= 2 ? 2 : hoursRemaining;
      taskItems.push({
        subjectId: item.subjectId,
        topicId: item.topicId,
        subjectName: item.subjectName,
        topicName: item.topicName,
        duration,
        priority: item.priority,
      });
      hoursRemaining -= duration;
    }
  });

  await StudyTask.deleteMany({
    examId: exam._id,
    userId,
    status: { $in: ['pending', 'missed', 'overdue'] },
  });

  const scheduledTasks = scheduleTasksChronologically(taskItems, dailyLimit, prefWindows, today);
  const finalTasks = scheduledTasks.map((t) => ({ ...t, userId, examId: exam._id }));

  validateTimetable(finalTasks, dailyLimit);

  const newTasksCreated = await StudyTask.insertMany(finalTasks);

  const newPlanSnapshot = newTasksCreated.map((t, idx) => ({
    taskId: t._id,
    subjectName: taskItems[idx]?.subjectName || 'Subject',
    topicName: taskItems[idx]?.topicName || 'Topic',
    date: t.date,
    startTime: t.startTime,
    duration: t.duration,
    priority: t.priority,
    status: t.status,
  }));

  return {
    examId: exam._id,
    daysAvailable,
    oldPlan: oldPlanSnapshot,
    newPlan: newPlanSnapshot,
    totalAdaptedTasks: newTasksCreated.length,
  };
};

module.exports = {
  generateStudyPlanAlgorithm,
  adaptStudyPlanAlgorithm,
  validateTimetable,
  timeToMinutes,
  minutesToTimeStr,
};
