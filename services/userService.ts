
import { User } from '../types';

const MOCK_USERS_STORAGE_KEY = 'rlAllUsers';

// Initial mock users. In a real app, this would be fetched or managed by a backend.
const initialMockUsers: User[] = [
  { id: 'emp001', username: 'employee', name: 'John Doe', role: 'Field Worker' },
  { id: 'emp002', username: 'worker2', name: 'Jane Smith', role: 'Foreman' },
  { id: 'admin001', username: 'admin', name: 'Admin User', role: 'Admin' },
];

const getStoredUsers = (): User[] => {
  const storedUsers = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
  if (storedUsers) {
    try {
      const users = JSON.parse(storedUsers);
      // Simple migration: if a user doesn't have a webhookUrl, it will be undefined, which is fine.
      return users;
    } catch (e) {
      console.error("Error parsing users from localStorage", e);
      // Fallback to initial if stored is corrupted
    }
  }
  localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(initialMockUsers));
  return initialMockUsers;
};

const saveUsers = (users: User[]): void => {
  localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(users));
};

export const userService = {
  getAllUsers: async (): Promise<User[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getStoredUsers());
      }, 200);
    });
  },

  getUserById: async (userId: string): Promise<User | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getStoredUsers();
        resolve(users.find(u => u.id === userId));
      }, 100);
    });
  },
  
  getUsersByRole: async (role: User['role']): Promise<User[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getStoredUsers();
        resolve(users.filter(u => u.role === role));
      }, 100);
    });
  },

  createUser: async (userData: Omit<User, 'id' | 'webhookUrl'>): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getStoredUsers();
        if (users.some(u => u.username === userData.username)) {
          reject(new Error(`Username "${userData.username}" already exists.`));
          return;
        }
        const newUser: User = {
          ...userData,
          id: `user_${Date.now()}`,
        };
        const updatedUsers = [...users, newUser];
        saveUsers(updatedUsers);
        console.log('Mock createUser:', newUser); // For debugging
        resolve(newUser);
      }, 300);
    });
  },

  updateUser: async (userId: string, updates: Partial<Omit<User, 'id'>>): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let users = getStoredUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex > -1) {
                users[userIndex] = { ...users[userIndex], ...updates };
                saveUsers(users);
                resolve(users[userIndex]);
            } else {
                reject(new Error("User not found."));
            }
        }, 300);
    });
  },

  // deleteUser: async (userId: string): Promise<void> => { ... }


  // This function is used by authService for login
  findUserByUsername: (username: string): User | undefined => {
    const users = getStoredUsers();
    return users.find(u => u.username === username);
  }
};