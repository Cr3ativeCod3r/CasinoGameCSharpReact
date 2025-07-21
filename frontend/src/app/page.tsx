'use client';

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import authStore from '@/app/stores/AuthStore';
import LoginForm from '@/app/components/LoginForm';
import RegisterForm from '@/app/components/RegisterForm';

const HomePage = observer(() => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-[#181a1e] flex flex-col justify-center items-center">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">
            {activeTab === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
        </div>
      </div>

      <div className="mt-4 w-full max-w-xl">
        <div className="bg-[#292c35] p-10 rounded-2xl shadow-lg min-h-[400px] flex flex-col justify-start">
          {/* Tab Navigation */}
          <div className="flex mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 text-base font-medium text-center border-b-2 transition-colors duration-200 focus:outline-none ${activeTab === 'login' ? 'border-[#c88200] text-[#c88200]' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
              style={{ fontWeight: 500 }}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-4 text-base font-medium text-center border-b-2 transition-colors duration-200 focus:outline-none ${activeTab === 'register' ? 'border-[#c88200] text-[#c88200]' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
              style={{ fontWeight: 500 }}
            >
              Register
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 flex flex-col justify-center">
            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </div>
    </div>
  );
});

export default HomePage;