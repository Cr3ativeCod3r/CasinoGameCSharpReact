import { create } from 'zustand';
import axios from 'axios';
import { cookieUtils } from '@/app/utils/cookies';

// --- Interfaces & Types ---

export interface User {
  id: string;
  email: string;
  nickName: string;
  token?: string;
}

export interface RegisterDto {
  nickName: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  url: string;
}

interface AuthActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
  register: (data: RegisterDto) => Promise<AuthResponse>;
  login: (data: LoginDto) => Promise<AuthResponse>;
  logout: () => void;
  initializeAuth: () => void;
}

type AuthStore = AuthState & AuthActions & {
  isAuthenticated: boolean;
};


const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  url: "http://localhost:5000",

  get isAuthenticated() {
    return !!get().user;
  },

  setLoading: (loading: boolean) => set({ loading }),
  
  setError: (error: string | null) => set({ error }),
  
  setUser: (user: User | null) => set({ user }),

  initializeAuth: () => {
    const savedUser = cookieUtils.getUser();
    if (savedUser) {
      set({ user: savedUser });
    }
  },

  register: async (data: RegisterDto): Promise<AuthResponse> => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(get().url + '/api/Auth/register', data);
      set({ loading: false });
      return {
        success: true,
        message: 'Registration successful',
        data: response.data
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      set({ loading: false, error: errorMessage });
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post<User>(get().url + '/api/Auth/login', data);
      
      if (response.data && response.data.token) {
        const userData = response.data;
        
        cookieUtils.setToken(userData.token);
        cookieUtils.setUser(userData);
        set({ user: userData, loading: false, error: null });

        return {
          success: true,
          message: 'Login successful',
          data: userData
        };
      } else {
        throw new Error('Invalid response from server: token missing.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      set({ loading: false, error: errorMessage });
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  logout: () => {
    cookieUtils.clearAuth();
    set({ user: null, error: null });
  }
}));

export default useAuthStore;