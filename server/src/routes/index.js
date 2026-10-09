import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import budgetRoutes from './budgetRoutes.js';
import goalRoutes from './goalRoutes.js';
import recurringRoutes from './recurringRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/transactions', transactionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/budgets', budgetRoutes);
router.use('/goals', goalRoutes);
router.use('/recurring-transactions', recurringRoutes);
router.use('/reports', reportRoutes);

export default router;
