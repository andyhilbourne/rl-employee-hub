import { User } from '../types';
import { userService } from './userService'; // Import userService

const MOCK_USER_KEY = 'rlUser';

export const authService = {
  login: async (username: string, passwordInput: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = userService.findUserByUsername(username);
        
        if (user && user.password === passwordInput) {
          // Create a user object without the password to store in localStorage
          const { password, ...userToStore } = user;
          localStorage.setItem(MOCK_USER_KEY, JSON.stringify(userToStore));
          resolve(userToStore as User);
        } else {
          reject(new Error('Invalid username or password.'));
        }
      }, 500);
    });
  },

  logout: (): void => {
    localStorage.removeItem(MOCK_USER_KEY);
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