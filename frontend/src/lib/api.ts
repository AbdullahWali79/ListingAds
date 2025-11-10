import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests dynamically
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Categories
export const categoryApi = {
  getAll: () => api.get('/categories'),
  getById: (id: number) => api.get(`/categories/${id}`),
};

// Ads
export const adApi = {
  getAll: (params?: { category_id?: number; search?: string; limit?: number; offset?: number }) =>
    api.get('/ads', { params }),
  getById: (id: number) => api.get(`/ads/${id}`),
  create: (data: {
    title: string;
    description?: string;
    price?: number;
    image_urls?: string[];
    video_url?: string;
    category_id: number;
    package: 'Free' | 'Standard' | 'Premium';
  }) => api.post('/ads', data),
  getMyAds: () => api.get('/ads/user/my-ads'),
  update: (id: number, data: any) => api.put(`/ads/${id}`, data),
  delete: (id: number) => api.delete(`/ads/${id}`),
};

// Payments
export const paymentApi = {
  getInstructions: () => api.get('/payments/instructions'),
  submit: (data: {
    ad_id: number;
    sender_name: string;
    bank_name: string;
    transaction_id: string;
    screenshot_url?: string;
  }) => api.post('/payments', data), // POST to /api/payments
  getMyPayments: () => api.get('/payments/my-payments'),
  getByAdId: (adId: number) => api.get(`/payments/ad/${adId}`),
};

// Admin
export const adminApi = {
  getPendingPayments: () => api.get('/admin/payments/pending'),
  approvePayment: (id: number, data?: { admin_note?: string }) =>
    api.post(`/admin/payments/${id}/approve`, data),
  rejectPayment: (id: number, data: { admin_note: string }) =>
    api.post(`/admin/payments/${id}/reject`, data),
  getAllAds: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/admin/ads', { params }),
  approveAd: (id: number) => api.post(`/admin/ads/${id}/approve`),
  rejectAd: (id: number, data: { reason: string }) => api.post(`/admin/ads/${id}/reject`, data),
  getAllUsers: () => api.get('/admin/users'),
  getAuditLogs: (params?: { limit?: number; offset?: number }) =>
    api.get('/admin/audit-logs', { params }),
  getStats: () => api.get('/admin/stats'),
};

export default api;

