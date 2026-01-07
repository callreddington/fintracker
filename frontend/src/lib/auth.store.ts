import { create } from 'zustand';
import { authApi, type User, type LoginInput, type RegisterInput } from './auth.api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
  getAccessToken: () => Promise<string>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (data: LoginInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(data);

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  register: async (data: RegisterInput) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register(data);

      set({
        isLoading: false,
        error: null,
      });

      // After registration, user needs to login
      // You could auto-login here if the backend returns tokens on registration
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),

  initialize: async () => {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      try {
        // Verify token is still valid by fetching current user
        const response = await authApi.getCurrentUser();

        set({
          user: response.user,
          isAuthenticated: true,
        });
      } catch (error) {
        // Token is invalid, clear storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        set({
          user: null,
          isAuthenticated: false,
        });
      }
    }
  },

  getAccessToken: async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token available');
    }
    return accessToken;
  },
}));
