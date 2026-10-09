import mongoose from 'mongoose';
import { Budget } from '../models/Budget.js';
import { Transaction } from '../models/Transaction.js';

export const getBudgets = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const budgets = await Budget.find({
      userId: req.user._id,
      month,
      year
    });

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Compute actual spending per category in that month
    const expenseData = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'expense',
          transactionDate: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' }
        }
      }
    ]);

    const spentMap = {};
    let totalExpenseInMonth = 0;
    expenseData.forEach(e => {
      spentMap[e._id] = e.spent;
      totalExpenseInMonth += e.spent;
    });

    const populatedBudgets = budgets.map(b => {
      const isOverall = !b.category || b.category === 'Overall';
      const spent = isOverall ? totalExpenseInMonth : (spentMap[b.category] || 0);
      const remaining = Number((b.amount - spent).toFixed(2));
      const percentage = Number(((spent / b.amount) * 100).toFixed(1));
      const isExceeded = spent > b.amount;
      const isNearLimit = percentage >= 80 && !isExceeded;

      return {
        _id: b._id,
        category: b.category || 'Overall',
        amount: b.amount,
        month: b.month,
        year: b.year,
        spent: Number(spent.toFixed(2)),
        remaining,
        percentage,
        isExceeded,
        isNearLimit,
        createdAt: b.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: populatedBudgets,
      meta: {
        month,
        year,
        totalBudgeted: budgets.reduce((acc, b) => acc + b.amount, 0),
        totalSpentInMonth: totalExpenseInMonth
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year } = req.body;
    const normCategory = category === 'Overall' || !category ? null : category;

    // Check for existing budget for this user, category, month, and year
    const existing = await Budget.findOne({
      userId: req.user._id,
      category: normCategory,
      month,
      year
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A budget for ${normCategory || 'Overall'} already exists for month ${month}/${year}. Please edit the existing budget.`
      });
    }

    const budget = await Budget.create({
      userId: req.user._id,
      category: normCategory,
      amount,
      month,
      year
    });

    res.status(201).json({
      success: true,
      message: 'Budget allocated successfully',
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid budget ID' });
    }

    const budget = await Budget.findOne({ _id: id, userId: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    if (req.body.category !== undefined) {
      budget.category = req.body.category === 'Overall' || !req.body.category ? null : req.body.category;
    }
    if (req.body.amount !== undefined) budget.amount = req.body.amount;
    if (req.body.month !== undefined) budget.month = req.body.month;
    if (req.body.year !== undefined) budget.year = req.body.year;

    await budget.save();

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid budget ID' });
    }

    const budget = await Budget.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Budget removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
