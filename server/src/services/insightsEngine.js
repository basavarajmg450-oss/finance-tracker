import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';
import mongoose from 'mongoose';

export class InsightsEngine {
  /**
   * Generates actionable, rule-based insights from real user transaction and budget data.
   * Pluggable design allows extending with AI summarizers in the future.
   */
  static async generateInsights(userId, options = {}) {
    const uId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    const insights = [];

    // 1. Current month date range
    const startOfCurrentMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfCurrentMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // 2. Previous month date range
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const startOfPrevMonth = new Date(prevMonthYear, prevMonth - 1, 1);
    const endOfPrevMonth = new Date(prevMonthYear, prevMonth, 0, 23, 59, 59, 999);

    // Fetch current and previous month transactions
    const [currMonthData, prevMonthData, budgets] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: uId, transactionDate: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth } } },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Transaction.aggregate([
        { $match: { userId: uId, transactionDate: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Budget.find({ userId: uId, month: currentMonth, year: currentYear })
    ]);

    // Compute totals for current month
    let currIncome = 0;
    let currExpense = 0;
    const currExpenseByCategory = {};

    currMonthData.forEach(item => {
      if (item._id.type === 'income') {
        currIncome += item.totalAmount;
      } else if (item._id.type === 'expense') {
        currExpense += item.totalAmount;
        currExpenseByCategory[item._id.category] = item.totalAmount;
      }
    });

    // Compute totals for previous month
    let prevIncome = 0;
    let prevExpense = 0;
    const prevExpenseByCategory = {};

    prevMonthData.forEach(item => {
      if (item._id.type === 'income') {
        prevIncome += item.totalAmount;
      } else if (item._id.type === 'expense') {
        prevExpense += item.totalAmount;
        prevExpenseByCategory[item._id.category] = item.totalAmount;
      }
    });

    // Rule 1: Cash Flow Deficit Warning (Expenses > Income)
    if (currExpense > currIncome && currExpense > 0) {
      const deficit = currExpense - currIncome;
      insights.push({
        id: 'deficit-warning',
        type: 'danger',
        title: 'Negative Cash Flow Alert',
        message: `Your expenses exceed your income this month by ${deficit.toFixed(2)}. Consider cutting discretionary spending.`,
        calculation: `Total Expenses (${currExpense.toFixed(2)}) > Total Income (${currIncome.toFixed(2)}) = Deficit of ${deficit.toFixed(2)}`,
        category: 'Cash Flow'
      });
    }

    // Rule 2: Savings Rate Trend
    const currSavingsRate = currIncome > 0 ? ((currIncome - currExpense) / currIncome) * 100 : null;
    const prevSavingsRate = prevIncome > 0 ? ((prevIncome - prevExpense) / prevIncome) * 100 : null;

    if (currSavingsRate !== null && prevSavingsRate !== null) {
      const diff = currSavingsRate - prevSavingsRate;
      if (diff >= 5) {
        insights.push({
          id: 'savings-rate-improved',
          type: 'success',
          title: 'Savings Rate Improved',
          message: `Great job! Your savings rate increased by ${diff.toFixed(1)}% compared to last month (now ${currSavingsRate.toFixed(1)}%).`,
          calculation: `Current: ${currSavingsRate.toFixed(1)}% vs Previous: ${prevSavingsRate.toFixed(1)}% (+${diff.toFixed(1)}%)`,
          category: 'Savings'
        });
      } else if (diff <= -5) {
        insights.push({
          id: 'savings-rate-declined',
          type: 'warning',
          title: 'Savings Rate Dropped',
          message: `Your savings rate dropped by ${Math.abs(diff).toFixed(1)}% compared to last month.`,
          calculation: `Current: ${currSavingsRate.toFixed(1)}% vs Previous: ${prevSavingsRate.toFixed(1)}% (${diff.toFixed(1)}%)`,
          category: 'Savings'
        });
      }
    }

    // Rule 3: Category Spending Spike compared to last month (> 20% increase)
    for (const [category, amount] of Object.entries(currExpenseByCategory)) {
      const prevAmount = prevExpenseByCategory[category] || 0;
      if (prevAmount > 0 && amount > prevAmount) {
        const percentIncrease = ((amount - prevAmount) / prevAmount) * 100;
        if (percentIncrease >= 20 && (amount - prevAmount) >= 50) {
          insights.push({
            id: `spike-${category.toLowerCase().replace(/\s+/g, '-')}`,
            type: 'warning',
            title: `${category} Spending Spike`,
            message: `Spending on ${category} is up by ${percentIncrease.toFixed(1)}% compared to last month.`,
            calculation: `Current: ${amount.toFixed(2)} vs Previous: ${prevAmount.toFixed(2)} (+${(amount - prevAmount).toFixed(2)})`,
            category
          });
        }
      }
    }

    // Rule 4: Dominant Expense Category (> 35% of total expenses)
    if (currExpense > 0) {
      for (const [category, amount] of Object.entries(currExpenseByCategory)) {
        const share = (amount / currExpense) * 100;
        if (share >= 35) {
          insights.push({
            id: `dominant-${category.toLowerCase().replace(/\s+/g, '-')}`,
            type: 'info',
            title: `Dominant Category: ${category}`,
            message: `${category} accounts for ${share.toFixed(1)}% of your total spending this month.`,
            calculation: `${amount.toFixed(2)} / ${currExpense.toFixed(2)} = ${share.toFixed(1)}%`,
            category
          });
        }
      }
    }

    // Rule 5: Budget Threshold Violations & Warnings
    for (const budget of budgets) {
      const spent = budget.category
        ? (currExpenseByCategory[budget.category] || 0)
        : currExpense;
      const pct = (spent / budget.amount) * 100;
      const name = budget.category || 'Overall Monthly Budget';

      if (pct >= 100) {
        insights.push({
          id: `budget-exceeded-${budget._id}`,
          type: 'danger',
          title: `Budget Exceeded: ${name}`,
          message: `You have exceeded your budget for ${name} by ${(spent - budget.amount).toFixed(2)} (${pct.toFixed(1)}% used).`,
          calculation: `Spent: ${spent.toFixed(2)} / Budget: ${budget.amount.toFixed(2)} (${pct.toFixed(1)}%)`,
          category: budget.category || 'Budget'
        });
      } else if (pct >= 80) {
        insights.push({
          id: `budget-alert-${budget._id}`,
          type: 'warning',
          title: `Budget Alert: ${name}`,
          message: `You have used ${pct.toFixed(1)}% of your ${name} budget. Remaining: ${(budget.amount - spent).toFixed(2)}.`,
          calculation: `Spent: ${spent.toFixed(2)} / Budget: ${budget.amount.toFixed(2)}`,
          category: budget.category || 'Budget'
        });
      }
    }

    // Rule 6: Discretionary Savings Recommendation
    const discretionaryCategories = ['Shopping', 'Entertainment', 'Subscriptions', 'Food'];
    let discretionarySpend = 0;
    discretionaryCategories.forEach(cat => {
      if (currExpenseByCategory[cat]) discretionarySpend += currExpenseByCategory[cat];
    });

    if (discretionarySpend > 100) {
      const potentialSave = discretionarySpend * 0.15;
      insights.push({
        id: 'discretionary-savings-recommendation',
        type: 'info',
        title: 'Discretionary Savings Opportunity',
        message: `Trimming 15% from discretionary spending (Shopping, Food, Entertainment, Subscriptions) could save you approx. ${potentialSave.toFixed(2)} this month.`,
        calculation: `15% of discretionary spend (${discretionarySpend.toFixed(2)}) = ${potentialSave.toFixed(2)}`,
        category: 'Savings Opportunity'
      });
    }

    // Default insight if empty
    if (insights.length === 0) {
      insights.push({
        id: 'healthy-financials',
        type: 'success',
        title: 'Financial Health on Track',
        message: 'Your spending is currently within normal limits with no budget overruns or irregular spending spikes detected.',
        calculation: 'All categories within budget limits and positive cash flow maintained',
        category: 'Overview'
      });
    }

    return insights;
  }
}
