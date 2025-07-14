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
}

