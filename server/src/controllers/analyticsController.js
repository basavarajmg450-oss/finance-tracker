import { AnalyticsService } from '../services/analyticsService.js';

export const getOverview = async (req, res, next) => {
  try {
    const { period = 'this_month', startDate, endDate } = req.query;
    const overview = await AnalyticsService.getAnalyticsOverview(req.user._id, period, startDate, endDate);

    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { period = 'this_month', type = 'expense', startDate, endDate } = req.query;
    const breakdown = await AnalyticsService.getCategoryBreakdown(req.user._id, period, type, startDate, endDate);

    res.status(200).json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyTrends = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const trends = await AnalyticsService.getMonthlyTrends(req.user._id, parseInt(months, 10) || 6);

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};
