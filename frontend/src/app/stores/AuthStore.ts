import { makeAutoObservable, runInAction } from 'mobx';
import { RegisterDto, LoginDto, AuthResponse, User } from '@/app/types/auth';
import axios from 'axios';
import { cookieUtils } from '@/app/utils/cookies';

class AuthStore {
  user: User | null = null;
  loading = false;
  error: string | null = null;
  url: string = "http://localhost:5000";

  constructor() {
    makeAutoObservable(this);
    this.initializeAuth();
  }

  initializeAuth() {
    // Initialize user from cookie on app start
    const savedUser = cookieUtils.getUser();
    if (savedUser) {
      this.setUser(savedUser);
    }
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setUser(user: User | null) {
    this.user = user;
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    try {
      this.setLoading(true);
      this.setError(null);

      const response = await axios.post(this.url+'/api/Auth/register', data);
      
      runInAction(() => {
        this.setLoading(false);
      });

      return {
        success: true,
        message: 'Registration successful',
        data: response.data
      };
    } catch (error: any) {
      runInAction(() => {
        this.setLoading(false);
        this.setError(error.response?.data?.message || 'Registration failed');
      });

      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    try {
      this.setLoading(true);
      this.setError(null);

      const response = await axios.post(this.url+'/api/Auth/login', data);
      
      runInAction(() => {
        this.setLoading(false);
        // Assuming the API returns user data and token on successful login
        if (response.data) {
          // Save token to cookie if provided
          if (response.data.token) {
            cookieUtils.setToken(response.data.token);
          }
          
          // Save user data to cookie and state
          const userData = response.data.user || response.data;
          cookieUtils.setUser(userData);
          this.setUser(userData);
        }
      });

      return {
        success: true,
        message: 'Login successful',
        data: response.data
      };
    } catch (error: any) {
      runInAction(() => {
        this.setLoading(false);
        this.setError(error.response?.data?.message || 'Login failed');
      });

      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  }

  async checkEmail(email: string): Promise<boolean> {
    try {
      const response = await axios.get(this.url+`/api/Auth/check-email/${email}`);
      return response.data.exists || false;
    } catch (error) {
      console.error('Email check failed:', error);
      return false;
    }
  }

  logout() {
    this.setUser(null);
    this.setError(null);
    cookieUtils.clearAuth();
  }

  get isAuthenticated() {
    return !!this.user;
  }
}

export default new AuthStore();