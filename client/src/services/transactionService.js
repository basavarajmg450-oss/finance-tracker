import api from './api.js';

export const transactionService = {
  async getAll(params = {}) {
    return api.get('/transactions', { params });
  },
  async getById(id) {
    return api.get(`/transactions/${id}`);
  },
  async create(data) {
    return api.post('/transactions', data);
  },
  async update(id, data) {
    return api.patch(`/transactions/${id}`, data);
  },
  async delete(id) {
    return api.delete(`/transactions/${id}`);
  }
};
