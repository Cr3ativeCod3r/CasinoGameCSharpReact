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
  balance?: number; // Dodajemy balance do użytkownika
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean; // Zmienione z isLoading na loading dla spójności
  error: string | null;
}