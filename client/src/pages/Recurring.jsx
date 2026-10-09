import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { recurringService } from '../services/recurringService.js';
import { RecurringModal } from '../components/RecurringModal.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { formatDate } from '../utils/formatters.js';
import {
  Plus,
  Repeat,
  Play,
  Pause,
  Trash2,
  Edit2,
  Calendar,
  Zap,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const Recurring = () => {
  const { format } = useCurrency();
  const [recurringItems, setRecurringItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [jobLoading, setJobLoading] = useState(false);
  const [jobResult, setJobResult] = useState(null);

  const fetchRecurring = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await recurringService.getAll();
      setRecurringItems(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load recurring schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setModalLoading(true);
      if (editingItem) {
        await recurringService.update(editingItem._id, formData);
      } else {
        await recurringService.create(formData);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      await fetchRecurring();
    } catch (err) {
      alert(err.message || 'Failed to save recurring rule');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await recurringService.update(item._id, { active: !item.active });
      await fetchRecurring();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleTriggerJob = async () => {
    try {
      setJobLoading(true);
      setJobResult(null);
      const res = await recurringService.triggerProcess();
      setJobResult(res.message);
      await fetchRecurring();
    } catch (err) {
      alert(err.message || 'Failed to execute job');
    } finally {
      setJobLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await recurringService.delete(deleteId);
      setDeleteId(null);
      await fetchRecurring();
    } catch (err) {
      alert(err.message || 'Failed to delete recurring schedule');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recurring Transactions & Automation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Idempotent background scheduler for automated payroll, subscriptions, rent, and utility bills
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTriggerJob}
            disabled={jobLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-60"
          >
            <Zap className="w-4 h-4" />
            <span>{jobLoading ? 'Processing Job...' : 'Run Scheduler Now'}</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      {jobResult && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{jobResult}</span>
          </div>
          <button onClick={() => setJobResult(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Rules List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Frequency</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Next Due Date</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                  </tr>
                ))
              ) : recurringItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No recurring transaction schedules created yet.
                  </td>
                </tr>
              ) : (
                recurringItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-600 font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                        {item.frequency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(item.nextRunDate)}</span>
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 font-bold text-right whitespace-nowrap ${
                      item.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {item.type === 'income' ? '+' : '-'}{format(item.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          item.active
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {item.active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Edit Schedule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(item._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingItem}
        isLoading={modalLoading}
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Recurring Schedule"
        message="Are you sure you want to delete this recurring automation rule? Generated past transactions will remain intact."
        confirmText="Delete Rule"
        isLoading={deleteLoading}
      />
    </div>
  );
};
