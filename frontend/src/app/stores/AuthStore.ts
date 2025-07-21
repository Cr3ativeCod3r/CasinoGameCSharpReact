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
      isLoading: false,
      error: null,
      
      initialize: () => {
        // Sprawdź czy mamy token w store
        const currentState = get();
        let token = currentState.token;
        
        // Jeśli nie ma tokenu w store, sprawdź ciasteczko
        if (!token) {
          token = getCookie('authToken');
        }
        
        if (token && currentState.user) {
          set({ 
            token, 
            isAuthenticated: true,
            user: currentState.user 
          });
        } else if (!token) {
          // Jeśli nie ma tokenu, wyloguj użytkownika
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false 
          });
        }
      },

      register: async (userData: Record<string, any>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(apiUrl + '/api/Auth/register', userData, {
            headers: { 'Content-Type': 'application/json' },
          });
          
          const data = response.data;
          
          if (data.token && data.user) {
            setCookie('authToken', data.token);
            set({ 
              token: data.token, 
              user: data.user, 
              isAuthenticated: true, 
              isLoading: false 
            });
            return { success: true, data };
          } else {
            set({ isLoading: false, error: 'Nieprawidłowa odpowiedź serwera' });
            return { success: false, error: 'Nieprawidłowa odpowiedź serwera' };
          }
        } catch (error: any) {
          const message = error.response?.data?.message || error.message || 'Rejestracja nie powiodła się';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      login: async (credentials: Record<string, any>) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await axios.post(apiUrl + '/api/Auth/login', credentials, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          const data = response.data;
          
          if (data.token && data.user) {
            setCookie('authToken', data.token);
            
            set({ 
              token: data.token, 
              user: data.user, 
              isAuthenticated: true, 
              isLoading: false 
            });
            
            return { success: true, data };
          } else {
            set({ isLoading: false, error: 'Nieprawidłowa odpowiedź serwera' });
            return { success: false, error: 'Nieprawidłowa odpowiedź serwera' };
          }
        } catch (error: any) {
          const message = error.response?.data?.message || error.message || 'Logowanie nie powiodło się';
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
        token: state.token, // Dodajemy token do persystowania
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;