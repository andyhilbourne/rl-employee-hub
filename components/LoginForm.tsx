
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { User } from '../types';
import { Button } from './Button';
import { UserCircleIcon, ArrowLeftIcon } from './icons';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  // Common states
  const [isLoading, setIsLoading] = useState(false);
  
  // View state
  const [view, setView] = useState<'login' | 'reset'>('login');

  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Reset password states
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    try {
      const user = await authService.login(username, password);
      onLoginSuccess(user);
    } catch (err) {
      if (err instanceof Error) {
        setLoginError(err.message);
      } else {
        setLoginError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setResetMessage(null);
    try {
      await userService.sendPasswordResetEmail(resetEmail);
      setResetMessage({ type: 'success', text: 'Password reset link sent! Please check your email inbox and spam folder.' });
      setResetEmail('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setResetMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackToLogin = () => {
    setView('login');
    setResetMessage(null);
    setLoginError(null);
    setResetEmail('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto bg-white shadow-xl rounded-2xl p-8">
        {view === 'login' ? (
          <>
            <div className="text-center mb-8">
                <img src="logo.png" alt="R&L Company Logo" className="mx-auto h-16 w-auto" />
                <h1 className="text-3xl font-bold text-gray-800 mt-4">R&L Employee Hub</h1>
                <p className="text-gray-500 mt-1">Please sign in to continue</p>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <UserCircleIcon className="h-5 w-5 text-gray-400" />
                     </div>
                    <input
                        id="username"
                        name="username"
                        type="email"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Username (email)"
                        disabled={isLoading}
                    />
                </div>
              </div>

              <div>
                <label htmlFor="password"className="sr-only">Password</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clipRule="evenodd" />
                        </svg>
                     </div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Password"
                        disabled={isLoading}
                    />
                </div>
              </div>

              <div className="flex items-center justify-end -my-2">
                <button 
                  type="button" 
                  onClick={() => setView('reset')} 
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                >
                  Forgot your password?
                </button>
              </div>
              
              {loginError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{loginError}</p>}
              
              <div>
                <Button type="submit" isLoading={isLoading} className="w-full justify-center py-3 text-base">
                  Sign In
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Forgot Password</h1>
                <p className="text-gray-500 mt-1">Enter your email to receive a reset link.</p>
            </div>
            <form onSubmit={handleResetSubmit} className="space-y-6">
               <div>
                <label htmlFor="reset-email" className="sr-only">Email</label>
                <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <UserCircleIcon className="h-5 w-5 text-gray-400" />
                     </div>
                    <input
                        id="reset-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Your username (email)"
                        disabled={isLoading}
                    />
                </div>
              </div>

              {resetMessage && (
                <p className={`text-sm p-3 rounded-md text-center ${resetMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {resetMessage.text}
                </p>
              )}

              <div>
                <Button type="submit" isLoading={isLoading} className="w-full justify-center py-3 text-base">
                  Send Reset Link
                </Button>
              </div>
            </form>
            <div className="mt-6 text-center">
              <button 
                type="button" 
                onClick={handleBackToLogin}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded flex items-center justify-center mx-auto"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Back to Sign In
              </button>
            </div>
          </>
        )}
      </div>
       <footer className="text-center p-4 text-sm text-gray-500 mt-8">
        R&L Employee Hub &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};