import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext.jsx';
import { reportService } from '../services/reportService.js';
import { MetricCard } from '../components/MetricCard.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { formatDate } from '../utils/formatters.js';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  Layers
} from 'lucide-react';

export const Reports = () => {
  const { format } = useCurrency();
  const [period, setPeriod] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        period,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined
      };
      const res = await reportService.getSummary(params);
      setReportData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to generate financial report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (startDate && endDate)) {
      fetchReport();
    }
  }, [period, startDate, endDate]);

  const handleExportCsv = () => {
    const params = {
      startDate: reportData?.startDate ? new Date(reportData.startDate).toISOString() : undefined,
      endDate: reportData?.endDate ? new Date(reportData.endDate).toISOString() : undefined
    };
    const exportUrl = reportService.getExportCsvUrl(params);
    window.open(exportUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const {
    summary = {},
    expenseBreakdown = [],
    incomeBreakdown = []
  } = reportData || {};

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Reports & Statements</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade reporting with RFC 4180 escaped CSV exports & print-ready statements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Statement</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Statement Period:</span>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="last_3_months">Last Quarter (3 Months)</option>
          <option value="this_year">Current Year</option>
          <option value="all">Complete History</option>
          <option value="custom">Custom Date Range</option>
        </select>

        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-lg"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-lg"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Printable Financial Statement Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:shadow-none">
        {/* Statement Title Header */}
        <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Official Financial Statement</span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">Comprehensive Income & Expenditure Summary</h2>
            <p className="text-xs text-slate-500 mt-1">
              Period: {formatDate(reportData?.startDate)} — {formatDate(reportData?.endDate)}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-500">
            <p>Generated on: <strong>{new Date().toLocaleDateString()}</strong></p>
            <p>Database: <strong>MongoDB v8.0 / Replica</strong></p>
          </div>
        </div>

        {/* Top KPI Metrics */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Gross Income</span>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">{format(summary.totalIncome || 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Gross Expenses</span>
              <p className="text-xl font-extrabold text-rose-600 mt-1">{format(summary.totalExpenses || 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Net Cash Flow</span>
              <p className={`text-xl font-extrabold mt-1 ${(summary.netCashFlow || 0) >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                {format(summary.netCashFlow || 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Savings Rate</span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">
                {summary.savingsRate !== null ? `${summary.savingsRate}%` : 'N/A'}
              </p>
            </div>
          </div>
        )}

        {/* Detailed Breakdown Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Expense Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Expenditure Breakdown by Category
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Txns</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {expenseBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No expenses recorded
                      </td>
                    </tr>
                  ) : (
                    expenseBreakdown.map((c) => (
                      <tr key={c.category}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{c.category}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{c.count}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{format(c.amount)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">{c.percentage}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Income Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Income Inflow by Category
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Source Category</th>
                    <th className="py-2.5 px-3 text-center">Txns</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {incomeBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No income recorded
                      </td>
                    </tr>
                  ) : (
                    incomeBreakdown.map((c) => (
                      <tr key={c.category}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{c.category}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{c.count}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600">{format(c.amount)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">{c.percentage}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Security & Sanitization Note */}
        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Formula Injection Safeguard Active (Neutralized '=', '+', '-', '@' prefixes)</span>
          <span>Smart Expense Tracking System • CSE Project</span>
        </div>
      </div>
    </div>
  );
};
