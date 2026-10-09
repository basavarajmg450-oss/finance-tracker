import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS } from '../config/constants.js';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: 'Transaction type must be either income or expense'
      },
      required: [true, 'Transaction type is required']
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
          if (this.type === 'expense') {
            return EXPENSE_CATEGORIES.includes(v);
          }
          if (this.type === 'income') {
            return INCOME_CATEGORIES.includes(v);
          }
          return true;
        },
        message: props => `${props.value} is not a valid category for transaction`
      }
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'Cash'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: ''
    },
    recurringTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringTransaction',
      default: null
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, category: 1, transactionDate: 1 });
transactionSchema.index({ userId: 1, type: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
