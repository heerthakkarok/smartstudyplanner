import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { completeOnboardingApi } from '../services/examService';
import {
  Sparkles,
  Calendar,
  Clock,
  Target,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react';

const Onboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 State
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [targetScore, setTargetScore] = useState(90);
  const [dailyStudyHours, setDailyStudyHours] = useState(4);
  const [preferredStudyTimes, setPreferredStudyTimes] = useState(['evening']);

  // Step 2 State: Subjects & Topics
  const [subjects, setSubjects] = useState([
    {
      name: 'Data Structures & Algorithms',
      difficulty: 'hard',
      topics: [
        { name: 'Arrays & Strings', difficulty: 'easy', estimatedHours: 3 },
        { name: 'Binary Trees & BST', difficulty: 'medium', estimatedHours: 4 },
        { name: 'Dynamic Programming', difficulty: 'hard', estimatedHours: 6 },
      ],
    },
    {
      name: 'Operating Systems',
      difficulty: 'medium',
      topics: [
        { name: 'Process Scheduling', difficulty: 'medium', estimatedHours: 3 },
        { name: 'Memory Management', difficulty: 'medium', estimatedHours: 4 },
      ],
    },
  ]);

  // Subject management helpers
  const handleAddSubject = () => {
    setSubjects([
      ...subjects,
      {
        name: '',
        difficulty: 'medium',
        topics: [{ name: '', difficulty: 'medium', estimatedHours: 2 }],
      },
    ]);
  };

  const handleRemoveSubject = (subIndex) => {
    if (subjects.length === 1) {
      setError('You must have at least one subject');
      return;
    }
    setSubjects(subjects.filter((_, idx) => idx !== subIndex));
  };

  const handleSubjectChange = (subIndex, field, value) => {
    const updated = [...subjects];
    updated[subIndex][field] = value;
    setSubjects(updated);
  };

  // Topic management helpers
  const handleAddTopic = (subIndex) => {
    const updated = [...subjects];
    updated[subIndex].topics.push({
      name: '',
      difficulty: updated[subIndex].difficulty,
      estimatedHours: 2,
    });
    setSubjects(updated);
  };

  const handleRemoveTopic = (subIndex, topIndex) => {
    const updated = [...subjects];
    if (updated[subIndex].topics.length === 1) {
      setError('Each subject must have at least one topic');
      return;
    }
    updated[subIndex].topics = updated[subIndex].topics.filter((_, idx) => idx !== topIndex);
    setSubjects(updated);
  };

  const handleTopicChange = (subIndex, topIndex, field, value) => {
    const updated = [...subjects];
    updated[subIndex].topics[topIndex][field] = value;
    setSubjects(updated);
  };

  const validateStep1 = () => {
    if (!examName.trim()) return 'Please enter your exam name';
    if (!examDate) return 'Please select your target exam date';
    const selectedDate = new Date(examDate);
    if (selectedDate <= new Date()) return 'Exam date must be in the future';
    return null;
  };

  const validateStep2 = () => {
    for (let i = 0; i < subjects.length; i++) {
      if (!subjects[i].name.trim()) return `Please enter a name for Subject #${i + 1}`;
      if (!subjects[i].topics.length) return `Subject "${subjects[i].name}" must have at least one topic`;
      for (let j = 0; j < subjects[i].topics.length; j++) {
        if (!subjects[i].topics[j].name.trim()) {
          return `Please enter a name for Topic #${j + 1} in "${subjects[i].name}"`;
        }
      }
    }
    return null;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        examName,
        examDate,
        targetScore: Number(targetScore),
        dailyStudyHours: Number(dailyStudyHours),
        preferredStudyTimes,
        subjects: subjects.map((sub) => ({
          name: sub.name,
          difficulty: sub.difficulty,
          topics: sub.topics.map((top) => ({
            name: top.name,
            difficulty: top.difficulty,
            estimatedHours: Number(top.estimatedHours) || 2,
          })),
        })),
      };

      const res = await completeOnboardingApi(payload);

      if (res.success) {
        updateUser({ isOnboarded: true, dailyStudyHours, preferredStudyTimes });
        navigate('/dashboard');
      } else {
        setError(res.message || 'Failed to save onboarding settings');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error while completing onboarding');
    } finally {
      setLoading(false);
    }
  };

  const totalEstimatedHours = subjects.reduce((acc, sub) => {
    return (
      acc +
      sub.topics.reduce((tAcc, top) => tAcc + (Number(top.estimatedHours) || 0), 0)
    );
  }, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10 px-4 max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Student Onboarding</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Let's Build Your Study Plan</h1>
        <p className="text-slate-400 text-sm mt-1">
          Tell us about your upcoming exam and subjects to personalize your schedule
        </p>

        {/* Wizard Step Tracker */}
        <div className="flex items-center justify-center space-x-4 mt-8">
          {[
            { num: 1, label: 'Exam Details' },
            { num: 2, label: 'Subjects & Topics' },
            { num: 3, label: 'Review & Confirm' },
          ].map((s) => (
            <div key={s.num} className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === s.num
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : step > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  step === s.num ? 'text-white' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
              {s.num < 3 && <div className="w-8 h-[2px] bg-slate-800 hidden sm:block"></div>}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Exam & Schedule Details */}
      {step === 1 && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span>Step 1: Exam Target & Study Hours</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Exam Name
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. GATE CS 2026 / Midterm Finals"
                className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Exam Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Score (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-white text-sm focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Daily Available Study Hours
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={dailyStudyHours}
                  onChange={(e) => setDailyStudyHours(e.target.value)}
                  className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-lg font-bold text-blue-400 min-w-[3rem]">
                  {dailyStudyHours} hrs
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Preferred Study Times (Multi-Select)
            </label>
            <p className="text-xs text-slate-400 mb-3">Select any combination of time windows for your study schedule.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'morning', label: 'Morning (8-12)', icon: '🌅' },
                { id: 'afternoon', label: 'Afternoon (1-5)', icon: '☀️' },
                { id: 'evening', label: 'Evening (6-10)', icon: '🌆' },
                { id: 'night', label: 'Night (10-2)', icon: '🌙' },
              ].map((item) => {
                const isSelected = preferredStudyTimes.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      if (isSelected) {
                        if (preferredStudyTimes.length > 1) {
                          setPreferredStudyTimes(preferredStudyTimes.filter((t) => t !== item.id));
                        }
                      } else {
                        setPreferredStudyTimes([...preferredStudyTimes, item.id]);
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-center font-medium text-sm flex flex-col items-center space-y-1 transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="flex items-center space-x-1">
                      <span>{item.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-blue-600/20"
            >
              <span>Next: Add Subjects</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Subjects & Topics */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>Step 2: Add Subjects & Topics</span>
            </h2>
            <button
              type="button"
              onClick={handleAddSubject}
              className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 text-sm font-medium rounded-xl flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>

          {subjects.map((subject, subIndex) => (
            <div
              key={subIndex}
              className="glass-card rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Subject Name #{subIndex + 1}
                    </label>
                    <input
                      type="text"
                      value={subject.name}
                      onChange={(e) => handleSubjectChange(subIndex, 'name', e.target.value)}
                      placeholder="e.g. Operating Systems"
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Subject Difficulty
                    </label>
                    <select
                      value={subject.difficulty}
                      onChange={(e) => handleSubjectChange(subIndex, 'difficulty', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-white text-sm focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="easy" className="bg-slate-900">Easy</option>
                      <option value="medium" className="bg-slate-900">Medium</option>
                      <option value="hard" className="bg-slate-900">Hard</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSubject(subIndex)}
                  className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors mt-5"
                  title="Remove Subject"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Topics under Subject */}
              <div className="pl-4 border-l-2 border-blue-500/30 space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Topics ({subject.topics.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddTopic(subIndex)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Topic</span>
                  </button>
                </div>

                {subject.topics.map((topic, topIndex) => (
                  <div key={topIndex} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={topic.name}
                        onChange={(e) => handleTopicChange(subIndex, topIndex, 'name', e.target.value)}
                        placeholder="Topic title (e.g. Memory Allocation)"
                        className="w-full px-3 py-1.5 rounded-lg glass-input text-white text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <select
                        value={topic.difficulty}
                        onChange={(e) => handleTopicChange(subIndex, topIndex, 'difficulty', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg glass-input text-white text-xs"
                      >
                        <option value="easy" className="bg-slate-900">Easy</option>
                        <option value="medium" className="bg-slate-900">Medium</option>
                        <option value="hard" className="bg-slate-900">Hard</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3 flex items-center space-x-1.5">
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={topic.estimatedHours}
                        onChange={(e) => handleTopicChange(subIndex, topIndex, 'estimatedHours', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg glass-input text-white text-xs"
                      />
                      <span className="text-xs text-slate-400 whitespace-nowrap">hrs</span>
                    </div>
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(subIndex, topIndex)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4 flex justify-between items-center">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl flex items-center space-x-2 transition-all border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center space-x-2 transition-all shadow-lg shadow-blue-600/20"
            >
              <span>Review Study Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Submit */}
      {step === 3 && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Step 3: Review Your Study Setup</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">Exam Name</span>
              <p className="text-lg font-bold text-white mt-1">{examName}</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">Target Date</span>
              <p className="text-lg font-bold text-blue-400 mt-1">{examDate}</p>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase">Daily Study Limit</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">{dailyStudyHours} hrs / day</p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Subjects & Topics Summary
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                Total Est. Hours: <strong className="text-white">{totalEstimatedHours} hrs</strong>
              </span>
            </div>

            <div className="divide-y divide-slate-800">
              {subjects.map((sub, idx) => (
                <div key={idx} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-200 text-sm">{sub.name}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium uppercase ${
                        sub.difficulty === 'hard'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : sub.difficulty === 'medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {sub.difficulty}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sub.topics.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-xs text-slate-300 border border-slate-700/50"
                      >
                        {t.name} ({t.estimatedHours}h)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl flex items-center space-x-2 transition-all border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:opacity-90 text-white font-bold rounded-xl flex items-center space-x-2 shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Complete Onboarding</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
