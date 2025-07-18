import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import {User, AuthState} from '@/app/types/auth'

const apiUrl ="http://localhost:5000"

const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};



export interface AuthActions {
  initialize: () => void;
  register: (userData: Record<string, any>) => Promise<{ success: boolean; data?: any; error?: string }>;
  login: (credentials: Record<string, any>) => Promise<{ success: boolean; data?: any; error?: string }>;
  logout: () => void;
  clearError: () => void;
  updateUser: (userData: User) => void;
}

const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      initialize: () => {
        const token = getCookie('authToken');
        if (token) {
          set({ token, isAuthenticated: true });
        }
      },
      register: async (userData: Record<string, any>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(apiUrl + '/api/Auth/register', userData, {
            headers: { 'Content-Type': 'application/json' },
          });
          const data = response.data;
          if (data.token) {
            setCookie('authToken', data.token);
            set({ 
              token: data.token, 
              user: data.user, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            set({ isLoading: false });
          }
          return { success: true, data };
        } catch (error: any) {
          let message = error.response?.data?.message || error.message || 'Rejestracja nie powiodła się';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },
      login: async (credentials: Record<string, any>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(apiUrl + '/api/Auth/login', credentials, {
            headers: { 'Content-Type': 'application/json' },
          });
          const data = response.data;
          if (data.token) {
            setCookie('authToken', data.token);
            set({ 
              token: data.token, 
              user: data.user, 
              isAuthenticated: true, 
              isLoading: false 
            });
          }
          return { success: true, data };
        } catch (error: any) {
          let message = error.response?.data?.message || error.message || 'Logowanie nie powiodło się';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },
      logout: () => {
        deleteCookie('authToken');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          error: null 
        });
      },
      clearError: () => set({ error: null }),
      updateUser: (userData: User) => set({ user: userData }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;