import React, { useState } from 'react';
import useAuthStore from '@/app/stores/AuthStore';

const LoginForm = () => {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Czyść błędy gdy użytkownik zaczyna pisać
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    const result = await login(formData);
    
    if (result.success) {
      console.log('Zalogowano pomyślnie');
      // Tutaj możesz dodać przekierowanie lub inne akcje po pomyślnym logowaniu
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Logowanie
      </h2>
      
      <div className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Wprowadź swój email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Hasło
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Wprowadź swoje hasło"
          />
        </div>

        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition duration-200"
        >
          {isLoading ? 'Logowanie...' : 'Zaloguj się'}
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Nie masz konta?{' '}
          <a href="#" className="text-blue-600 hover:text-blue-500">
            Zarejestruj się
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;