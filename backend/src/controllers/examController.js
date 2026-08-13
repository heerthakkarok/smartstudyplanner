const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const User = require('../models/User');
const {
  examSchema,
  subjectSchema,
  topicSchema,
  onboardingSchema,
  validateInput,
} = require('../utils/validation');

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private
const createExam = async (req, res) => {
  try {
    const { isValid, error, data } = validateInput(examSchema, req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    const exam = await Exam.create({
      userId: req.user._id,
      name: data.name,
      examDate: new Date(data.examDate),
      targetScore: data.targetScore || 90,
      dailyStudyHours: data.dailyStudyHours || req.user.dailyStudyHours || 4,
    });

    return res.status(201).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    console.error('Create Exam Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Get all exams for logged in user
// @route   GET /api/exams
// @access  Private
const getUserExams = async (req, res) => {
  try {
    const exams = await Exam.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: exams.length,
      data: exams,
    });
  } catch (error) {
    console.error('Get User Exams Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Get single exam details with subjects & topics
// @route   GET /api/exams/:id
// @access  Private
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.id, userId: req.user._id });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const subjects = await Subject.find({ examId: exam._id, userId: req.user._id });
    
    // Fetch topics for each subject
    const subjectsWithTopics = await Promise.all(
      subjects.map(async (subject) => {
        const topics = await Topic.find({ subjectId: subject._id });
        return {
          ...subject.toObject(),
          topics,
        };
      })
    );

    return res.json({
      success: true,
      data: {
        ...exam.toObject(),
        subjects: subjectsWithTopics,
      },
    });
  } catch (error) {
    console.error('Get Exam By ID Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Create subject for an exam
// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res) => {
  try {
    const { isValid, error, data } = validateInput(subjectSchema, req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    // Verify exam belongs to user
    const exam = await Exam.findOne({ _id: data.examId, userId: req.user._id });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const subject = await Subject.create({
      userId: req.user._id,
      examId: data.examId,
      name: data.name,
      difficulty: data.difficulty,
    });

    return res.status(201).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error('Create Subject Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Add topic to a subject
// @route   POST /api/topics
// @access  Private
const addTopic = async (req, res) => {
  try {
    const { isValid, error, data } = validateInput(topicSchema, req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    // Verify subject belongs to user
    const subject = await Subject.findOne({ _id: data.subjectId, userId: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const topic = await Topic.create({
      subjectId: data.subjectId,
      name: data.name,
      difficulty: data.difficulty,
      estimatedHours: data.estimatedHours,
      masteryPercentage: 0,
    });

    return res.status(201).json({
      success: true,
      data: topic,
    });
  } catch (error) {
    console.error('Add Topic Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Complete Onboarding Flow (Creates Exam, Subjects, Topics & updates User)
// @route   POST /api/onboarding
// @access  Private
const completeOnboarding = async (req, res) => {
  try {
    const { isValid, error, data } = validateInput(onboardingSchema, req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    const userId = req.user._id;

    // 1. Create Exam
    const exam = await Exam.create({
      userId,
      name: data.examName,
      examDate: new Date(data.examDate),
      targetScore: data.targetScore,
      dailyStudyHours: data.dailyStudyHours,
    });

    // 2. Create Subjects and nested Topics
    const createdSubjects = [];
    for (const sub of data.subjects) {
      const subject = await Subject.create({
        userId,
        examId: exam._id,
        name: sub.name,
        difficulty: sub.difficulty,
      });

      const createdTopics = [];
      for (const top of sub.topics) {
        const topic = await Topic.create({
          subjectId: subject._id,
          name: top.name,
          difficulty: top.difficulty || sub.difficulty,
          estimatedHours: top.estimatedHours || 2,
          masteryPercentage: 0,
        });
        createdTopics.push(topic);
      }

      createdSubjects.push({
        ...subject.toObject(),
        topics: createdTopics,
      });
    }

    // 3. Update User profile to set onboarding completed
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        dailyStudyHours: data.dailyStudyHours,
        preferredStudyTime: data.preferredStudyTime,
        isOnboarded: true,
      },
      { new: true }
    ).select('-password');

    return res.status(201).json({
      success: true,
      message: 'Onboarding completed successfully',
      user: updatedUser,
      exam: {
        ...exam.toObject(),
        subjects: createdSubjects,
      },
    });
  } catch (error) {
    console.error('Onboarding Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error during onboarding' });
  }
};

module.exports = {
  createExam,
  getUserExams,
  getExamById,
  createSubject,
  addTopic,
  completeOnboarding,
};
