'use client'
import { observer } from 'mobx-react-lite';
import crashGameStore from '@/app/stores/CrashGameStore';
import authStore from '@/app/stores/AuthStore';
import { useEffect } from 'react';

const Navbar = observer(() => {
  useEffect(() => {
    // Connect to SignalR when component mounts
    if (authStore.user && !crashGameStore.connected) {
      crashGameStore.connect();
    }

    // Cleanup on unmount
    return () => {
      crashGameStore.disconnect();
    };
  }, [authStore.user]);

  const handleLogout = () => {
    crashGameStore.disconnect();
    authStore.logout();
  };

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
      </div>
      <div className="text-orange-500 mr-12 text-xl cursor-pointer hover:text-orange-400 transition-colors" onClick={handleLogout}>
        Logout
      </div>
    </div>
  );
});

export default Navbar;