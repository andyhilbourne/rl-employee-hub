import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { Button } from './Button';
import { UserCircleIcon } from './icons'; // Removed BuildingOfficeIcon import

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

const R_L_LOGO_URL = 'assets/logo.png'; // Path to the new logo file

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await authService.login(username, password);
      onLoginSuccess(user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* Replace BuildingOfficeIcon with img tag for the logo */}
          <img 
            src={R_L_LOGO_URL} 
            alt="R&L Logo" 
            className="h-20 w-auto mx-auto mb-4" 
          />
          <h1 className="text-4xl font-bold text-white">R&L</h1>
          <p className="text-gray-400 mt-2">Employee Login</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 shadow-2xl rounded-lg px-8 pt-6 pb-8 mb-4">
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCircleIcon className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., employee"
                className="shadow appearance-none border border-gray-700 rounded w-full py-3 px-4 pl-10 bg-gray-700 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                aria-label="Username"
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {/* Using a generic lock icon as an example if needed, or remove if logo implies branding sufficiently */}
                    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2V10a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm0 8a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g., password"
                className="shadow appearance-none border border-gray-700 rounded w-full py-3 px-4 pl-10 bg-gray-700 text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                aria-label="Password"
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs italic mb-4" role="alert">{error}</p>}
          <div className="flex items-center justify-between">
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
              Sign In
            </Button>
          </div>
        </form>
        <p className="text-center text-gray-500 text-xs">
          &copy;{new Date().getFullYear()} R&L Corp. All rights reserved.
        </p>
      </div>
    </div>
  );
};
