import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor: inject auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracing
        config.headers['X-Request-ID'] = `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor: handle token refresh
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue request until refresh completes
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await SecureStore.getItemAsync('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');

            const response: any = await this.client.post('/auth/refresh', { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data;

            await SecureStore.setItemAsync('accessToken', accessToken);
            await SecureStore.setItemAsync('refreshToken', newRefreshToken);

            // Notify queued requests
            this.refreshSubscribers.forEach((callback) => callback(accessToken));
            this.refreshSubscribers = [];
            this.isRefreshing = false;

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch {
            this.isRefreshing = false;
            this.refreshSubscribers = [];

            // Clear tokens and redirect to login
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('refreshToken');

            // Trigger logout event
            throw error;
          }
        }

        // Format error message
        const message =
          (error.response?.data as any)?.message || 'Ocorreu um erro. Tente novamente.';
        throw new Error(message);
      },
    );
  }

  // Auth endpoints
  auth = {
    register: (data: any) => this.client.post('/auth/register', data),
    login: (data: any) => this.client.post('/auth/login', data),
    loginGoogle: (idToken: string) => this.client.post('/auth/google', { idToken }),
    requestOtp: (phone: string) => this.client.post('/auth/otp/request', { phone }),
    verifyOtp: (phone: string, code: string) =>
      this.client.post('/auth/otp/verify', { phone, code }),
    refresh: (refreshToken: string) => this.client.post('/auth/refresh', { refreshToken }),
    logout: (refreshToken: string) => this.client.post('/auth/logout', { refreshToken }),
    me: () => this.client.get('/auth/me'),
  };

  // Search
  search = {
    providers: (params: any) => this.client.get('/search/providers', { params }),
    categories: (countryCode?: string) =>
      this.client.get('/search/categories', { params: { countryCode } }),
  };

  // Bookings
  bookings = {
    estimate: (data: any) => this.client.post('/bookings/estimate', data),
    create: (data: any) => this.client.post('/bookings', data),
    list: (params?: any) => this.client.get('/bookings/my', { params }),
    getOne: (id: string) => this.client.get(`/bookings/${id}`),
    accept: (id: string) => this.client.patch(`/bookings/${id}/accept`),
    complete: (id: string) => this.client.patch(`/bookings/${id}/complete`),
  };

  // Providers
  providers = {
    getProfile: (id: string) => this.client.get(`/providers/${id}`),
    getMyProfile: () => this.client.get('/providers/me'),
    updateProfile: (data: any) => this.client.patch('/providers/me', data),
    updateAvailability: (data: any) => this.client.put('/providers/me/availability', data),
    getEarnings: (params?: any) => this.client.get('/providers/me/earnings', { params }),
  };

  // Payments
  payments = {
    getMethods: () => this.client.get('/payments/methods'),
    addMethod: (token: string) => this.client.post('/payments/methods', { token }),
    deleteMethod: (id: string) => this.client.delete(`/payments/methods/${id}`),
  };

  // Reviews
  reviews = {
    create: (data: any) => this.client.post('/reviews', data),
    getForProvider: (providerId: string, params?: any) =>
      this.client.get(`/reviews/provider/${providerId}`, { params }),
  };

  // Support
  support = {
    createTicket: (data: any) => this.client.post('/support/tickets', data),
    getMyTickets: () => this.client.get('/support/tickets/my'),
    getTicket: (id: string) => this.client.get(`/support/tickets/${id}`),
    addMessage: (ticketId: string, message: string) =>
      this.client.post(`/support/tickets/${ticketId}/messages`, { message }),
  };

  // Notifications
  notifications = {
    list: (params?: any) => this.client.get('/notifications', { params }),
    markRead: (id: string) => this.client.patch(`/notifications/${id}/read`),
    markAllRead: () => this.client.patch('/notifications/read-all'),
  };

  // User
  user = {
    getProfile: () => this.client.get('/users/me'),
    updateProfile: (data: any) => this.client.patch('/users/me', data),
    getAddresses: () => this.client.get('/users/me/addresses'),
    addAddress: (data: any) => this.client.post('/users/me/addresses', data),
    getFavorites: () => this.client.get('/users/me/favorites'),
    toggleFavorite: (providerId: string) =>
      this.client.post(`/users/me/favorites/${providerId}/toggle`),
  };
}

export const api = new ApiService();
