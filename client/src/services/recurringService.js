import api from './api.js';

export const recurringService = {
  async getAll() {
    return api.get('/recurring-transactions');
  },
  async create(data) {
    return api.post('/recurring-transactions', data);
  },
  async update(id, data) {
    return api.patch(`/recurring-transactions/${id}`, data);
  },
  async delete(id) {
    return api.delete(`/recurring-transactions/${id}`);
  },
  async triggerProcess() {
    return api.post('/recurring-transactions/trigger-process');
  }
};
