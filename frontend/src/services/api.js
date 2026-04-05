import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Clubs API
export const clubsApi = {
  getAll: () => api.get('/clubs'),
  create: (data) => api.post('/clubs', data),
  update: (clubId, data) => api.put(`/clubs/${clubId}`, data),
  delete: (clubId) => api.delete(`/clubs/${clubId}`)
};

// Members API
export const membersApi = {
  getAll: (params = {}) => api.get('/members', { params }),
  getById: (memberId) => api.get(`/members/${memberId}`),
  create: (data) => api.post('/members', data),
  update: (memberId, data) => api.put(`/members/${memberId}`, data),
  delete: (memberId) => api.delete(`/members/${memberId}`),
  bulkImport: (members, clubId) => api.post('/members/bulk-import', { members }, { params: clubId ? { club_id: clubId } : {} })
};

// Transactions API
export const transactionsApi = {
  getAll: (params = {}) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  quick: (memberId, amount, type = 'earn', clubId, category, notes) => {
    const params = { member_id: memberId, amount, type };
    if (clubId) params.club_id = clubId;
    if (category) params.category = category;
    if (notes) params.notes = notes;
    return api.post('/transactions/quick', null, { params });
  }
};

// Dashboard API
export const dashboardApi = {
  getStats: (clubId) => api.get('/dashboard/stats', { params: clubId ? { club_id: clubId } : {} }),
  getLeaderboard: (limit = 10, clubId) => api.get('/dashboard/leaderboard', { params: { limit, ...(clubId ? { club_id: clubId } : {}) } }),
  getRecentTransactions: (limit = 10, clubId) => api.get('/dashboard/recent-transactions', { params: { limit, ...(clubId ? { club_id: clubId } : {}) } })
};

// QR Code API
export const qrApi = {
  getQRCode: (memberId) => api.get(`/qr/${memberId}`),
  scanQR: (payload) => api.post(`/qr/scan?payload=${encodeURIComponent(payload)}`)
};

export default api;
