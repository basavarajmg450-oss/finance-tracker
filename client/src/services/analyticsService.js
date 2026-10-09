import api from './api.js';

export const analyticsService = {
  async getDashboardSummary(params = {}) {
    return api.get('/dashboard/summary', { params });
  },
  async getOverview(params = {}) {
    return api.get('/analytics/overview', { params });
  },
  async getCategoryBreakdown(params = {}) {
    return api.get('/analytics/category-breakdown', { params });
  },
  async getMonthlyTrends(params = {}) {
    return api.get('/analytics/monthly-trends', { params });
  }
};
