import { z } from 'zod';
import mongoose from 'mongoose';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, RECURRING_FREQUENCIES, GOAL_STATUSES, SUPPORTED_CURRENCIES } from '../config/constants.js';

const objectIdSchema = z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid MongoDB ObjectId'
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
  preferredCurrency: z.enum(SUPPORTED_CURRENCIES).optional().default('USD')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters').trim().optional(),
  preferredCurrency: z.enum(SUPPORTED_CURRENCIES).optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100)
});

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required').max(200).trim(),
  transactionDate: z.string().or(z.date()).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().default('Cash'),
  notes: z.string().max(500).optional().default('')
}).refine(data => {
  if (data.type === 'expense') return EXPENSE_CATEGORIES.includes(data.category);
  if (data.type === 'income') return INCOME_CATEGORIES.includes(data.category);
  return false;
}, {
  message: 'Category does not match transaction type',
  path: ['category']
});

export const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  description: z.string().min(1).max(200).trim().optional(),
  transactionDate: z.string().or(z.date()).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  notes: z.string().max(500).optional()
});

export const createBudgetSchema = z.object({
  category: z.string().nullable().optional(),
  amount: z.number().positive('Budget amount must be positive'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100)
});

export const updateBudgetSchema = z.object({
  category: z.string().nullable().optional(),
  amount: z.number().positive().optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional()
});

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).trim(),
  targetAmount: z.number().positive('Target amount must be positive'),
  targetDate: z.string().or(z.date()).nullable().optional(),
  currentAmount: z.number().min(0).optional().default(0)
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(100).trim().optional(),
  targetAmount: z.number().positive().optional(),
  targetDate: z.string().or(z.date()).nullable().optional(),
  status: z.enum(GOAL_STATUSES).optional()
});

export const createContributionSchema = z.object({
  amount: z.number().positive('Contribution amount must be positive'),
  contributionDate: z.string().or(z.date()).optional(),
  notes: z.string().max(300).optional().default('')
});

export const createRecurringSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1),
  description: z.string().min(1).max(200).trim(),
  frequency: z.enum(RECURRING_FREQUENCIES),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).nullable().optional(),
  active: z.boolean().optional().default(true)
});

export const updateRecurringSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  description: z.string().min(1).max(200).trim().optional(),
  frequency: z.enum(RECURRING_FREQUENCIES).optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).nullable().optional(),
  active: z.boolean().optional()
});
