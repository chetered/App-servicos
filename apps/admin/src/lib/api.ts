import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

function createClient(): AxiosInstance {
  const client = axios.create({ baseURL: BASE_URL });

  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('servix_admin_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('servix_admin_token');
        window.location.href = '/auth/login';
      }
      return Promise.reject(err);
    }
  );

  return client;
}

const http = createClient();

// ── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    http.post('/auth/login', { email, password }).then((r) => r.data.data),
  me: () => http.get('/auth/me').then((r) => r.data.data),
};

// ── Admin Dashboard ───────────────────────────────────────────────
export const adminApi = {
  dashboard: () => http.get('/admin/dashboard').then((r) => r.data.data),
  revenueBySource: (days = 30) =>
    http.get('/admin/analytics/revenue', { params: { days } }).then((r) => r.data.data),
  ordersSeries: (days = 30) =>
    http.get('/admin/analytics/orders', { params: { days } }).then((r) => r.data.data),
  auditLog: (page = 1) =>
    http.get('/admin/audit-log', { params: { page } }).then((r) => r.data.data),
};

// ── Users ─────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: { search?: string; role?: string; page?: number; limit?: number }) =>
    http.get('/admin/users', { params }).then((r) => r.data.data),
  ban: (id: string, reason: string) =>
    http.patch(`/admin/users/${id}/ban`, { reason }).then((r) => r.data.data),
  unban: (id: string) =>
    http.patch(`/admin/users/${id}/unban`).then((r) => r.data.data),
};

// ── Providers ─────────────────────────────────────────────────────
export const providersApi = {
  pending: () =>
    http.get('/admin/providers/pending').then((r) => r.data.data),
  approve: (id: string) =>
    http.patch(`/admin/providers/${id}/approve`).then((r) => r.data.data),
  reject: (id: string, notes: string) =>
    http.patch(`/admin/providers/${id}/reject`, { notes }).then((r) => r.data.data),
};

// ── Orders ────────────────────────────────────────────────────────
export const ordersApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    http.get('/admin/orders', { params }).then((r) => r.data.data),
};

// ── Payouts ───────────────────────────────────────────────────────
export const payoutsApi = {
  list: (params?: { status?: string; page?: number }) =>
    http.get('/payouts/admin/all', { params }).then((r) => r.data.data),
  approve: (id: string) =>
    http.patch(`/payouts/admin/${id}/approve`).then((r) => r.data.data),
  fail: (id: string, reason: string) =>
    http.patch(`/payouts/admin/${id}/fail`, { reason }).then((r) => r.data.data),
};

// ── Support ───────────────────────────────────────────────────────
export const supportApi = {
  list: (params?: { status?: string; priority?: string; page?: number }) =>
    http.get('/support/admin/tickets', { params }).then((r) => r.data.data),
  resolve: (id: string, resolutionNote: string) =>
    http.patch(`/support/admin/tickets/${id}/resolve`, { resolutionNote }).then((r) => r.data.data),
  message: (id: string, message: string) =>
    http.post(`/support/admin/tickets/${id}/messages`, { message }).then((r) => r.data.data),
  decideDispute: (id: string, decidedFor: 'CLIENT' | 'PROVIDER', decisionNote: string) =>
    http.patch(`/support/admin/disputes/${id}/decide`, { decidedFor, decisionNote }).then((r) => r.data.data),
};

// ── Feature Flags ─────────────────────────────────────────────────
export const featureFlagsApi = {
  list: (country?: string) =>
    http.get('/admin/feature-flags', { params: { country } }).then((r) => r.data.data),
  toggle: (key: string, countryId: string | null, status: string) =>
    http.patch('/admin/feature-flags/toggle', { key, countryId, status }).then((r) => r.data.data),
};
