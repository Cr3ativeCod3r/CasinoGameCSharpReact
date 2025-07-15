'use client';

import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import authStore from '@/app/stores/AuthStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider = observer(({ children }: AuthProviderProps) => {
  useEffect(() => {
    authStore.initializeAuth();
  }, []);

  return <>{children}</>;
});

export default AuthProvider;