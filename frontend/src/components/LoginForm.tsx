import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/AuthStore';
import type { LoginDto } from '@/types/auth';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();
  
  const [formData, setFormData] = useState<LoginDto>({
    email: '',
    password: ''
  });

  const [validationErrors, setValidationErrors] = useState<Partial<LoginDto>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validationErrors[name as keyof LoginDto]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<LoginDto> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const result = await login(formData);
    
    if (result.success) {
      setFormData({
        email: '',
        password: ''
      });
      navigate('/');
    }
  };

  return (
    <div className="bg-[#181a1e] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-[#292c35] w-full"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div>
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
            disabled={loading}
            className={`w-full flex justify-center py-4 px-4 rounded-md shadow text-sm font-medium text-white transition-colors duration-200 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#c88200] hover:bg-[#a86a00] focus:outline-none focus:ring-2 focus:ring-[#c88200]'}`}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;