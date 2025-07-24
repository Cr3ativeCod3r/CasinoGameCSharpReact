"use client"
import React, { useEffect } from 'react';
import useConnectionStore from '@/app/stores/ConnectionStore';
import useAuthStore from '@/app/stores/AuthStore';
import useCrashGameStore from '@/app/stores/CrashGameStore';
import useChatStore from '@/app/stores/ChatStore';

interface ConnectionProviderProps {
  children: React.ReactNode;
}

const ConnectionProvider: React.FC<ConnectionProviderProps> = ({ children }) => {
  const { connect, disconnect } = useConnectionStore();
  const { isAuthenticated, token } = useAuthStore();
  const { setupListeners: setupCrashListeners, removeListeners: removeCrashListeners, requestBalance } = useCrashGameStore();
  const { setupListeners: setupChatListeners, removeListeners: removeChatListeners, fetchMessages } = useChatStore();

  useEffect(() => {
    let mounted = true;

    const initializeConnection = async () => {
      await connect();
      setupCrashListeners();
      setupChatListeners();

      setTimeout(() => {
        if (mounted && isAuthenticated && token) {
          requestBalance();
        }
        if (mounted) {
          fetchMessages();
        }
      }, 1000);
    };

    initializeConnection();

    return () => {
      mounted = false;
      removeCrashListeners();
      removeChatListeners();
      disconnect();
    };
  }, [isAuthenticated, token]);

  return <>{children}</>;
};

export default ConnectionProvider;