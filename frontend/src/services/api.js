import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Members API
export const membersApi = {
  getAll: (params = {}) => api.get('/members', { params }),
  getById: (memberId) => api.get(`/members/${memberId}`),
  create: (data) => api.post('/members', data),
  update: (memberId, data) => api.put(`/members/${memberId}`, data),
  delete: (memberId) => api.delete(`/members/${memberId}`),
  bulkImport: (members) => api.post('/members/bulk-import', { members })
};

// Transactions API
export const transactionsApi = {
  getAll: (params = {}) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  quick: (memberId, amount, type = 'earn') => 
    api.post(`/transactions/quick?member_id=${memberId}&amount=${amount}&type=${type}`)
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getLeaderboard: (limit = 10) => api.get(`/dashboard/leaderboard?limit=${limit}`),
  getRecentTransactions: (limit = 10) => api.get(`/dashboard/recent-transactions?limit=${limit}`)
};

// QR Code API
export const qrApi = {
  getQRCode: (memberId) => api.get(`/qr/${memberId}`),
  scanQR: (payload) => api.post(`/qr/scan?payload=${encodeURIComponent(payload)}`)
};

export default api;
