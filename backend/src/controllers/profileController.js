const User = require('../models/User');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Quiz = require('../models/Quiz');

// @desc    Get complete User Profile, Study Preferences, Subjects, Topics & Quiz Analytics
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch User Profile
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Fetch Latest Active Exam
    const exam = await Exam.findOne({ userId }).sort({ createdAt: -1 });

    // 3. Fetch Subjects and nested Topics belonging to User
    const subjects = await Subject.find({ userId }).sort({ name: 1 });
    const subjectsWithTopics = await Promise.all(
      subjects.map(async (subject) => {
        const topics = await Topic.find({ subjectId: subject._id }).sort({ createdAt: 1 });
        return {
          ...subject.toObject(),
          topics,
        };
      })
    );

    // 4. Fetch All Completed Quizzes
    const quizzes = await Quiz.find({ userId })
      .populate('subjectId', 'name difficulty')
      .populate('topicId', 'name difficulty')
      .sort({ completedAt: -1 });

    // 5. Calculate Exact Quiz Analytics (Requirement 11)
    let totalQuestions = 0;
    let totalCorrect = 0;
    let bestQuiz = null;
    let highestAccuracy = -1;

    const subjectStatsMap = {}; // subjectId -> { name, totalQuestions, totalCorrect }

    quizzes.forEach((quiz) => {
      const qTotal = quiz.totalQuestions || 0;
      const qCorrect = quiz.score || 0;

      totalQuestions += qTotal;
      totalCorrect += qCorrect;

      // Track Best Quiz
      if (quiz.accuracy > highestAccuracy) {
        highestAccuracy = quiz.accuracy;
        bestQuiz = {
          quizId: quiz._id,
          subjectName: quiz.subjectId?.name || 'Subject',
          topicName: quiz.topicId?.name || 'Topic',
          accuracy: quiz.accuracy,
          completedAt: quiz.completedAt,
        };
      }

      // Track Subject Performance
      const subId = quiz.subjectId?._id?.toString() || 'unknown';
      const subName = quiz.subjectId?.name || 'General';
      if (!subjectStatsMap[subId]) {
        subjectStatsMap[subId] = {
          name: subName,
          totalQuestions: 0,
          totalCorrect: 0,
          totalQuizzes: 0,
        };
      }
      subjectStatsMap[subId].totalQuestions += qTotal;
      subjectStatsMap[subId].totalCorrect += qCorrect;
      subjectStatsMap[subId].totalQuizzes += 1;
    });

    const totalIncorrect = totalQuestions - totalCorrect;
    const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Calculate Subject-Wise Performance & Identify Weakest Subject
    let weakestSubject = null;
    let lowestSubAccuracy = 101;

    const subjectPerformance = Object.values(subjectStatsMap).map((sub) => {
      const accuracy = sub.totalQuestions > 0 ? Math.round((sub.totalCorrect / sub.totalQuestions) * 100) : 0;
      if (sub.totalQuizzes > 0 && accuracy < lowestSubAccuracy) {
        lowestSubAccuracy = accuracy;
        weakestSubject = {
          name: sub.name,
          accuracy,
          totalQuizzes: sub.totalQuizzes,
        };
      }
      return {
        name: sub.name,
        totalQuestions: sub.totalQuestions,
        totalCorrect: sub.totalCorrect,
        accuracy,
      };
    });

    return res.json({
      success: true,
      data: {
        user,
        exam,
        subjects: subjectsWithTopics,
        analytics: {
          totalQuizzes: quizzes.length,
          totalQuestions,
          totalCorrect,
          totalIncorrect,
          overallAccuracy, // Calculated via totalCorrect / totalQuestions * 100
          bestQuiz,
          weakestSubject,
          subjectPerformance,
        },
        quizHistory: quizzes.map((q) => ({
          _id: q._id,
          subjectName: q.subjectId?.name || 'Subject',
          topicName: q.topicId?.name || 'Topic',
          totalQuestions: q.totalQuestions,
          correctAnswers: q.score,
          incorrectAnswers: q.totalQuestions - q.score,
          score: q.score,
          percentage: q.accuracy,
          completedAt: q.completedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching profile' });
  }
};

// @desc    Update User Profile & Study Preferences
// @route   PATCH /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, dailyStudyHours, preferredStudyTimes, profileImage } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (profileImage !== undefined) updateFields.profileImage = profileImage;
    if (dailyStudyHours) updateFields.dailyStudyHours = Number(dailyStudyHours);
    if (preferredStudyTimes && Array.isArray(preferredStudyTimes)) {
      updateFields.preferredStudyTimes = preferredStudyTimes;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true }).select('-password');

    // Also update active Exam model preferences if exam exists
    if (dailyStudyHours || preferredStudyTimes) {
      await Exam.updateMany(
        { userId },
        {
          ...(dailyStudyHours && { dailyStudyHours: Number(dailyStudyHours) }),
          ...(preferredStudyTimes && { preferredStudyTimes }),
        }
      );
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error updating profile' });
  }
};

// @desc    Add a new Subject for user
// @route   POST /api/subjects
// @access  Private
const addSubject = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, difficulty = 'medium' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required' });
    }

    // Find active exam for user or create default if needed
    let exam = await Exam.findOne({ userId }).sort({ createdAt: -1 });
    if (!exam) {
      exam = await Exam.create({
        userId,
        name: 'General Study Exam',
        examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        targetScore: 90,
        dailyStudyHours: req.user.dailyStudyHours || 4,
        preferredStudyTimes: req.user.preferredStudyTimes || ['evening'],
      });
    }

    const subject = await Subject.create({
      userId,
      examId: exam._id,
      name: name.trim(),
      difficulty,
    });

    return res.status(201).json({
      success: true,
      message: 'Subject added successfully',
      data: {
        ...subject.toObject(),
        topics: [],
      },
    });
  } catch (error) {
    console.error('Add Subject Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error adding subject' });
  }
};

