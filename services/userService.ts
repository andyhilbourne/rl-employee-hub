import { User } from '../types';

const MOCK_USERS_STORAGE_KEY = 'rlAllUsers_v2';

const initialMockUsers: User[] = [
  { id: 'admin_andy', username: 'andyhilbourne', name: 'Andy Hilbourne', role: 'Admin' },
];

const getStoredUsers = (): User[] => {
  const storedUsers = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
  if (storedUsers) {
    try {
      // Check if the primary admin exists, if not, reset to new initial data
      const users = JSON.parse(storedUsers) as User[];
      if (!users.some(u => u.username === 'andyhilbourne')) {
         localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(initialMockUsers));
         return initialMockUsers;
      }
      return users;
    } catch (e) {
      console.error("Error parsing users from localStorage", e);
    }
  }
  localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(initialMockUsers));
  return initialMockUsers;
};

const saveUsers = (users: User[]): void => {
  localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(users));
};

export const userService = {
  findUserByUsername: (username: string): User | undefined => {
    const users = getStoredUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

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

  createUser: async (userData: Omit<User, 'id' | 'webhookUrl'>): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getStoredUsers();
        if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
          reject(new Error(`Username "${userData.username}" already exists.`));
          return;
        }
        const newUser: User = {
          ...userData,
          id: `user_${Date.now()}`,
        };
        const updatedUsers = [...users, newUser];
        saveUsers(updatedUsers);
        resolve(newUser);
      }, 300);
    });
  },

  updateUser: async (userId: string, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let users = getStoredUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex > -1) {
          // Check if username is being changed to an existing one
          if (updates.username && users.some(u => u.username.toLowerCase() === updates.username!.toLowerCase() && u.id !== userId)) {
            reject(new Error(`Username "${updates.username}" is already taken.`));
            return;
          }
          users[userIndex] = { ...users[userIndex], ...updates };
          saveUsers(users);
          resolve(users[userIndex]);
        } else {
          resolve(undefined);
        }
      }, 300);
    });
  },
};