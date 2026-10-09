import api from './api.js';

export const budgetService = {
  async getAll(params = {}) {
    return api.get('/budgets', { params });
  },
  async create(data) {
    return api.post('/budgets', data);
  },
  async update(id, data) {
    return api.patch(`/budgets/${id}`, data);
  },
  async delete(id) {
    return api.delete(`/budgets/${id}`);
  }
};
