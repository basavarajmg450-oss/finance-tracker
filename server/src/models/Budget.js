import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES } from '../config/constants.js';

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    category: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          if (v === null || v === '' || v === 'Overall') return true;
          return EXPENSE_CATEGORIES.includes(v);
        },
        message: props => `${props.value} is not a valid expense category for budgeting`
      }
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [1, 'Budget amount must be at least 1']
    },
    month: {
      type: Number,
      required: [true, 'Month is required (1-12)'],
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2000,
      max: 2100
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring one budget per category (or overall) per month per user
budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

export const Budget = mongoose.model('Budget', budgetSchema);
