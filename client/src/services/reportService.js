import api from './api.js';

export const reportService = {
  async getSummary(params = {}) {
    return api.get('/reports/summary', { params });
  },
  getExportCsvUrl(params = {}) {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/reports/export/csv?${query}`;
  }
};
