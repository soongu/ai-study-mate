import apiClient from './apiClient';

export const AuthService = {
  me: () => apiClient.get('/users/me'),
  refresh: () => apiClient.post('/auth/refresh', {}, { skipAuthRefresh: true }),
  logout: () => apiClient.post('/auth/logout'),
};
