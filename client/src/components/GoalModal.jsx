import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Target, DollarSign, Calendar } from 'lucide-react';

export const GoalModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      targetAmount: '',
      targetDate: '',
      status: 'in_progress'
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        targetAmount: initialData.targetAmount || '',
        targetDate: initialData.targetDate ? new Date(initialData.targetDate).toISOString().split('T')[0] : '',
        status: initialData.status || 'in_progress'
      });
    } else {
      reset({
        title: '',
        targetAmount: '',
        targetDate: '',
        status: 'in_progress'
      });
    }
  }, [initialData, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-900">
            {initialData ? 'Edit Savings Goal' : 'Create Financial Goal'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Goal Title <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Target className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. Emergency Fund, New Laptop, Vacation"
                {...register('title', {
                  required: 'Title is required',
                  maxLength: { value: 100, message: 'Max 100 characters' }
                })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="1"
                placeholder="1000"
                {...register('targetAmount', {
                  required: 'Target amount is required',
                  min: { value: 1, message: 'Must be at least 1' },
                  valueAsNumber: true
                })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {errors.targetAmount && <p className="text-xs text-rose-500 mt-1">{errors.targetAmount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                {...register('targetDate')}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {initialData && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:bg-indigo-400"
            >
              {isLoading ? 'Saving...' : initialData ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
