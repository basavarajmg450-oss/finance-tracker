import api from './api.js';

export const goalService = {
  async getAll() {
    return api.get('/goals');
  },
  async create(data) {
    return api.post('/goals', data);
  },
  async update(id, data) {
    return api.patch(`/goals/${id}`, data);
  },
  async delete(id) {
    return api.delete(`/goals/${id}`);
  },
  async addContribution(id, data) {
    return api.post(`/goals/${id}/contributions`, data);
  },
  async getContributions(id) {
    return api.get(`/goals/${id}/contributions`);
  }
};
