import api from './api.js';

export const authService = {
  async register(data) {
    return api.post('/auth/register', data);
  },
  async login(data) {
    return api.post('/auth/login', data);
  },
  async getMe() {
    return api.get('/auth/me');
  },
  async logout() {
    return api.post('/auth/logout');
  },
  async updateProfile(data) {
    return api.patch('/users/profile', data);
  },
  async changePassword(data) {
    return api.patch('/users/change-password', data);
  }
};
