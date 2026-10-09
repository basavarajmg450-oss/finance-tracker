import mongoose from 'mongoose';
import { FinancialGoal } from '../models/FinancialGoal.js';
import { GoalContribution } from '../models/GoalContribution.js';

export const getGoals = async (req, res, next) => {
  try {
    const goals = await FinancialGoal.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const populated = goals.map(g => {
      const percentage = Number(Math.min(100, (g.currentAmount / g.targetAmount) * 100).toFixed(1));
      const remaining = Number(Math.max(0, g.targetAmount - g.currentAmount).toFixed(2));
      return {
        _id: g._id,
        title: g.title,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate,
        status: g.status,
        percentage,
        remaining,
        createdAt: g.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const goal = await FinancialGoal.create({
      ...req.body,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      data: goal
    });
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }

    const goal = await FinancialGoal.findOne({ _id: id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    Object.assign(goal, req.body);
    if (goal.currentAmount >= goal.targetAmount && goal.status === 'in_progress') {
      goal.status = 'completed';
    }

    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: goal
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }

    const goal = await FinancialGoal.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Delete associated contributions
    await GoalContribution.deleteMany({ goalId: id });

    res.status(200).json({
      success: true,
      message: 'Goal and contribution history deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const addContribution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, contributionDate, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }

    const goal = await FinancialGoal.findOne({ _id: id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    // Atomic update using $inc
    const updatedGoal = await FinancialGoal.findByIdAndUpdate(
      id,
      { $inc: { currentAmount: amount } },
      { new: true }
    );

    if (updatedGoal.currentAmount >= updatedGoal.targetAmount && updatedGoal.status === 'in_progress') {
      updatedGoal.status = 'completed';
      await updatedGoal.save();
    }

    const contribution = await GoalContribution.create({
      userId: req.user._id,
      goalId: id,
      amount,
      contributionDate: contributionDate || new Date(),
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Goal contribution recorded successfully',
      data: {
        goal: updatedGoal,
        contribution
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getContributions = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid goal ID' });
    }

    const contributions = await GoalContribution.find({ goalId: id, userId: req.user._id }).sort({ contributionDate: -1 });

    res.status(200).json({
      success: true,
      data: contributions
    });
  } catch (error) {
    next(error);
  }
};
