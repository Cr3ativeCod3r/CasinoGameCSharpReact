'use client';

import { useEffect } from 'react';
import useAuthStore from '@/app/stores/AuthStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
};

export default AuthProvider;