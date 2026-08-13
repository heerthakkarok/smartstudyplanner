const Quiz = require('../models/Quiz');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Exam = require('../models/Exam');
const {
  generateQuizQuestions,
  analyzeQuizPerformance,
  identifyWeakTopicsAI,
  recommendNextTopics,
} = require('../services/geminiService');

// @desc    Generate AI Quiz Questions
// @route   POST /api/quiz/generate
// @access  Private
const generateQuiz = async (req, res) => {
  try {
    const { subjectId, topicId, difficulty = 'medium', numQuestions = 5 } = req.body;

    if (!subjectId || !topicId) {
      return res.status(400).json({ success: false, message: 'Subject ID and Topic ID are required' });
    }

    const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const topic = await Topic.findOne({ _id: topicId, subjectId });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    const questions = await generateQuizQuestions(
      subject.name,
      topic.name,
      difficulty,
      Number(numQuestions)
    );

    return res.status(200).json({
      success: true,
      data: {
        subjectId: subject._id,
        topicId: topic._id,
        subjectName: subject.name,
        topicName: topic.name,
        difficulty,
        totalQuestions: questions.length,
        questions,
      },
    });
  } catch (error) {
    console.error('Generate Quiz Controller Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error generating quiz questions' });
  }
};

// @desc    Submit Quiz Answers & Get AI Analysis
// @route   POST /api/quiz/submit
// @access  Private
const submitQuiz = async (req, res) => {
  try {
    const { subjectId, topicId, questions, userAnswers } = req.body;

    if (!subjectId || !topicId || !questions || !userAnswers) {
      return res.status(400).json({ success: false, message: 'Missing required quiz submission fields' });
    }

    const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
    const topic = await Topic.findOne({ _id: topicId, subjectId });

    if (!subject || !topic) {
      return res.status(404).json({ success: false, message: 'Subject or Topic not found' });
    }

    // Evaluate answers
    let score = 0;
    const evaluatedAnswers = userAnswers.map((ua) => {
      const q = questions[ua.questionIndex];
      const isCorrect = q && q.correctAnswer === ua.selectedOption;
      if (isCorrect) score++;
      return {
        questionIndex: ua.questionIndex,
        selectedOption: ua.selectedOption,
        isCorrect: !!isCorrect,
      };
    });

    const totalQuestions = questions.length;
    const accuracy = Math.round((score / totalQuestions) * 100);

    // Call Gemini for performance analysis
    const aiAnalysis = await analyzeQuizPerformance(
      subject.name,
      topic.name,
      score,
      totalQuestions,
      evaluatedAnswers
    );

    // Update Topic Mastery Percentage in DB
    topic.masteryPercentage = accuracy;
    await topic.save();

    // Save Quiz Record
    const quizRecord = await Quiz.create({
      userId: req.user._id,
      subjectId: subject._id,
      topicId: topic._id,
      questions,
      score,
      totalQuestions,
      accuracy,
      userAnswers: evaluatedAnswers,
      aiAnalysis,
      completedAt: new Date(),
    });

    const populatedQuiz = await Quiz.findById(quizRecord._id)
      .populate('subjectId', 'name difficulty')
      .populate('topicId', 'name difficulty masteryPercentage');

    return res.status(201).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: populatedQuiz,
    });
  } catch (error) {
    console.error('Submit Quiz Controller Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error submitting quiz' });
  }
};

// @desc    Get User Quiz History
// @route   GET /api/quiz/history
// @access  Private
const getQuizHistory = async (req, res) => {
  try {
    const history = await Quiz.find({ userId: req.user._id })
      .populate('subjectId', 'name difficulty')
      .populate('topicId', 'name difficulty')
      .sort({ completedAt: -1 });

    return res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Get Quiz History Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Get AI Study Recommendations & Weak Topics Analysis
// @route   GET /api/ai/recommendations
// @access  Private
const getAIRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const exam = await Exam.findOne({ userId }).sort({ createdAt: -1 });

    if (!exam) {
      return res.json({
        success: true,
        data: { recommendations: [], weakTopics: [] },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(exam.examDate);
    targetDate.setHours(0, 0, 0, 0);
    const daysRemaining = Math.max(Math.ceil((targetDate - today) / (1000 * 3600 * 24)), 0);

    const subjects = await Subject.find({ examId: exam._id, userId });
    const subjectData = await Promise.all(
      subjects.map(async (s) => {
        const topics = await Topic.find({ subjectId: s._id });
        return { name: s.name, difficulty: s.difficulty, topics: topics.map((t) => ({ name: t.name, difficulty: t.difficulty, mastery: t.masteryPercentage })) };
      })
    );

    const recentQuizzes = await Quiz.find({ userId }).sort({ completedAt: -1 }).limit(5);
    const quizSummary = recentQuizzes.map((q) => ({ accuracy: q.accuracy, score: `${q.score}/${q.totalQuestions}` }));

    const recommendations = await recommendNextTopics(
      exam.name,
      daysRemaining,
      exam.dailyStudyHours || req.user.dailyStudyHours || 4,
      subjectData,
      quizSummary
    );

    const weakTopics = await identifyWeakTopicsAI(subjectData, quizSummary);

    return res.json({
      success: true,
      data: {
        recommendations,
        weakTopics,
      },
    });
  } catch (error) {
    console.error('Get AI Recommendations Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error fetching AI recommendations' });
  }
};

module.exports = {
  generateQuiz,
  submitQuiz,
  getQuizHistory,
  getAIRecommendations,
};
