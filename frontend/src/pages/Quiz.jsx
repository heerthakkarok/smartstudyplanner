import React, { useEffect, useState } from 'react';
import { getExamsApi, getExamByIdApi } from '../services/examService';
import { generateQuizApi, submitQuizApi, getQuizHistoryApi } from '../services/quizService';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  Brain,
  History,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

const Quiz = () => {
  const [viewState, setViewState] = useState('setup'); // 'setup', 'playing', 'results', 'history'
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);

  // Active Quiz State
  const [quizData, setQuizData] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { 0: "Option A", 1: "Option B" }
  const [quizResult, setQuizResult] = useState(null);

  // History State
  const [quizHistory, setQuizHistory] = useState([]);

  // General Loading & Error
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        const examsRes = await getExamsApi();
        if (examsRes.success && examsRes.data.length > 0) {
          const firstExamId = examsRes.data[0]._id;
          const detailRes = await getExamByIdApi(firstExamId);
          if (detailRes.success) {
            const fetchedSubjects = detailRes.data.subjects || [];
            setSubjects(fetchedSubjects);
            if (fetchedSubjects.length > 0) {
              setSelectedSubjectId(fetchedSubjects[0]._id);
              setAvailableTopics(fetchedSubjects[0].topics || []);
              if (fetchedSubjects[0].topics?.length > 0) {
                setSelectedTopicId(fetchedSubjects[0].topics[0]._id);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load quiz subjects:', err);
        setError('Failed to load study subjects');
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, []);

  const handleSubjectChange = (subId) => {
    setSelectedSubjectId(subId);
    const chosen = subjects.find((s) => s._id === subId);
    if (chosen) {
      setAvailableTopics(chosen.topics || []);
      if (chosen.topics?.length > 0) {
        setSelectedTopicId(chosen.topics[0]._id);
      } else {
        setSelectedTopicId('');
      }
    }
  };

  const handleStartQuiz = async () => {
    if (!selectedSubjectId || !selectedTopicId) {
      setError('Please select both a subject and a topic');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await generateQuizApi({
        subjectId: selectedSubjectId,
        topicId: selectedTopicId,
        difficulty,
        numQuestions: Number(numQuestions),
      });

      if (res.success) {
        setQuizData(res.data);
        setUserAnswers({});
        setCurrentQIndex(0);
        setViewState('playing');
      } else {
        setError(res.message || 'Failed to generate quiz');
      }
    } catch (err) {
      console.error('Generate Quiz Error:', err);
      setError(err.response?.data?.message || 'Error generating quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionText) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQIndex]: optionText,
    }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    setError('');

    try {
      const formattedAnswers = quizData.questions.map((_, idx) => ({
        questionIndex: idx,
        selectedOption: userAnswers[idx] || '',
      }));

      const payload = {
        subjectId: quizData.subjectId,
        topicId: quizData.topicId,
        questions: quizData.questions,
        userAnswers: formattedAnswers,
      };

      const res = await submitQuizApi(payload);

      if (res.success) {
        setQuizResult(res.data);
        setViewState('results');
      } else {
        setError(res.message || 'Failed to submit quiz');
      }
    } catch (err) {
      console.error('Submit Quiz Error:', err);
      setError(err.response?.data?.message || 'Error submitting quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getQuizHistoryApi();
      if (res.success) {
        setQuizHistory(res.data);
        setViewState('history');
      }
    } catch (err) {
      console.error('Fetch History Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && viewState === 'setup') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Brain className="w-3.5 h-3.5" />
            <span>Gemini AI Quiz Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Adaptive AI Quizzes</h1>
          <p className="text-slate-400 text-sm mt-1">
            Test your topic knowledge and receive instant AI performance analysis
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {viewState !== 'setup' && (
            <button
              onClick={() => setViewState('setup')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Quiz</span>
            </button>
          )}

          {viewState !== 'history' && (
            <button
              onClick={fetchHistory}
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700/80 flex items-center space-x-1.5 transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STATE 1: SETUP CARD */}
      {viewState === 'setup' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span>Generate AI Quiz</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm focus:ring-2 focus:ring-blue-500/50"
              >
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id} className="bg-slate-900">
                    {sub.name} ({sub.difficulty})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Topic
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm focus:ring-2 focus:ring-blue-500/50"
              >
                {availableTopics.map((top) => (
                  <option key={top._id} value={top._id} className="bg-slate-900">
                    {top.name} ({top.estimatedHours}h)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold uppercase transition-all ${
                      difficulty === diff
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Number of Questions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNumQuestions(num)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      numQuestions === num
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleStartQuiz}
              disabled={loading}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:opacity-95 text-white font-bold rounded-xl flex items-center space-x-2 shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  <span>Generate Quiz with Gemini</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: ACTIVE QUIZ PLAYER */}
      {viewState === 'playing' && quizData && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                {quizData.subjectName} • {quizData.topicName}
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Question {currentQIndex + 1} of {quizData.questions.length}
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 uppercase font-semibold">
              {quizData.difficulty}
            </span>
          </div>

          {/* Question Display */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-100 leading-relaxed">
              {quizData.questions[currentQIndex].question}
            </h4>

            {/* Choices */}
            <div className="space-y-3 pt-2">
              {quizData.questions[currentQIndex].options.map((option, optIdx) => {
                const isSelected = userAnswers[currentQIndex] === option;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full p-4 rounded-2xl border text-left text-sm font-medium flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{option}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-400 bg-blue-500 text-white'
                          : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentQIndex === 0}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl flex items-center space-x-2 border border-slate-700 disabled:opacity-40 transition-all text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentQIndex < quizData.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQIndex((prev) => Math.min(prev + 1, quizData.questions.length - 1))}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center space-x-2 shadow-md shadow-blue-600/20 transition-all text-xs"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/25 transition-all text-xs disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Submit Quiz</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* STATE 3: RESULTS & GEMINI AI ANALYSIS */}
      {viewState === 'results' && quizResult && (
        <div className="space-y-6">
          {/* Score Card */}
          <div className="glass-card rounded-3xl p-8 border border-slate-800 text-center space-y-4 bg-gradient-to-r from-blue-950/30 via-slate-900 to-indigo-950/20">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-white">Quiz Completed!</h2>
            <div className="flex justify-center items-center space-x-6">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Score</span>
                <p className="text-2xl font-bold text-white">
                  {quizResult.score} / {quizResult.totalQuestions}
                </p>
              </div>
              <div className="w-[1px] h-10 bg-slate-800"></div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Accuracy</span>
                <p className="text-2xl font-bold text-emerald-400">{quizResult.accuracy}%</p>
              </div>
            </div>
          </div>

          {/* Gemini AI Performance Report */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span>Gemini AI Performance Analysis</span>
            </h3>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {quizResult.aiAnalysis}
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white">Question Review & Explanations</h3>
            <div className="space-y-4">
              {quizResult.questions.map((q, qIdx) => {
                const userAns = quizResult.userAnswers.find((ua) => ua.questionIndex === qIdx);
                const isCorrect = userAns?.isCorrect;

                return (
                  <div
                    key={qIdx}
                    className={`p-5 rounded-2xl border space-y-3 ${
                      isCorrect
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-rose-950/20 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-slate-100 text-sm">
                        {qIdx + 1}. {q.question}
                      </h4>
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                      )}
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-slate-300">
                        <strong>Your Choice:</strong>{' '}
                        <span className={isCorrect ? 'text-emerald-400' : 'text-rose-400 font-semibold'}>
                          {userAns?.selectedOption || 'Not answered'}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-emerald-400">
                          <strong>Correct Answer:</strong> {q.correctAnswer}
                        </p>
                      )}
                    </div>

                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
                        <strong className="text-slate-300">Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STATE 4: QUIZ HISTORY */}
      {viewState === 'history' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-400" />
            <span>Past Quiz Performance</span>
          </h2>

          {quizHistory.length === 0 ? (
            <div className="bg-slate-900/60 p-8 rounded-2xl text-center text-slate-400 text-sm">
              No quiz history found. Take your first quiz!
            </div>
          ) : (
            <div className="space-y-4">
              {quizHistory.map((item) => (
                <div
                  key={item._id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                        {item.subjectId?.name}
                      </span>
                      <h4 className="font-bold text-white text-base mt-1">
                        {item.topicId?.name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-400">{item.accuracy}%</span>
                      <p className="text-xs text-slate-400">
                        {item.score}/{item.totalQuestions} Correct
                      </p>
                    </div>
                  </div>
                  {item.aiAnalysis && (
                    <p className="text-xs text-slate-400 pt-2 border-t border-slate-800 line-clamp-2">
                      {item.aiAnalysis}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Quiz;
