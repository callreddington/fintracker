import api from './api';

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  email_verified: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  success: boolean;
  user: User;
}

export const authApi = {
  register: async (data: RegisterInput): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginInput): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  getCurrentUser: async (): Promise<{ success: boolean; user: User }> => {
    const response = await api.get<{ success: boolean; user: User }>('/users/me');
    return response.data;
  },
};
