'use client'
import crashGameStore from '@/app/stores/CrashGameStore';
import useAuthStore from '@/app/stores/AuthStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (user && !crashGameStore.connected) {
      crashGameStore.connect();
    }
    return () => {
      crashGameStore.disconnect();
    };
  }, [user]);

  return (
    <div className="w-full h-10 text-white text-center text-3xl flex items-center" style={{ backgroundColor: 'rgb(41, 44, 53)' }}>
      <div className="float-left ml-12 font-bold" style={{ color: 'rgb(40, 117, 40)' }}>
        CSGOcrash
      </div>
      <div className="ml-auto mr-4 text-xl flex items-center">
        Coins:
        <span className="ml-2 text-yellow-400 font-bold">
          {crashGameStore.connected ? crashGameStore.formattedBalance : '0.00'}
        </span>
        {!crashGameStore.connected && (
          <span className="ml-2 text-red-400 text-sm">
            (Offline)
          </span>
        )}
        {isAuthenticated && user && (
          <>
            <span className="ml-6 text-white font-semibold">
              {user.nickName}
            </span>
            <button
              onClick={logout}
              className="ml-4 py-1 px-3 rounded bg-[#d32f2f] hover:bg-[#b71c1c] text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#d32f2f]"
              style={{ fontSize: 14 }}
            >
              Logout
            </button>
          </>
        )}
        {!isAuthenticated && (
          <button
            onClick={() => router.push('/')}
            className="ml-6 py-1 px-3 rounded bg-[#287528] hover:bg-[#1e5a1e] text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#287528]"
            style={{ fontSize: 14 }}
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;