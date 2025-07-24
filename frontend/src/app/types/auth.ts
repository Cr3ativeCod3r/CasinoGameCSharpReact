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
  message?: string;
  data?: any;
}
export interface User {
  id: string;
  email: string;
  nickName: string;
  balance?: number; 
}
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean; 
  error: string | null;
}
export interface AuthActions {
  initialize: () => void;
  register: (userData: Record<string, any>) => Promise<{ success: boolean; data?: any; error?: string }>;
  login: (credentials: Record<string, any>) => Promise<{ success: boolean; data?: any; error?: string }>;
  logout: () => void;
  clearError: () => void;
  updateUser: (userData: User) => void;
}