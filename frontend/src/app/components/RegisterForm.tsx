'use client';

import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import authStore from '@/app/stores/AuthStore';
import { RegisterDto } from '@/app/types/auth';

const RegisterForm = observer(() => {
  const [formData, setFormData] = useState<RegisterDto>({
    nickName: '',
    email: '',
    password: ''
  });

  const [validationErrors, setValidationErrors] = useState<Partial<RegisterDto>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (validationErrors[name as keyof RegisterDto]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<RegisterDto> = {};

    if (!formData.nickName) {
      errors.nickName = 'Nickname is required';
    } else if (formData.nickName.length < 3) {
      errors.nickName = 'Nickname must be at least 3 characters';
    } else if (formData.nickName.length > 50) {
      errors.nickName = 'Nickname cannot exceed 50 characters';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length > 100) {
      errors.password = 'Password cannot exceed 100 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const result = await authStore.register(formData);
    
    if (result.success) {
      setSuccessMessage('Registration successful! You can now log in.');
      setFormData({
        nickName: '',
        email: '',
        password: ''
      });
    }
  };

  return (
    <div className="bg-[#181a1e] flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-[#292c35] w-full">
        {authStore.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {authStore.error}
          </div>
        )}

        {successMessage && (
          // Stylistyka spójna z komunikatem o błędzie
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <div>
          <label htmlFor="nickName" className="block text-sm font-medium text-gray-200">
            Nickname
          </label>
          <div className="mt-1">
            <input
              id="nickName"
              name="nickName"
              type="text"
              value={formData.nickName}
              onChange={handleInputChange}
              className={`bg-[#181a1e] text-white border ${validationErrors.nickName ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 w-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c88200] focus:border-[#c88200]`}
              placeholder="Enter your nickname"
            />
            {validationErrors.nickName && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.nickName}</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <label htmlFor="email" className="block text-sm font-medium text-gray-200">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`bg-[#181a1e] text-white border ${validationErrors.email ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 w-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c88200] focus:border-[#c88200]`}
              placeholder="Enter your email"
            />
            {validationErrors.email && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <label htmlFor="password" className="block text-sm font-medium text-gray-200">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`bg-[#181a1e] text-white border ${validationErrors.password ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 w-full placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c88200] focus:border-[#c88200]`}
              placeholder="Enter your password"
            />
            {validationErrors.password && (
              <p className="mt-2 text-sm text-red-600">{validationErrors.password}</p>
            )}
          </div>
        </div>

        <div className="mt-12">
          <button
            type="submit"
            disabled={authStore.loading}
            className={`w-full flex justify-center py-4 px-4 rounded-md shadow text-sm font-medium text-white transition-colors duration-200 ${authStore.loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#c88200] hover:bg-[#a86a00] focus:outline-none focus:ring-2 focus:ring-[#c88200]'}`}
          >
            {authStore.loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  );
});

export default RegisterForm;