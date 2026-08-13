import React, { useEffect, useState } from 'react';
import {
  getTodayTasksApi,
  getUpcomingTasksApi,
  getOverdueTasksApi,
  updateTaskStatusApi,
} from '../services/studyService';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Check,
  BookOpen,
  Filter,
} from 'lucide-react';

const Tasks = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasksForTab = async (tab) => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (tab === 'today') {
        res = await getTodayTasksApi();
      } else if (tab === 'upcoming') {
        res = await getUpcomingTasksApi();
      } else if (tab === 'overdue') {
        res = await getOverdueTasksApi();
      }

      if (res && res.success) {
        setTasks(res.data);
      }
    } catch (err) {
      console.error('Fetch Tasks Error:', err);
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksForTab(activeTab);
  }, [activeTab]);

  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const res = await updateTaskStatusApi(taskId, newStatus);
      if (res.success) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, status: res.data.status } : t))
        );
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Task Manager</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Study Tasks & Progress</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track daily completed topics and view pending or upcoming sessions
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'today', label: "Today's Tasks", icon: Clock },
            { id: 'upcoming', label: 'Upcoming', icon: Calendar },
            { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress Info Bar */}
      {tasks.length > 0 && activeTab === 'today' && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Today's Goal Completion</h3>
            <p className="text-xs text-slate-400 mt-1">
              {completedCount} of {tasks.length} tasks completed
            </p>
          </div>
          <div className="w-36 bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${Math.round((completedCount / tasks.length) * 100)}%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-xl font-bold text-white">No tasks found for {activeTab}</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            {activeTab === 'today'
              ? 'Great job! You have no pending tasks scheduled for today.'
              : activeTab === 'upcoming'
              ? 'No upcoming tasks scheduled in the future.'
              : 'You have no overdue tasks! Outstanding effort!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                task.status === 'completed'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : task.status === 'overdue'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <button
                  onClick={() => handleToggleTask(task._id, task.status)}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center mt-1 transition-all flex-shrink-0 ${
                    task.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                      : 'border-slate-600 hover:border-blue-400'
                  }`}
                >
                  {task.status === 'completed' && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                      {task.subjectId?.name || 'Subject'}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-medium uppercase ${
                        task.priority === 'high'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : task.priority === 'medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                  </div>

                  <h3
                    className={`font-bold text-base ${
                      task.status === 'completed'
                        ? 'text-slate-400 line-through'
                        : 'text-white'
                    }`}
                  >
                    {task.topicId?.name || 'Study Topic'}
                  </h3>

                  <div className="flex items-center space-x-3 text-xs text-slate-400 pt-1">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {new Date(task.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{task.startTime || '09:00'}</span>
                    </span>
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
  );
};

export default Tasks;
