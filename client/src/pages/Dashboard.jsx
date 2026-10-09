import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { analyticsService } from '../services/analyticsService.js';
import { transactionService } from '../services/transactionService.js';
import { MetricCard } from '../components/MetricCard.jsx';
import { InsightCard } from '../components/InsightCard.jsx';
import { TransactionModal } from '../components/TransactionModal.jsx';
import { CardSkeleton, Skeleton } from '../components/Skeleton.jsx';
import { formatDate } from '../utils/formatters.js';
import { CATEGORY_COLORS } from '../utils/constants.js';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
  ArrowRight,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

export const Dashboard = () => {
  const { format } = useCurrency();
  const [period, setPeriod] = useState('this_month');
  const [dashboardData, setDashboardData] = useState(null);
  const [trendsData, setTrendsData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const [summaryRes, trendsRes, catRes] = await Promise.all([
        analyticsService.getDashboardSummary({ period }),
        analyticsService.getMonthlyTrends({ months: 6 }),
        analyticsService.getCategoryBreakdown({ period, type: 'expense' })
      ]);

      setDashboardData(summaryRes.data);
      setTrendsData(trendsRes.data || []);
      setCategoryData(catRes.data?.categories || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const handleCreateTransaction = async (formData) => {
    try {
      setModalLoading(true);
      await transactionService.create(formData);
      setIsModalOpen(false);
      await fetchDashboard();
    } catch (err) {
      alert(err.message || 'Failed to save transaction');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
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
    totalIncome = 0,
    totalExpenses = 0,
    netCashFlow = 0,
    currentBalance = 0,
    savingsRate = null,
    budgetSummary = {},
    recentTransactions = [],
    insights = []
  } = dashboardData || {};

  // Data formatted for income vs expenses comparison bar
  const comparisonData = [
    { name: 'Total Income', amount: totalIncome, fill: '#10b981' },
    { name: 'Total Expenses', amount: totalExpenses, fill: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time financial telemetry & MongoDB transaction analytics</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Period Filter Dropdown */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="this_year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Add Transaction Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Income"
          value={format(totalIncome)}
          subtitle="Earned in period"
          icon={TrendingUp}
          trend="positive"
          badge="Inflow"
        />
        <MetricCard
          title="Total Expenses"
          value={format(totalExpenses)}
          subtitle="Spent in period"
          icon={TrendingDown}
          trend="negative"
          badge="Outflow"
        />
        <MetricCard
          title="Net Cash Flow"
          value={format(netCashFlow)}
          subtitle={netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
          icon={Wallet}
          trend={netCashFlow >= 0 ? 'positive' : 'negative'}
          badge={netCashFlow >= 0 ? '+ Positive' : '- Deficit'}
        />
        <MetricCard
          title="Savings Rate"
          value={savingsRate !== null ? `${savingsRate}%` : 'N/A'}
          subtitle={savingsRate === null ? 'No income in period' : 'Target: > 20%'}
          icon={PiggyBank}
          trend={savingsRate !== null && savingsRate >= 20 ? 'positive' : savingsRate !== null && savingsRate < 0 ? 'negative' : 'warning'}
          badge="Formula: (Net / Income)"
        />
      </div>

      {/* Secondary Status Banner: All-Time Balance & Budget Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">All-Time Net Balance</span>
            <h3 className="text-3xl font-extrabold mt-1 tracking-tight text-white">{format(currentBalance)}</h3>
            <p className="text-xs text-slate-400 mt-1">Cumulative balance across all recorded transactions.</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <span>Live MongoDB Aggregation</span>
            <Link to="/transactions" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              <span>View ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Budget Utilization</span>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                {format(budgetSummary.totalSpent || 0)} <span className="text-xs font-normal text-slate-500">of {format(budgetSummary.totalBudgeted || 0)} allocated</span>
              </h4>
            </div>
            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
              (budgetSummary.usagePercent || 0) > 100
                ? 'bg-rose-100 text-rose-700'
                : (budgetSummary.usagePercent || 0) >= 80
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {(budgetSummary.usagePercent || 0)}% Used
            </span>
          </div>

          <div className="my-3">
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (budgetSummary.usagePercent || 0) > 100
                    ? 'bg-rose-500'
                    : (budgetSummary.usagePercent || 0) >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budgetSummary.usagePercent || 0)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Remaining Budget: <strong className="text-slate-800">{format(budgetSummary.remaining || 0)}</strong></span>
            <Link to="/budgets" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
              <span>Manage Budgets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Period Income vs Expenses</h3>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(val) => [format(val), 'Amount']}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Expense Distribution by Category</h3>
            </div>
          </div>
          <div className="h-64 w-full">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No expense transactions recorded in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [format(val), 'Spent']}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 6-Month Trend Line/Area Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">6-Month Cash Flow Trend</h3>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendsData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(val) => [format(val)]}
                contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#incomeGrad)" name="Income" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#expenseGrad)" name="Expense" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Smart Insights & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Rule-Based Insights Engine */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Smart Financial Insights</h3>
              <p className="text-[11px] text-slate-500">Rules-based evaluation of your MongoDB records</p>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              {insights.length} Insights Detected
            </span>
          </div>

          <div className="space-y-3">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
              <Link to="/transactions" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No transactions recorded yet. Click "Add Transaction" to start tracking.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <div key={tx._id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          tx.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{tx.description}</p>
                        <p className="text-[11px] text-slate-500">{tx.category} • {formatDate(tx.transactionDate)}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold whitespace-nowrap ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{format(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              + Record new income or expense
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTransaction}
        isLoading={modalLoading}
      />
    </div>
  );
};
