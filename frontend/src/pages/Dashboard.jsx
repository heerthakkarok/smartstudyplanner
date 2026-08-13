import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardStatsApi } from '../services/analyticsService';
import { updateTaskStatusApi, adaptStudyPlanApi } from '../services/studyService';
import { getAIRecommendationsApi } from '../services/quizService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  Sparkles,
  Flame,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Check,
  Award,
  Layers,
  Brain,
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [aiRecs, setAiRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adapting, setAdapting] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStatsApi();
      if (res.success) {
        setStats(res.data);
      } else {
        setError(res.message || 'Failed to load dashboard metrics');
      }

      // Fetch AI Study Recommendations
      const aiRes = await getAIRecommendationsApi();
      if (aiRes.success && aiRes.data.recommendations) {
        setAiRecs(aiRes.data.recommendations);
      }
    } catch (err) {
      console.error('Fetch Dashboard Stats Error:', err);
      setError(err.response?.data?.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleFellBehind = async () => {
    setAdapting(true);
    try {
      const res = await adaptStudyPlanApi(stats?.exam?._id);
      if (res.success) {
        await fetchStats();
      }
    } catch (err) {
      console.error('Adapt Error:', err);
    } finally {
      setAdapting(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const res = await updateTaskStatusApi(taskId, newStatus);
      if (res.success) {
        // Refresh dashboard stats dynamically to update streak, overall progress & charts!
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!stats?.hasExam) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Welcome to Smart Study Planner</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          You haven't configured an exam target yet. Complete onboarding to generate your schedule and unlock real-time analytics.
        </p>
        <Link
          to="/onboarding"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start Onboarding</span>
        </Link>
      </div>
    );
  }

  const {
    exam,
    daysRemaining,
    overallProgress,
    todayStudyHours,
    weeklyStudyHours,
    weeklyBreakdown,
    completedTasksCount,
    pendingTasksCount,
    currentStreak,
    subjectProgress,
    weakTopics,
    todayStudyPlan,
  } = stats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner with Exam Countdown & Streak */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dashboard Active</span>
              </span>
              {currentStreak > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{currentStreak} Day Streak 🔥</span>
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Target Exam: <strong className="text-white">{exam.name}</strong> • Target Score: <strong className="text-amber-400">{exam.targetScore}%</strong>
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex flex-col items-center justify-center font-extrabold shadow-md shadow-blue-600/30">
              <span className="text-2xl leading-none">{daysRemaining}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80 mt-0.5">Days</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exam Countdown</span>
              <p className="text-sm font-bold text-white">
                {new Date(exam.examDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Key Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
        {/* Overall Progress */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall</span>
          <p className="text-xl font-bold text-blue-400 mt-1">{overallProgress}%</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>

        {/* Today's Study Hours */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">
            {todayStudyHours.completed} / {todayStudyHours.limit} hrs
          </p>
          <span className="text-[10px] text-slate-500">Scheduled: {todayStudyHours.scheduled}h</span>
        </div>

        {/* Weekly Study Hours */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weekly</span>
          <p className="text-xl font-bold text-indigo-400 mt-1">{weeklyStudyHours} hrs</p>
          <span className="text-[10px] text-slate-500">This Week</span>
        </div>

        {/* Completed Tasks */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed</span>
          <p className="text-xl font-bold text-white mt-1">{completedTasksCount}</p>
          <span className="text-[10px] text-slate-500">Tasks Done</span>
        </div>

        {/* Pending Tasks */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending</span>
          <p className="text-xl font-bold text-rose-400 mt-1">{pendingTasksCount}</p>
          <span className="text-[10px] text-slate-500">Tasks Left</span>
        </div>

        {/* Study Streak */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
            <Flame className="w-4 h-4 fill-amber-400" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Streak</span>
          <p className="text-xl font-bold text-amber-400 mt-1">{currentStreak} Days</p>
          <span className="text-[10px] text-slate-500">Active Record</span>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Progress Chart */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <span>Subject Progress (%)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Task completion breakdown per subject</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${value}%`, 'Completion']}
                />
                <Bar dataKey="progressPercent" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Hours Breakdown Chart */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span>Weekly Study Distribution</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Scheduled vs completed hours this week</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="scheduledHours" stroke="#6366f1" fillOpacity={1} fill="url(#colorScheduled)" name="Scheduled (hrs)" />
                <Area type="monotone" dataKey="completedHours" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" name="Completed (hrs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gemini AI Recommendations Section */}
      {aiRecs.length > 0 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4 bg-gradient-to-r from-indigo-950/20 via-slate-900 to-blue-950/20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span>Gemini AI Study Recommendations</span>
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold uppercase">
              AI Insight
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiRecs.map((rec, rIdx) => (
              <div key={rIdx} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                  {rec.priority ? `${rec.priority} priority` : 'Recommendation'}
                </span>
                <h4 className="font-bold text-sm text-white">{rec.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{rec.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Section: Weak Topics & Today's Study Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weak Topics Warning Widget */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Weak Topics Needing Focus</span>
            </h3>
          </div>

          {weakTopics.length === 0 ? (
            <div className="bg-slate-900/60 p-6 rounded-2xl text-center border border-slate-800 text-slate-400 text-xs">
              No weak topics flagged! Keep up the solid performance!
            </div>
          ) : (
            <div className="space-y-3">
              {weakTopics.map((topic) => (
                <div
                  key={topic.topicId}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {topic.subjectName}
                    </span>
                    <h4 className="font-bold text-sm text-white">{topic.name}</h4>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold uppercase ${
                      topic.difficulty === 'hard'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {topic.difficulty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Study Plan Interactive Checklist */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                <span>Today's Study Plan</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Check off sessions as you complete them today
              </p>
            </div>
            <Link
              to="/tasks"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
            >
              <span>Manage All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todayStudyPlan.length === 0 ? (
            <div className="bg-slate-900/60 p-8 rounded-2xl text-center border border-slate-800/80 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">No tasks scheduled for today</h4>
              <Link
                to="/study-plan"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>View Study Schedule</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {todayStudyPlan.map((task) => (
                <div
                  key={task._id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    task.status === 'completed'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => handleToggleTask(task._id, task.status)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center mt-0.5 transition-all ${
                        task.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'border-slate-600 hover:border-blue-400'
                      }`}
                    >
                      {task.status === 'completed' && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {task.subjectId?.name || 'Subject'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase ${
                            task.priority === 'high'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <h4
                        className={`font-bold text-sm ${
                          task.status === 'completed'
                            ? 'text-slate-400 line-through'
                            : 'text-white'
                        }`}
                      >
                        {task.topicId?.name || 'Topic'}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <span>{task.startTime}</span>
                        <span>•</span>
                        <span>{task.duration} hrs</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
