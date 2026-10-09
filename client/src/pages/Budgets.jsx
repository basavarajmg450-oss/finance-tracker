import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { budgetService } from '../services/budgetService.js';
import { BudgetModal } from '../components/BudgetModal.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import {
  Plus,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const Budgets = () => {
  const { format } = useCurrency();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [meta, setMeta] = useState({ totalBudgeted: 0, totalSpentInMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await budgetService.getAll({ month: selectedMonth, year: selectedYear });
      setBudgets(res.data || []);
      setMeta(res.meta || { totalBudgeted: 0, totalSpentInMonth: 0 });
    } catch (err) {
      setError(err.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const handleCreateOrUpdate = async (formData) => {
    try {
      setModalLoading(true);
      if (editingBudget) {
        await budgetService.update(editingBudget._id, formData);
      } else {
        await budgetService.create(formData);
      }
      setIsModalOpen(false);
      setEditingBudget(null);
      await fetchBudgets();
    } catch (err) {
      alert(err.message || 'Failed to save budget');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await budgetService.delete(deleteId);
      setDeleteId(null);
      await fetchBudgets();
    } catch (err) {
      alert(err.message || 'Failed to delete budget');
    } finally {
      setDeleteLoading(false);
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Budget Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set spending thresholds per category with automated 80% warnings and 100% overrun alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month & Year Selectors */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="px-2 py-1 bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-2 py-1 bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Budget</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Month Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            {monthName} {selectedYear} Allocation Summary
          </span>
          <h3 className="text-2xl font-bold mt-1 text-white">
            {format(meta.totalSpentInMonth)} <span className="text-sm font-normal text-slate-300">Total Spent</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Total Allocated Budget Across Rules: <strong className="text-white">{format(meta.totalBudgeted)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-indigo-800/60 border border-indigo-700 text-xs font-semibold text-indigo-200">
            {budgets.length} Active Budget Rules
          </span>
        </div>
      </div>

      {/* Budget Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Budgets Defined for {monthName} {selectedYear}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Plan your monthly spending by setting limit rules for categories like Food, Rent, or an Overall cap.
          </p>
          <button
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
          >
            Create First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => (
            <div
              key={b._id}
              className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
                b.isExceeded
                  ? 'border-rose-300 ring-1 ring-rose-300/50'
                  : b.isNearLimit
                  ? 'border-amber-300 ring-1 ring-amber-300/50'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{b.category}</span>
                    {b.category === 'Overall' && (
                      <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                        Total Limit
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingBudget(b);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(b._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <div>
                    <span className="text-2xl font-extrabold text-slate-900">{format(b.spent)}</span>
                    <span className="text-xs text-slate-500 ml-1.5">spent of {format(b.amount)}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    b.isExceeded
                      ? 'bg-rose-100 text-rose-700'
                      : b.isNearLimit
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {b.percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="my-3">
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.isExceeded ? 'bg-rose-500' : b.isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                </div>

                {/* Status Callout */}
                {b.isExceeded ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Over budget by {format(Math.abs(b.remaining))}</span>
                  </div>
                ) : b.isNearLimit ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Warning: 80%+ limit reached. Remaining: {format(b.remaining)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>On track. Remaining: <strong className="text-slate-700">{format(b.remaining)}</strong></span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingBudget}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
        isLoading={modalLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Budget Rule"
        message="Are you sure you want to remove this budget allocation? Past transactions won't be deleted."
        confirmText="Remove Budget"
        isLoading={deleteLoading}
      />
    </div>
  );
};
