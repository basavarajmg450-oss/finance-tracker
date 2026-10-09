import mongoose from 'mongoose';
import { RecurringTransaction } from '../models/RecurringTransaction.js';
import { processRecurringTransactions } from '../services/recurringJobService.js';

export const getRecurringTransactions = async (req, res, next) => {
  try {
    const items = await RecurringTransaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

export const createRecurringTransaction = async (req, res, next) => {
  try {
    const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    const recurring = await RecurringTransaction.create({
      ...req.body,
      userId: req.user._id,
      startDate,
      nextRunDate: startDate
    });

    res.status(201).json({
      success: true,
      message: 'Recurring transaction scheduled successfully',
      data: recurring
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecurringTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid recurring transaction ID' });
    }

    const recurring = await RecurringTransaction.findOne({ _id: id, userId: req.user._id });
    if (!recurring) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }

    Object.assign(recurring, req.body);
    await recurring.save();

    res.status(200).json({
      success: true,
      message: 'Recurring transaction updated successfully',
      data: recurring
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRecurringTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid recurring transaction ID' });
    }

    const recurring = await RecurringTransaction.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!recurring) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Recurring transaction deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const triggerProcess = async (req, res, next) => {
  try {
    const result = await processRecurringTransactions(req.user._id);
    res.status(200).json({
      success: true,
      message: `Processed ${result.processedCount} recurring rules, created ${result.createdCount} transactions.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
