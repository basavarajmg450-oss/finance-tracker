import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';

export class AnalyticsService {
  static getDateRange(period = 'this_month', customStart = null, customEnd = null) {
    const now = new Date();
    let startDate;
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (period) {
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case 'last_3_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case 'last_6_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'custom':
        startDate = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = customEnd ? new Date(new Date(customEnd).setHours(23, 59, 59, 999)) : now;
        break;
      case 'all':
      default:
        startDate = new Date(2000, 0, 1);
        break;
    }

    return { startDate, endDate };
  }

  static async getDashboardSummary(userId, period = 'this_month', customStart = null, customEnd = null) {
    const uId = new mongoose.Types.ObjectId(userId);
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Period totals
    const periodData = await Transaction.aggregate([
      {
        $match: {
          userId: uId,
          transactionDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    let transactionCount = 0;

    periodData.forEach(item => {
      transactionCount += item.count;
      if (item._id === 'income') totalIncome = item.totalAmount;
      if (item._id === 'expense') totalExpenses = item.totalAmount;
    });

    const netCashFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Number((((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(2)) : null;

    // 2. All-time balance (All time income - all time expenses)
    const allTimeData = await Transaction.aggregate([
      { $match: { userId: uId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    let allTimeIncome = 0;
    let allTimeExpense = 0;
    allTimeData.forEach(i => {
      if (i._id === 'income') allTimeIncome = i.total;
      if (i._id === 'expense') allTimeExpense = i.total;
    });
    const currentBalance = allTimeIncome - allTimeExpense;

    // 3. Current Month Budget Usage
    const currentMonthBudgets = await Budget.find({ userId: uId, month: currentMonth, year: currentYear });
    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const currentMonthExpenseData = await Transaction.aggregate([
      {
        $match: {
          userId: uId,
          type: 'expense',
          transactionDate: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' }
        }
      }
    ]);

    const spentByCatMap = {};
    let totalCurrentMonthExpense = 0;
    currentMonthExpenseData.forEach(c => {
      spentByCatMap[c._id] = c.spent;
      totalCurrentMonthExpense += c.spent;
    });

    // Check overall budget if exists, or sum of category budgets
    const overallBudgetObj = currentMonthBudgets.find(b => !b.category || b.category === 'Overall');
    let totalBudgetedAmount = 0;
    let totalBudgetSpent = 0;

    if (overallBudgetObj) {
      totalBudgetedAmount = overallBudgetObj.amount;
      totalBudgetSpent = totalCurrentMonthExpense;
    } else if (currentMonthBudgets.length > 0) {
      currentMonthBudgets.forEach(b => {
        totalBudgetedAmount += b.amount;
        totalBudgetSpent += (spentByCatMap[b.category] || 0);
      });
    }

    const budgetUsagePercent = totalBudgetedAmount > 0
      ? Number(((totalBudgetSpent / totalBudgetedAmount) * 100).toFixed(2))
      : 0;

    // 4. Recent Transactions (last 6)
    const recentTransactions = await Transaction.find({ userId: uId })
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(6);

    return {
      period,
      startDate,
      endDate,
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netCashFlow: Number(netCashFlow.toFixed(2)),
      currentBalance: Number(currentBalance.toFixed(2)),
      savingsRate,
      transactionCount,
      budgetSummary: {
        totalBudgeted: Number(totalBudgetedAmount.toFixed(2)),
        totalSpent: Number(totalBudgetSpent.toFixed(2)),
        remaining: Number(Math.max(0, totalBudgetedAmount - totalBudgetSpent).toFixed(2)),
        usagePercent: budgetUsagePercent
      },
      recentTransactions
    };
  }

  static async getCategoryBreakdown(userId, period = 'this_month', type = 'expense', customStart = null, customEnd = null) {
    const uId = new mongoose.Types.ObjectId(userId);
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    const matchStage = {
      userId: uId,
      transactionDate: { $gte: startDate, $lte: endDate }
    };
    if (type && (type === 'income' || type === 'expense')) {
      matchStage.type = type;
    }

    const results = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const totalSum = results.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const categories = results.map(item => ({
      category: item._id.category,
      type: item._id.type,
      amount: Number(item.totalAmount.toFixed(2)),
      count: item.count,
      percentage: totalSum > 0 ? Number(((item.totalAmount / totalSum) * 100).toFixed(1)) : 0
    }));

    return {
      period,
      type,
      totalSum: Number(totalSum.toFixed(2)),
      categories
    };
  }

  static async getMonthlyTrends(userId, monthsCount = 6) {
    const uId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1), 1);

    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          userId: uId,
          transactionDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Build standard month buckets
    const trends = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const monthLabel = `${monthNames[m - 1]} ${y}`;

      const incomeEntry = monthlyData.find(item => item._id.year === y && item._id.month === m && item._id.type === 'income');
      const expenseEntry = monthlyData.find(item => item._id.year === y && item._id.month === m && item._id.type === 'expense');

      const income = incomeEntry ? incomeEntry.total : 0;
      const expense = expenseEntry ? expenseEntry.total : 0;
      const netSavings = income - expense;
      const savingsRate = income > 0 ? Number((((income - expense) / income) * 100).toFixed(1)) : 0;

      trends.push({
        year: y,
        month: m,
        label: monthLabel,
        income: Number(income.toFixed(2)),
        expense: Number(expense.toFixed(2)),
        netSavings: Number(netSavings.toFixed(2)),
        savingsRate
      });
    }

    return trends;
  }

  static async getAnalyticsOverview(userId, period = 'this_month', customStart = null, customEnd = null) {
    const uId = new mongoose.Types.ObjectId(userId);
    const { startDate, endDate } = this.getDateRange(period, customStart, customEnd);

    const [summary, expenseBreakdown, incomeBreakdown, monthlyTrends] = await Promise.all([
      this.getDashboardSummary(uId, period, customStart, customEnd),
      this.getCategoryBreakdown(uId, period, 'expense', customStart, customEnd),
      this.getCategoryBreakdown(uId, period, 'income', customStart, customEnd),
      this.getMonthlyTrends(uId, 6)
    ]);

    // Calculate daily average expense
    const daySpan = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const averageDailyExpense = Number((summary.totalExpenses / daySpan).toFixed(2));

    return {
      summary,
      averageDailyExpense,
      daySpan,
      expenseBreakdown: expenseBreakdown.categories,
      incomeBreakdown: incomeBreakdown.categories,
      monthlyTrends
    };
  }
}
