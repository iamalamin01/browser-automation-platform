import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── API helpers ──────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () => api.get('/api/dashboard/stats'),
};

export const profilesApi = {
  list: (params?: Record<string, unknown>) => api.get('/api/profiles', { params }),
  get: (id: string) => api.get(`/api/profiles/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/profiles', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/profiles/${id}`, data),
  delete: (id: string) => api.delete(`/api/profiles/${id}`),
  duplicate: (id: string) => api.post(`/api/profiles/${id}/duplicate`),
  start: (id: string) => api.post(`/api/profiles/${id}/start`),
  stop: (id: string) => api.post(`/api/profiles/${id}/stop`),
};

export const testUsersApi = {
  list: (params?: Record<string, unknown>) => api.get('/api/test-users', { params }),
  get: (id: string) => api.get(`/api/test-users/${id}`),
  generate: () => api.post('/api/test-users/generate'),
  generateMultiple: (count: number) => api.post('/api/test-users/generate-multiple', { count }),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/test-users/${id}`, data),
  delete: (id: string) => api.delete(`/api/test-users/${id}`),
  assign: (id: string, profileId: string) =>
    api.post(`/api/test-users/${id}/assign`, { profileId }),
};

export const scenariosApi = {
  list: (params?: Record<string, unknown>) => api.get('/api/scenarios', { params }),
  get: (id: string) => api.get(`/api/scenarios/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/scenarios', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/api/scenarios/${id}`, data),
  delete: (id: string) => api.delete(`/api/scenarios/${id}`),
  toggle: (id: string) => api.patch(`/api/scenarios/${id}/toggle`),
};

export const tasksApi = {
  list: (params?: Record<string, unknown>) => api.get('/api/tasks', { params }),
  get: (id: string) => api.get(`/api/tasks/${id}`),
  create: (data: Record<string, unknown>) => api.post('/api/tasks', data),
  start: (id: string) => api.post(`/api/tasks/${id}/start`),
  stop: (id: string) => api.post(`/api/tasks/${id}/stop`),
  retry: (id: string) => api.post(`/api/tasks/${id}/retry`),
  delete: (id: string) => api.delete(`/api/tasks/${id}`),
};

export const reportsApi = {
  list: (params?: Record<string, unknown>) => api.get('/api/reports', { params }),
  get: (runId: string) => api.get(`/api/reports/${runId}`),
  logs: (runId: string, params?: Record<string, unknown>) =>
    api.get(`/api/reports/${runId}/logs`, { params }),
  network: (runId: string) => api.get(`/api/reports/${runId}/network`),
  screenshots: (runId: string) => api.get(`/api/reports/${runId}/screenshots`),
};

export const authApi = {
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  register: (data: Record<string, unknown>) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
};
