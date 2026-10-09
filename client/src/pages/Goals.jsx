import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { goalService } from '../services/goalService.js';
import { GoalModal } from '../components/GoalModal.jsx';
import { ContributionModal } from '../components/ContributionModal.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { formatDate } from '../utils/formatters.js';
import {
  Plus,
  Target,
  PiggyBank,
  CheckCircle2,
  Clock,
  History,
  Trash2,
  Edit2,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';

export const Goals = () => {
  const { format } = useCurrency();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalLoading, setGoalLoading] = useState(false);

  const [activeDepositGoal, setActiveDepositGoal] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);

  const [historyGoal, setHistoryGoal] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await goalService.getAll();
      setGoals(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateOrUpdateGoal = async (formData) => {
    try {
      setGoalLoading(true);
      if (editingGoal) {
        await goalService.update(editingGoal._id, formData);
      } else {
        await goalService.create(formData);
      }
      setIsGoalModalOpen(false);
      setEditingGoal(null);
      await fetchGoals();
    } catch (err) {
      alert(err.message || 'Failed to save goal');
    } finally {
      setGoalLoading(false);
    }
  };

  const handleDepositSubmit = async (goalId, data) => {
    try {
      setDepositLoading(true);
      await goalService.addContribution(goalId, data);
      setActiveDepositGoal(null);
      await fetchGoals();
    } catch (err) {
      alert(err.message || 'Failed to record contribution');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleViewHistory = async (goal) => {
    try {
      setHistoryGoal(goal);
      setHistoryLoading(true);
      const res = await goalService.getContributions(goal._id);
      setContributions(res.data || []);
    } catch (err) {
      alert(err.message || 'Failed to load contribution history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setDeleteLoading(true);
      await goalService.delete(deleteId);
      setDeleteId(null);
      await fetchGoals();
    } catch (err) {
      alert(err.message || 'Failed to delete goal');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const completedGoalsCount = goals.filter((g) => g.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Savings & Financial Goals</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atomic savings ledger isolated from operational transactions for clean accounting
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setIsGoalModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Goal</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Portfolio Goal Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            Savings Portfolio Overview
          </span>
          <h3 className="text-2xl font-bold mt-1 text-white">
            {format(totalSaved)} <span className="text-sm font-normal text-slate-300">accumulated towards {format(totalTarget)} target</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {completedGoalsCount} of {goals.length} goals achieved (
            {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}% overall completion)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{completedGoalsCount} Goals Reached</span>
          </span>
        </div>
      </div>

      {/* Goals Grid */}
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
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Financial Goals Created Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Set targets for an Emergency Fund, Tech Upgrade, Vehicle, or Education with dedicated progress tracking.
          </p>
          <button
            onClick={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => (
            <div
              key={g._id}
              className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
                g.status === 'completed'
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 leading-snug">{g.title}</h4>
                    {g.targetDate && (
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Target: {formatDate(g.targetDate)}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingGoal(g);
                        setIsGoalModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(g._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-slate-900">{format(g.currentAmount)}</span>
                    <span className="text-xs text-slate-500 ml-1.5">of {format(g.targetAmount)}</span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      g.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {g.percentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="my-3">
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        g.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, g.percentage)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Remaining: <strong className="text-slate-800">{format(g.remaining)}</strong>
                  </span>
                  <button
                    onClick={() => handleViewHistory(g)}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <History className="w-3 h-3" />
                    <span>History</span>
                  </button>
                </div>
              </div>

              {/* Deposit Action */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setActiveDepositGoal(g)}
                  disabled={g.status === 'completed'}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <PiggyBank className="w-4 h-4" />
                  <span>{g.status === 'completed' ? 'Goal Completed' : 'Deposit Savings'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contribution History Modal */}
      {historyGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Deposit History</h3>
                <p className="text-xs text-indigo-600 font-medium">{historyGoal.title}</p>
              </div>
              <button onClick={() => setHistoryGoal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                ?
              </button>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto divide-y divide-slate-100">
              {historyLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
              ) : contributions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No deposits recorded yet for this goal.
                </div>
              ) : (
                contributions.map((c) => (
                  <div key={c._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{format(c.amount)}</p>
                      <p className="text-[11px] text-slate-500">{formatDate(c.contributionDate)} {c.notes ? `• ${c.notes}` : ''}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Atomic $inc
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleCreateOrUpdateGoal}
        initialData={editingGoal}
        isLoading={goalLoading}
      />

      {/* Deposit Contribution Modal */}
      <ContributionModal
        isOpen={!!activeDepositGoal}
        onClose={() => setActiveDepositGoal(null)}
        onSubmit={handleDepositSubmit}
        goal={activeDepositGoal}
        isLoading={depositLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal? All associated deposit history records will also be removed."
        confirmText="Delete Goal"
        isLoading={deleteLoading}
      />
    </div>
  );
};
