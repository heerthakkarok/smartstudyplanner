import React, { useState, useEffect } from 'react';
import { updateTaskApi, deleteTaskApi } from '../services/studyService';
import { X, Clock, Calendar, AlertCircle, Save, Trash2, CheckCircle2 } from 'lucide-react';

const EditTaskModal = ({ task, onClose, onTaskUpdated, onTaskDeleted }) => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(1);
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      const d = task.date ? new Date(task.date).toISOString().split('T')[0] : '';
      setDate(d);
      setStartTime(task.startTime || '09:00');
      setDuration(task.duration || 1);
      setPriority(task.priority || 'medium');
    }
  }, [task]);

  // Calculate End Time automatically
  const calculateEndTime = () => {
    if (!startTime) return '10:00';
    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + (m || 0) + Number(duration || 1) * 60;
    const endH = Math.floor((totalMins % 1440) / 60);
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        date,
        startTime,
        duration: Number(duration),
        priority,
      };

      const res = await updateTaskApi(task._id, payload);
      if (res.success) {
        if (onTaskUpdated) onTaskUpdated(res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to update study task');
      }
    } catch (err) {
      console.error('Update Task Error:', err);
      setError(err.response?.data?.message || 'Conflict/Error updating study task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this scheduled task?')) return;
    setDeleting(true);
    try {
      const res = await deleteTaskApi(task._id);
      if (res.success) {
        if (onTaskDeleted) onTaskDeleted(task._id);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting task');
    } finally {
      setDeleting(false);
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-card rounded-3xl border border-slate-800 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              {task.subjectId?.name || 'Subject'}
            </span>
            <h3 className="text-xl font-bold text-white mt-0.5">{task.topicId?.name || 'Study Task'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Scheduled Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Duration (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="8"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Calculated End Time Indicator */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs text-blue-300">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Calculated Schedule:</span>
            </span>
            <span className="font-bold text-white text-sm">
              {startTime} - {calculateEndTime()} ({duration}h)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl border border-rose-500/20 text-xs flex items-center space-x-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs border border-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-blue-600/25 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
