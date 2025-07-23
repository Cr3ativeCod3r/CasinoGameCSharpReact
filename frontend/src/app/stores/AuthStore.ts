import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { User, AuthState } from '@/app/types/auth';

const apiUrl = "http://localhost:5000";

const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;Secure;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  
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
  if (typeof document === 'undefined') return;
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
      loading: false,
      error: null,
      
      initialize: () => {
      
        const currentState = get();
        let token = currentState.token;
      
        if (!token) {
          token = getCookie('authToken');
        }
        
        if (token && currentState.user) {
          console.log('Found token and user data, setting as authenticated');
          set({ 
            token, 
            isAuthenticated: true,
            user: currentState.user 
          });
        } else if (!token) {
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false 
          });
        }
      },

      register: async (userData: Record<string, any>) => {
        set({ loading: true, error: null });
        try {
          console.log('Attempting to register user:', userData.email);
          
          const response = await axios.post(apiUrl + '/api/Auth/register', userData, {
            headers: { 'Content-Type': 'application/json' },
          });
          
          const data = response.data;
          console.log('Register response:', data);
          
          if (data.token && data.user) {
            setCookie('authToken', data.token);
            set({ 
              token: data.token, 
              user: data.user, 
              isAuthenticated: true, 
              loading: false 
            });
            return { success: true, data };
          } else {
            set({ loading: false, error: 'Nieprawidłowa odpowiedź serwera' });
            return { success: false, error: 'Nieprawidłowa odpowiedź serwera' };
          }
        } catch (error: any) {
          console.error('Registration error:', error);
          const message = error.response?.data?.message || error.message || 'Rejestracja nie powiodła się';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },

      login: async (credentials: Record<string, any>) => {
        set({ loading: true, error: null });
        
        try {
          console.log('Attempting to login user:', credentials.email);
          
          const response = await axios.post(apiUrl + '/api/Auth/login', credentials, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          const data = response.data;
          console.log('Login response:', data);
          
          if (data.token && data.user) {
            setCookie('authToken', data.token);
            
            set({ 
              token: data.token, 
              user: data.user, 
              isAuthenticated: true, 
              loading: false 
            });
            
            console.log('Login successful, user authenticated');
            return { success: true, data };
          } else {
            set({ loading: false, error: 'Nieprawidłowa odpowiedź serwera' });
            return { success: false, error: 'Nieprawidłowa odpowiedź serwera' };
          }
        } catch (error: any) {
          console.error('Login error:', error);
          const message = error.response?.data?.message || error.message || 'Logowanie nie powiodło się';
          set({ error: message, loading: false });
          return { success: false, error: message };
        }
      },

      logout: () => {
        console.log('Logging out user');
        deleteCookie('authToken');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          error: null 
        });
      
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      },

      clearError: () => set({ error: null }),
      
      updateUser: (userData: User) => set({ user: userData }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;