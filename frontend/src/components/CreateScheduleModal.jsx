import React, { useState } from 'react';
import { X, CalendarClock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_TECHNICIANS = [
  "Vikram Sharma (HVAC Specialist)",
  "Priya Nair (Reliability Engineer)",
  "Anil Kulkarni (Vibration Analyst)",
  "Suresh Rao (Plant Electrical Lead)",
  "Deepak Verma (Pumps & Mechanical Tech)"
];

export default function CreateScheduleModal({
  isOpen,
  onClose,
  preselectedAssetId = '',
  assets = [],
  onScheduleCreated
}) {
  const [assetId, setAssetId] = useState(preselectedAssetId || (assets[0]?.asset_id || ''));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState('Medium');
  const [technician, setTechnician] = useState(DEFAULT_TECHNICIANS[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetId || !title || !description) {
      setError('Please fill in Asset, Task Title, and Description.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.createMaintenanceSchedule({
        asset_id: assetId,
        title,
        description,
        scheduled_date: new Date(scheduledDate).toISOString(),
        priority,
        assigned_technician: technician,
        notes
      });
      if (onScheduleCreated) onScheduleCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create maintenance work order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-tight">Create Maintenance Work Order</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Asset</label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              {assets.map((a) => (
                <option key={a.asset_id} value={a.asset_id}>
                  {a.asset_name} ({a.asset_id}) — {a.asset_type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Task Title</label>
            <input
              type="text"
              placeholder="e.g. Bearing Lubrication & Alignment Check"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Task Scope & Description</label>
            <textarea
              rows={2}
              placeholder="Describe work scope, diagnostic steps, and safety precautions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Technician</label>
            <select
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              {DEFAULT_TECHNICIANS.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Instructions (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Lockout/Tagout required before opening inspection hatch."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Scheduling...' : 'Create Work Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
