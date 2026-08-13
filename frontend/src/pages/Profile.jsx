import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getProfileApi,
  updateProfileApi,
  addSubjectApi,
  updateSubjectApi,
  deleteSubjectApi,
  addTopicApi,
  updateTopicApi,
  deleteTopicApi,
} from '../services/profileService';
import {
  User as UserIcon,
  Mail,
  Clock,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Award,
  BarChart3,
  X,
  Save,
  Check,
  Calendar,
  ChevronRight,
  TrendingUp,
  Brain,
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Profile data states
  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [dailyStudyHours, setDailyStudyHours] = useState(user?.dailyStudyHours || 4);
  const [preferredStudyTimes, setPreferredStudyTimes] = useState(user?.preferredStudyTimes || ['evening']);

  const [subjects, setSubjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);

  // Modal States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Subject Modal States
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null); // null for add, object for edit
  const [subjectName, setSubjectName] = useState('');
  const [subjectDifficulty, setSubjectDifficulty] = useState('medium');

  // Topic Modal States
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [targetSubjectId, setTargetSubjectId] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicName, setTopicName] = useState('');
  const [topicDifficulty, setTopicDifficulty] = useState('medium');
  const [topicHours, setTopicHours] = useState(2);

  // Fetch full profile data
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getProfileApi();
      if (res.success && res.data) {
        const u = res.data.user;
        setName(u.name || '');
        setProfileImage(u.profileImage || '');
        setDailyStudyHours(u.dailyStudyHours || 4);
        setPreferredStudyTimes(u.preferredStudyTimes || ['evening']);
        setSubjects(res.data.subjects || []);
        setAnalytics(res.data.analytics || null);
        setQuizHistory(res.data.quizHistory || []);
      }
    } catch (err) {
      console.error('Fetch Profile Error:', err);
      setError(err.response?.data?.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Save Personal Info / Preferences
  const handleSavePreferences = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await updateProfileApi({
        name,
        profileImage,
        dailyStudyHours: Number(dailyStudyHours),
        preferredStudyTimes,
      });

      if (res.success) {
        updateUser(res.user);
        setSuccessMsg('Profile & Study Preferences saved successfully!');
        setIsEditProfileOpen(false);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(res.message || 'Failed to update preferences');
      }
    } catch (err) {
      console.error('Update Preferences Error:', err);
      setError(err.response?.data?.message || 'Error updating preferences');
    } finally {
      setSaving(false);
    }
  };

  // Subject Handlers
  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setSubjectName('');
    setSubjectDifficulty('medium');
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (subject) => {
    setEditingSubject(subject);
    setSubjectName(subject.name);
    setSubjectDifficulty(subject.difficulty || 'medium');
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      setError('Subject name is required');
      return;
    }
    setSaving(true);
    setError('');

    try {
      if (editingSubject) {
        const res = await updateSubjectApi(editingSubject._id, {
          name: subjectName,
          difficulty: subjectDifficulty,
        });
        if (res.success) {
          setSubjects((prev) =>
            prev.map((s) => (s._id === editingSubject._id ? res.data : s))
          );
          setSuccessMsg('Subject updated successfully!');
        }
      } else {
        const res = await addSubjectApi({
          name: subjectName,
          difficulty: subjectDifficulty,
        });
        if (res.success) {
          setSubjects((prev) => [...prev, res.data]);
          setSuccessMsg('New Subject added successfully!');
        }
      }
      setIsSubjectModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving subject');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!window.confirm(`Are you sure you want to delete "${subjectName}" and all its topics?`)) {
      return;
    }
    try {
      const res = await deleteSubjectApi(subjectId);
      if (res.success) {
        setSubjects((prev) => prev.filter((s) => s._id !== subjectId));
        setSuccessMsg(`Subject "${subjectName}" deleted.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting subject');
    }
  };

  // Topic Handlers
  const handleOpenAddTopic = (subjectId) => {
    setTargetSubjectId(subjectId);
    setEditingTopic(null);
    setTopicName('');
    setTopicDifficulty('medium');
    setTopicHours(2);
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (subjectId, topic) => {
    setTargetSubjectId(subjectId);
    setEditingTopic(topic);
    setTopicName(topic.name);
    setTopicDifficulty(topic.difficulty || 'medium');
    setTopicHours(topic.estimatedHours || 2);
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    if (!topicName.trim()) {
      setError('Topic name is required');
      return;
    }
    setSaving(true);
    setError('');

    try {
      if (editingTopic) {
        const res = await updateTopicApi(editingTopic._id, {
          name: topicName,
          difficulty: topicDifficulty,
          estimatedHours: Number(topicHours),
        });
        if (res.success) {
          setSubjects((prev) =>
            prev.map((s) => {
              if (s._id === targetSubjectId) {
                return {
                  ...s,
                  topics: s.topics.map((t) => (t._id === editingTopic._id ? res.data : t)),
                };
              }
              return s;
            })
          );
          setSuccessMsg('Topic updated successfully!');
        }
      } else {
        const res = await addTopicApi(targetSubjectId, {
          name: topicName,
          difficulty: topicDifficulty,
          estimatedHours: Number(topicHours),
        });
        if (res.success) {
          setSubjects((prev) =>
            prev.map((s) => {
              if (s._id === targetSubjectId) {
                return {
                  ...s,
                  topics: [...(s.topics || []), res.data],
                };
              }
              return s;
            })
          );
          setSuccessMsg('New Topic added successfully!');
        }
      }
      setIsTopicModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving topic');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = async (subjectId, topicId, topicName) => {
    if (!window.confirm(`Are you sure you want to delete topic "${topicName}"?`)) {
      return;
    }
    try {
      const res = await deleteTopicApi(topicId);
      if (res.success) {
        setSubjects((prev) =>
          prev.map((s) => {
            if (s._id === subjectId) {
              return {
                ...s,
                topics: s.topics.filter((t) => t._id !== topicId),
              };
            }
            return s;
          })
        );
        setSuccessMsg(`Topic "${topicName}" deleted.`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting topic');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-5">
            <div className="relative">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500/50 shadow-xl shadow-blue-500/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-400/30 shadow-xl shadow-blue-500/20">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                  {user?.authProvider === 'google' ? 'Google Account' : 'Student'}
                </span>
              </div>
              <p className="text-slate-400 text-sm flex items-center space-x-1.5 mt-1">
                <Mail className="w-4 h-4 text-slate-500" />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Edit2 className="w-4 h-4 text-blue-400" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STUDY PREFERENCES CARD */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Study Preferences</h2>
              <p className="text-slate-400 text-xs">Direct source of truth for your AI timetable generator</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSavePreferences}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Daily Study Hours Slider */}
          <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Daily Study Time Limit
              </label>
              <span className="text-xl font-black text-blue-400">{dailyStudyHours} hrs / day</span>
            </div>

            <input
              type="range"
              min="0.5"
              max="14"
              step="0.5"
              value={dailyStudyHours}
              onChange={(e) => setDailyStudyHours(e.target.value)}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>0.5 hrs</span>
              <span>4 hrs</span>
              <span>8 hrs</span>
              <span>14 hrs</span>
            </div>
          </div>

          {/* Multi-Select Preferred Study Times */}
          <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Preferred Study Times (Multi-Select)
            </label>
            <div className="grid grid-cols-2 gap-3">
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
                    className={`p-3 rounded-xl border text-center font-medium text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-blue-400 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MY SUBJECTS & TOPICS MANAGEMENT */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">My Subjects & Topics</h2>
              <p className="text-slate-400 text-xs">Add or modify your course topics at any time</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddSubject}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm font-medium">No subjects added yet.</p>
            <button
              type="button"
              onClick={handleOpenAddSubject}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs"
            >
              + Add First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map((subject) => (
              <div
                key={subject._id}
                className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 shadow-lg space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-base">{subject.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          subject.difficulty === 'hard'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : subject.difficulty === 'medium'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {subject.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSubject(subject)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(subject._id, subject.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Topics List */}
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                      <span>Topics ({subject.topics?.length || 0})</span>
                    </div>

                    {(!subject.topics || subject.topics.length === 0) ? (
                      <p className="text-xs text-slate-500 italic py-2">No topics in this subject yet.</p>
                    ) : (
                      subject.topics.map((topic) => (
                        <div
                          key={topic._id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span className="font-medium text-slate-200">{topic.name}</span>
                            <span className="text-[10px] text-slate-400">({topic.estimatedHours || 2}h)</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTopic(subject._id, topic)}
                              className="p-1 text-slate-400 hover:text-blue-400"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTopic(subject._id, topic._id, topic.name)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 mt-3">
                  <button
                    type="button"
                    onClick={() => handleOpenAddTopic(subject._id)}
                    className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-blue-400 text-xs font-semibold flex items-center justify-center space-x-1 transition-all border border-slate-700/60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Topic to {subject.name}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUIZ PERFORMANCE ANALYTICS */}
      {analytics && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Quiz Performance Analytics</h2>
              <p className="text-slate-400 text-xs">Calculated from total correct answers divided by total questions</p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Overall Accuracy
              </span>
              <p className="text-3xl font-black text-emerald-400">{analytics.overallAccuracy}%</p>
              <p className="text-[11px] text-slate-500 font-medium">Total Correct / Total Questions</p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Quizzes
              </span>
              <p className="text-3xl font-black text-blue-400">{analytics.totalQuizzes}</p>
              <p className="text-[11px] text-slate-500 font-medium">Completed tests</p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Correct Answers
              </span>
              <p className="text-3xl font-black text-indigo-400">{analytics.totalCorrect}</p>
              <p className="text-[11px] text-slate-500 font-medium">Out of {analytics.totalQuestions} questions</p>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Incorrect Answers
              </span>
              <p className="text-3xl font-black text-rose-400">{analytics.totalIncorrect}</p>
              <p className="text-[11px] text-slate-500 font-medium">Opportunities for growth</p>
            </div>
          </div>

          {/* Subject-Wise Accuracy Cards */}
          {analytics.subjectPerformance && analytics.subjectPerformance.length > 0 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Subject-Wise Accuracy
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {analytics.subjectPerformance.map((sub, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200">{sub.name}</span>
                      <span className="font-extrabold text-blue-400">{sub.accuracy}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sub.accuracy >= 80
                            ? 'bg-emerald-500'
                            : sub.accuracy >= 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${sub.accuracy}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {sub.totalCorrect} / {sub.totalQuestions} questions correct
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUIZ HISTORY TABLE */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Quiz History</h2>
              <p className="text-slate-400 text-xs">Sorted newest first</p>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-semibold">
            {quizHistory.length} Total Attempts
          </span>
        </div>

        {quizHistory.length === 0 ? (
          <div className="text-center py-8 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            <p className="text-slate-500 text-xs font-medium">No quiz attempts logged yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Subject / Topic</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {quizHistory.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">{q.topicName}</div>
                      <div className="text-[11px] text-slate-400">{q.subjectName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(q.completedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-300">
                      {q.correctAnswers} / {q.totalQuestions}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold ${
                          q.percentage >= 80
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : q.percentage >= 60
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {q.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 max-w-md w-full border border-slate-800 space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">Edit Profile Info</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Profile Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address (Read-Only)
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-medium rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBJECT MODAL */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 max-w-md w-full border border-slate-800 space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Subject Difficulty
                </label>
                <select
                  value={subjectDifficulty}
                  onChange={(e) => setSubjectDifficulty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-medium rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20"
                >
                  {editingSubject ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOPIC MODAL */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 max-w-md w-full border border-slate-800 space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingTopic ? 'Edit Topic' : 'Add Topic'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTopicModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="e.g. Algebra / Calculus"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Difficulty
                  </label>
                  <select
                    value={topicDifficulty}
                    onChange={(e) => setTopicDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Est. Hours
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={topicHours}
                    onChange={(e) => setTopicHours(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-medium rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20"
                >
                  {editingTopic ? 'Save Changes' : 'Add Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
