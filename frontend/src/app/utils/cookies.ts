//utils/cookies.ts
import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const cookieUtils = {
  // Token management
  setToken: (token: string) => {
    Cookies.set(TOKEN_KEY, token, { 
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
  },

  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_KEY);
  },

  removeToken: () => {
    Cookies.remove(TOKEN_KEY, { path: '/' });
  },

  // User data management
  setUser: (user: any) => {
    Cookies.set(USER_KEY, JSON.stringify(user), {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
  },

  getUser: (): any | null => {
    try {
      const userData = Cookies.get(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data from cookie:', error);
      return null;
    }
  },

  removeUser: () => {
    Cookies.remove(USER_KEY, { path: '/' });
  },

  // Clear all auth data
  clearAuth: () => {
    cookieUtils.removeToken();
    cookieUtils.removeUser();
  }
};