// @desc    Update Subject
// @route   PATCH /api/subjects/:id
// @access  Private
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, difficulty } = req.body;

    const subject = await Subject.findOne({ _id: id, userId: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    if (name) subject.name = name.trim();
    if (difficulty) subject.difficulty = difficulty;
    await subject.save();

    const topics = await Topic.find({ subjectId: subject._id });

    return res.json({
      success: true,
      message: 'Subject updated successfully',
      data: {
        ...subject.toObject(),
        topics,
      },
    });
  } catch (error) {
    console.error('Update Subject Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error updating subject' });
  }
};

// @desc    Delete Subject & nested Topics
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findOne({ _id: id, userId: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Delete associated topics
    await Topic.deleteMany({ subjectId: subject._id });

    // Delete subject
    await Subject.findByIdAndDelete(subject._id);

    return res.json({
      success: true,
      message: 'Subject and associated topics deleted successfully',
      subjectId: id,
    });
  } catch (error) {
    console.error('Delete Subject Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting subject' });
  }
};

// @desc    Add Topic under a Subject
// @route   POST /api/subjects/:subjectId/topics
// @access  Private
const addTopic = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { name, difficulty, estimatedHours } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Topic name is required' });
    }

    const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const topic = await Topic.create({
      subjectId: subject._id,
      name: name.trim(),
      difficulty: difficulty || subject.difficulty,
      estimatedHours: Number(estimatedHours) || 2,
      masteryPercentage: 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Topic added successfully',
      data: topic,
    });
  } catch (error) {
    console.error('Add Topic Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error adding topic' });
  }
};

// @desc    Update Topic
// @route   PATCH /api/topics/:id
// @access  Private
const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, difficulty, estimatedHours } = req.body;

    const topic = await Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    // Verify subject ownership
    const subject = await Subject.findOne({ _id: topic.subjectId, userId: req.user._id });
    if (!subject) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this topic' });
    }

    if (name) topic.name = name.trim();
    if (difficulty) topic.difficulty = difficulty;
    if (estimatedHours) topic.estimatedHours = Number(estimatedHours);

    await topic.save();

    return res.json({
      success: true,
      message: 'Topic updated successfully',
      data: topic,
    });
  } catch (error) {
    console.error('Update Topic Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error updating topic' });
  }
};

// @desc    Delete Topic
// @route   DELETE /api/topics/:id
// @access  Private
const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const subject = await Subject.findOne({ _id: topic.subjectId, userId: req.user._id });
    if (!subject) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this topic' });
    }

    await Topic.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: 'Topic deleted successfully',
      topicId: id,
      subjectId: subject._id,
    });
  } catch (error) {
    console.error('Delete Topic Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error deleting topic' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  addSubject,
  updateSubject,
  deleteSubject,
  addTopic,
  updateTopic,
  deleteTopic,
};
