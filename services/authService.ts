import { User } from '../types';
import { userService } from './userService'; // Import userService

const MOCK_USER_KEY = 'rlUser';

export const authService = {
  login: async (username: string, passwordInput: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = userService.findUserByUsername(username);
        
        let isValidPassword = false;
        if (user) {
            // Specific check for the new admin user
            if (user.username === 'andyhilbourne' && passwordInput === 'Esmeisaac_2016') {
                isValidPassword = true;
            } 
            // Generic check for other potential admin users created via UI
            else if (user.role === 'Admin' && passwordInput === 'adminpass') {
                isValidPassword = true;
            } 
            // Generic check for all non-admin roles
            else if (user.role !== 'Admin' && passwordInput === 'password') {
                isValidPassword = true;
            }
        }

        if (user && isValidPassword) {
          localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error('Invalid username or password.'));
        }
      }, 500);
    });
  },

  logout: (): void => {
    localStorage.removeItem(MOCK_USER_KEY);
    // In a real app, you might also invalidate a server-side session/token
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(MOCK_USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
        localStorage.removeItem(MOCK_USER_KEY);
        return null;
      }
    }
    return null;
  },
};