import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { analyticsService } from '../services/analyticsService.js';
import { MetricCard } from '../components/MetricCard.jsx';
import { CardSkeleton, Skeleton } from '../components/Skeleton.jsx';
import { CATEGORY_COLORS } from '../utils/constants.js';
import {
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';

export const Analytics = () => {
  const { format } = useCurrency();
  const [period, setPeriod] = useState('this_month');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await analyticsService.getOverview({ period });
      setOverview(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [period]);

  if (loading && !overview) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const {
    summary = {},
    averageDailyExpense = 0,
    daySpan = 30,
    expenseBreakdown = [],
    incomeBreakdown = [],
    monthlyTrends = []
  } = overview || {};

  const topExpenseCategories = expenseBreakdown.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Intelligence & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deep insights derived from stored transactions via MongoDB aggregation pipelines
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="last_3_months">Last 3 Months</option>
          <option value="last_6_months">Last 6 Months</option>
          <option value="this_year">This Year</option>
          <option value="all">All Time History</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Average Expense"
          value={format(averageDailyExpense)}
          subtitle={`Across active ${daySpan} day span`}
          icon={Calendar}
          trend="neutral"
        />
        <MetricCard
          title="Total Cash Inflow"
          value={format(summary.totalIncome || 0)}
          subtitle="All income sources"
          icon={TrendingUp}
          trend="positive"
        />
        <MetricCard
          title="Total Outflow"
          value={format(summary.totalExpenses || 0)}
          subtitle="All category expenditures"
          icon={BarChart3}
          trend="negative"
        />
        <MetricCard
          title="Savings Performance"
          value={summary.savingsRate !== null ? `${summary.savingsRate}%` : 'N/A'}
          subtitle="Net cash flow / Gross income"
          icon={Percent}
          trend={summary.savingsRate !== null && summary.savingsRate > 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* 6-Month Income vs Expense Trend Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Month-over-Month Cash Flow & Savings Trend</h3>
            <p className="text-[11px] text-slate-500">Historical trend grouped by monthly aggregation buckets</p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(val, name) => [format(val), name === 'income' ? 'Income' : name === 'expense' ? 'Expense' : 'Net Savings']}
                contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[6, 6, 0, 0]} />
              <Bar dataKey="netSavings" fill="#6366f1" name="Net Savings" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown & Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Category Breakdown Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Expense Breakdown by Category</h3>
            <span className="text-xs font-semibold text-slate-500">{expenseBreakdown.length} Categories</span>
          </div>
          <div className="h-64 w-full">
            {expenseBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No expense transactions recorded in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {expenseBreakdown.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [format(val), 'Amount']}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Spending Categories List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Highest Spending Categories</h3>
            <span className="text-[11px] font-semibold text-slate-500">Ranked by Outflow</span>
          </div>

          {topExpenseCategories.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No expenses recorded in the selected timeframe.
            </div>
          ) : (
            <div className="space-y-4">
              {topExpenseCategories.map((item, idx) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800">{item.category}</span>
                      <span className="text-[11px] text-slate-400">({item.count} txns)</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-slate-900">{format(item.amount)}</strong>
                      <span className="text-slate-400 text-[11px] ml-1.5">({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[item.category] || '#6366f1'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Month-over-Month Detailed Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Historical Monthly Performance Ledger</h3>
          <p className="text-[11px] text-slate-500">Aggregated income, expenditure, and savings rate by calendar month</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Total Income</th>
                <th className="py-3 px-4">Total Expenses</th>
                <th className="py-3 px-4">Net Savings</th>
                <th className="py-3 px-4 text-right">Savings Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {monthlyTrends.map((trend) => (
                <tr key={trend.label} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{trend.label}</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-medium">{format(trend.income)}</td>
                  <td className="py-3.5 px-4 text-rose-600 font-medium">{format(trend.expense)}</td>
                  <td className={`py-3.5 px-4 font-bold ${trend.netSavings >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                    {format(trend.netSavings)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                      trend.savingsRate >= 20
                        ? 'bg-emerald-100 text-emerald-700'
                        : trend.savingsRate > 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {trend.savingsRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
