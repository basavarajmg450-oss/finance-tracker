import { Transaction } from '../models/Transaction.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { generateTransactionsCsv } from '../services/exportService.js';

export const getReportSummary = async (req, res, next) => {
  try {
    const { period = 'this_month', startDate, endDate } = req.query;
    const { startDate: start, endDate: end } = AnalyticsService.getDateRange(period, startDate, endDate);

    const [summary, expenseBreakdown, incomeBreakdown] = await Promise.all([
      AnalyticsService.getDashboardSummary(req.user._id, period, startDate, endDate),
      AnalyticsService.getCategoryBreakdown(req.user._id, period, 'expense', startDate, endDate),
      AnalyticsService.getCategoryBreakdown(req.user._id, period, 'income', startDate, endDate)
    ]);

    res.status(200).json({
      success: true,
      data: {
        startDate: start,
        endDate: end,
        summary,
        expenseBreakdown: expenseBreakdown.categories,
        incomeBreakdown: incomeBreakdown.categories
      }
    });
  } catch (error) {
    next(error);
  }
};

export const exportCsv = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, search, paymentMethod } = req.query;
    const query = { userId: req.user._id };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }
    if (category) {
      query.category = category;
    }
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const transactions = await Transaction.find(query).sort({ transactionDate: -1 });

    const csvData = generateTransactionsCsv(transactions, req.user.preferredCurrency || 'USD');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-report-${Date.now()}.csv`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};
