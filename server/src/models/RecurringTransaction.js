import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, RECURRING_FREQUENCIES } from '../config/constants.js';

const recurringTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Type is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      validate: {
        validator: function (v) {
          if (this.type === 'expense') return EXPENSE_CATEGORIES.includes(v);
          if (this.type === 'income') return INCOME_CATEGORIES.includes(v);
          return true;
        },
        message: props => `${props.value} is not a valid category`
      }
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    frequency: {
      type: String,
      enum: RECURRING_FREQUENCIES,
      required: [true, 'Frequency is required']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    nextRunDate: {
      type: Date,
      required: [true, 'Next run date is required'],
      index: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    },
    lastProcessedDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

recurringTransactionSchema.index({ active: 1, nextRunDate: 1 });

export const RecurringTransaction = mongoose.model('RecurringTransaction', recurringTransactionSchema);
