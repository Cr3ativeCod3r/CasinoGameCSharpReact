import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type{ User, AuthState, AuthActions } from '@/types/auth';
import {setCookie, getCookie, deleteCookie } from "@/utils/cookies"


const apiUrl = import.meta.env.VITE_API_URL || "http://localhos:5000";

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
          const response = await axios.post(apiUrl + '/api/Auth/login', credentials, {
            headers: { 'Content-Type': 'application/json' }
          });
          const data = response.data
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