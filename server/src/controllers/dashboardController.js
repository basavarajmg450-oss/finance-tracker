import { AnalyticsService } from '../services/analyticsService.js';
import { InsightsEngine } from '../services/insightsEngine.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const { period = 'this_month', startDate, endDate } = req.query;

    const [summary, insights] = await Promise.all([
      AnalyticsService.getDashboardSummary(req.user._id, period, startDate, endDate),
      InsightsEngine.generateInsights(req.user._id)
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...summary,
        insights
      }
    });
  } catch (error) {
    next(error);
  }
};
