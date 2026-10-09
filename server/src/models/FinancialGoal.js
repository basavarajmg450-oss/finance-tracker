import mongoose from 'mongoose';
import { GOAL_STATUSES } from '../config/constants.js';

const financialGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [100, 'Goal title cannot exceed 100 characters']
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least 1']
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current amount cannot be negative']
    },
    targetDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: GOAL_STATUSES,
      default: 'in_progress'
    }
  },
  {
    timestamps: true
  }
);

financialGoalSchema.index({ userId: 1, status: 1 });

export const FinancialGoal = mongoose.model('FinancialGoal', financialGoalSchema);
