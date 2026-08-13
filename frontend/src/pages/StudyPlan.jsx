import React, { useEffect, useState } from 'react';
import {
  getStudyPlanApi,
  generateStudyPlanApi,
  adaptStudyPlanApi,
  updateTaskStatusApi,
  downloadPDFPlanApi,
} from '../services/studyService';
import { getExamsApi } from '../services/examService';
import EditTaskModal from '../components/EditTaskModal';
import {
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Check,
  AlertTriangle,
  Download,
  Edit3,
  X,
} from 'lucide-react';

const StudyPlan = () => {
  const [tasks, setTasks] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [adapting, setAdapting] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit Task Modal state
  const [editingTask, setEditingTask] = useState(null);

  // Old vs New Plan Comparison Modal State
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      setError('');
      const examRes = await getExamsApi();
      if (examRes.success && examRes.data.length > 0) {
        setActiveExam(examRes.data[0]);
      }

      const planRes = await getStudyPlanApi();
      if (planRes.success) {
        setTasks(planRes.data);
      }
    } catch (err) {
      console.error('Fetch Study Plan Error:', err);
      setError(err.response?.data?.message || 'Failed to load study plan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await generateStudyPlanApi(activeExam?._id);
      if (res.success) {
        setSuccessMsg('Study plan generated successfully!');
        await fetchPlan();
      } else {
        setError(res.message || 'Failed to generate plan');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error generating study plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleFellBehind = async () => {
    setAdapting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await adaptStudyPlanApi(activeExam?._id);
      if (res.success) {
        setComparisonData(res.data);
        setShowComparisonModal(true);
        await fetchPlan();
      } else {
        setError(res.message || 'Failed to adapt study plan');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adapting study plan');
    } finally {
      setAdapting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    setError('');
    try {
      const pdfBlob = await downloadPDFPlanApi();
      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `study_plan_${activeExam?.name || 'schedule'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download PDF error:', err);
      setError('Failed to download Study Plan PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

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
      console.error('Toggle task status error:', err);
    }
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? { ...t, ...updatedTask } : t))
    );
    setSuccessMsg('Study task updated successfully!');
  };

  const handleTaskDeleted = (deletedTaskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== deletedTaskId));
    setSuccessMsg('Study task deleted successfully!');
  };

  // Group tasks by date string
  const groupedTasks = tasks.reduce((acc, task) => {
    const dateStr = new Date(task.date).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(task);
    return acc;
  }, {});

  const totalHoursScheduled = tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 text-slate-300">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Adaptive Study Schedule</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Your Study Timeline</h1>
          <p className="text-slate-400 text-sm mt-1">
            Non-overlapping study schedule automatically adapting when you miss tasks or fall behind
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF || tasks.length === 0}
            className="px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-semibold rounded-xl flex items-center space-x-2 border border-blue-500/30 text-xs transition-all disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${downloadingPDF ? 'animate-bounce' : ''}`} />
            <span>{downloadingPDF ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          {/* "I Fell Behind" Adaptive Rescheduling Button */}
          <button
            onClick={handleFellBehind}
            disabled={adapting || tasks.length === 0}
            className="px-5 py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 text-xs"
          >
            <AlertTriangle className={`w-4 h-4 ${adapting ? 'animate-bounce' : ''}`} />
            <span>{adapting ? 'Rescheduling...' : 'I Fell Behind'}</span>
          </button>

          <button
            onClick={handleGeneratePlan}
            disabled={generating}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl flex items-center space-x-2 border border-slate-700 transition-all disabled:opacity-50 text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>Re-Generate</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</span>
          <p className="text-2xl font-bold text-white mt-1">{tasks.length} Sessions</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Workload</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">{totalHoursScheduled} Study Hours</p>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Progress</span>
          <div className="flex items-center space-x-3 mt-1">
            <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-lg font-bold text-emerald-400">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Day by Day Schedule Timeline */}
      {Object.keys(groupedTasks).length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Study Plan Generated Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Click the button below to algorithmically distribute your topics across non-overlapping time slots.
          </p>
          <button
            onClick={handleGeneratePlan}
            disabled={generating}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all inline-flex items-center space-x-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Study Plan Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([dateStr, dayTasks]) => (
            <div key={dateStr} className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{dateStr}</h3>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                  {dayTasks.reduce((s, t) => s + (t.duration || 0), 0)} hrs scheduled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dayTasks.map((task) => (
                  <div
                    key={task._id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                      task.status === 'completed'
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : task.status === 'overdue' || task.status === 'missed'
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => handleToggleTask(task._id, task.status)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center mt-1 transition-all ${
                          task.status === 'completed'
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                            : 'border-slate-600 hover:border-blue-400'
                        }`}
                      >
                        {task.status === 'completed' && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
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
                        <div className="flex items-center space-x-3 text-xs text-slate-400 pt-1">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>{task.startTime || '09:00'}</span>
                          </span>
                          <span>•</span>
                          <span>{task.duration} hrs</span>
                        </div>
                      </div>
                    </div>

                    {/* Task Actions */}
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all text-xs flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}

      {/* OLD VS NEW PLAN COMPARISON MODAL */}
      {showComparisonModal && comparisonData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-card rounded-3xl border border-slate-800 max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Adaptive Redistribution Complete</span>
                </div>
                <h2 className="text-2xl font-black text-white">Old Plan vs. Newly Adapted Plan</h2>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
              💡 <strong>Adaptive Breakdown:</strong> Missed or overdue study hours have been redistributed across your remaining {comparisonData.daysAvailable} days. Daily study limits are strictly enforced. Weak quiz topics received priority boost!
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-rose-400 text-sm flex items-center space-x-1.5">
                    <X className="w-4 h-4" />
                    <span>Old Schedule (Previous)</span>
                  </h3>
                  <span className="text-xs text-slate-400">{comparisonData.oldPlan.length} Tasks</span>
                </div>
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {comparisonData.oldPlan.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        t.status === 'missed' || t.status === 'overdue'
                          ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between font-semibold">
                        <span>{t.subjectName} • {t.topicName}</span>
                        <span className="uppercase text-[10px]">{t.status}</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {new Date(t.date).toLocaleDateString()} at {t.startTime} ({t.duration}h)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-emerald-400 text-sm flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Newly Adapted Schedule</span>
                  </h3>
                  <span className="text-xs text-slate-400">{comparisonData.newPlan.length} Tasks</span>
                </div>
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {comparisonData.newPlan.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border bg-emerald-950/20 border-emerald-500/30 text-xs space-y-1 text-emerald-200"
                    >
                      <div className="flex justify-between font-semibold">
                        <span>{t.subjectName} • {t.topicName}</span>
                        <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 font-bold uppercase">
                          {t.priority} Priority
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {new Date(t.date).toLocaleDateString()} at {t.startTime} ({t.duration}h)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25"
              >
                Accept New Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlan;
