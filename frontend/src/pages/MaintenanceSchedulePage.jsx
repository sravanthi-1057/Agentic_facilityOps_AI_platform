import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Wrench,
  Check,
  RefreshCw,
  ExternalLink,
  Calendar,
  X
} from 'lucide-react';
import { api } from '../services/api';

const PRIORITY_STYLES = {
  Critical: 'bg-rose-50 text-rose-700 border-rose-200',
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
  High: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  Medium: 'bg-sky-50 text-sky-700 border-sky-200',
  MEDIUM: 'bg-sky-50 text-sky-700 border-sky-200',
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  LOW: 'bg-slate-100 text-slate-700 border-slate-200'
};

const STATUS_STYLES = {
  Scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  'IN PROGRESS': 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Overdue: 'bg-rose-50 text-rose-700 border-rose-200',
  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200'
};

function formatStatus(statusStr) {
  if (!statusStr) return 'Scheduled';
  const upper = String(statusStr).toUpperCase().replace(' ', '_');
  if (upper === 'SCHEDULED') return 'Scheduled';
  if (upper === 'IN_PROGRESS') return 'In Progress';
  if (upper === 'COMPLETED') return 'Completed';
  if (upper === 'OVERDUE') return 'Overdue';
  return statusStr;
}

export default function MaintenanceSchedulePage({
  facilityId = 'all',
  onSelectAsset,
  onOpenCreateSchedule
}) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Complete modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [targetSchedule, setTargetSchedule] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMaintenanceSchedules({ facility_id: facilityId || 'all' });
      setSchedules(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load maintenance schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [facilityId]);

  const handleStartWork = async (scheduleId) => {
    try {
      await api.updateMaintenanceSchedule(scheduleId, { status: 'IN_PROGRESS' });
      await fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update schedule status.');
    }
  };

  const handleOpenComplete = (schedule) => {
    setTargetSchedule(schedule);
    setCompletionNotes('Completed routine maintenance and verification. Operational parameters verified within normal ranges.');
    setCompleteModalOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!targetSchedule) return;
    const scheduleId = targetSchedule.schedule_id || targetSchedule.id;
    if (!scheduleId) return;

    setCompleting(true);
    try {
      await api.completeMaintenanceSchedule(scheduleId, completionNotes);
      setCompleteModalOpen(false);
      setTargetSchedule(null);
      await fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to complete work order.');
    } finally {
      setCompleting(false);
    }
  };

  // Status helper
  const getStatusUpper = (s) => (s?.status || '').toUpperCase().replace(' ', '_');

  // KPI calculations
  const totalCount = schedules.length;
  const scheduledCount = schedules.filter((s) => getStatusUpper(s) === 'SCHEDULED').length;
  const inProgressCount = schedules.filter((s) => getStatusUpper(s) === 'IN_PROGRESS').length;
  const completedCount = schedules.filter((s) => getStatusUpper(s) === 'COMPLETED').length;
  const overdueCount = schedules.filter((s) => getStatusUpper(s) === 'OVERDUE').length;

  // Filtered schedules
  const filtered = schedules.filter((item) => {
    const itemStatusUpper = getStatusUpper(item);
    if (statusFilter !== 'ALL') {
      const filterTarget = statusFilter.toUpperCase().replace(' ', '_');
      if (itemStatusUpper !== filterTarget) return false;
    }
    if (priorityFilter !== 'ALL') {
      if ((item.priority || '').toUpperCase() !== priorityFilter.toUpperCase()) {
        return false;
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchAsset = (item.asset_name || item.asset_id)?.toLowerCase().includes(q);
      const matchTech = item.assigned_technician?.toLowerCase().includes(q);
      const matchWo = (item.work_order_id || '')?.toLowerCase().includes(q);
      if (!matchTitle && !matchAsset && !matchTech && !matchWo) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Work Orders & Maintenance Schedules</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {scheduledCount + inProgressCount} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch, track, and complete preventive maintenance work orders across all facility equipment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSchedules}
            disabled={loading}
            className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onOpenCreateSchedule}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Work Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Work Orders</span>
            <CalendarClock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-blue-600">
            <span>Scheduled</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{scheduledCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-amber-600">
            <span>In Progress</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{inProgressCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-rose-600">
            <span>Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{overdueCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-emerald-600">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{completedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            {['ALL', 'Scheduled', 'In Progress', 'Overdue', 'Completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Orders' : st}
              </button>
            ))}
          </div>

          {/* Priority dropdown & Search */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="Critical">Critical Priority</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders, assets, techs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-52"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading work orders...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-500 font-medium">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No work orders match the criteria</p>
            <p className="text-xs text-slate-400 mt-1">Adjust filters or create a new maintenance schedule.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4">Order / Title</th>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => {
                  const scheduleId = order.schedule_id || order.id;
                  const workOrderId = order.work_order_id || `WO-${String(scheduleId || 1).padStart(4, '0')}`;
                  const statusUpper = getStatusUpper(order);
                  const isCompleted = statusUpper === 'COMPLETED';
                  const isScheduled = statusUpper === 'SCHEDULED';
                  const displayStatus = formatStatus(order.status);

                  return (
                    <tr key={scheduleId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{order.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {order.description || 'Routine preventive maintenance work order.'}
                        </div>
                        <div className="text-[10px] text-indigo-600 mt-1 font-mono font-semibold">
                          {workOrderId}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => onSelectAsset && onSelectAsset(order.asset_id)}
                          className="text-left group flex items-center gap-1.5 hover:text-emerald-600 transition-colors"
                        >
                          <div>
                            <div className="font-medium text-slate-800 group-hover:text-emerald-600">
                              {order.asset_name || order.asset_id}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {order.asset_id} {order.facility_id ? `• ${order.facility_id}` : ''}
                            </div>
                          </div>
                          <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {order.scheduled_date
                              ? new Date(order.scheduled_date).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'Immediate'}
                          </span>
                        </div>
                        {order.completed_at && (
                          <div className="text-[10px] text-emerald-600 mt-0.5">
                            Done:{' '}
                            {new Date(order.completed_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            PRIORITY_STYLES[order.priority] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {order.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">
                            {order.assigned_technician?.split(' (')[0] || order.assigned_technician || 'Unassigned'}
                          </span>
                        </div>
                        {order.assigned_technician?.includes('(') && (
                          <div className="text-[10px] text-slate-400">
                            {order.assigned_technician.match(/\((.*?)\)/)?.[1]}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            STATUS_STYLES[order.status] || STATUS_STYLES[displayStatus] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {displayStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isScheduled && (
                            <button
                              onClick={() => handleStartWork(scheduleId)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                              title="Start work order"
                            >
                              Start Work
                            </button>
                          )}

                          {!isCompleted && (
                            <button
                              onClick={() => handleOpenComplete(order)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                              title="Mark work order completed"
                            >
                              <Check className="w-3 h-3" />
                              Complete
                            </button>
                          )}

                          {isCompleted && (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Signed Off
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Complete Work Order Dialog */}
      {completeModalOpen && targetSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  Complete Work Order #{targetSchedule.work_order_id || targetSchedule.schedule_id || targetSchedule.id}
                </h3>
              </div>
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-800">{targetSchedule.title}</div>
                <div className="text-slate-500 mt-0.5">
                  Asset: <span className="font-medium text-slate-700">{targetSchedule.asset_name || targetSchedule.asset_id}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Technician Work Notes & Verification Details
                </label>
                <textarea
                  rows={4}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Record work completed, replaced components, recalibration results..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Completing this work order will update the asset's last maintenance date and restore health score.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={completing}
                  onClick={handleConfirmComplete}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {completing ? 'Signing off...' : 'Sign Off & Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
