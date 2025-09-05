

import { TimeEntry, User } from '../types';
import { userService } from './userService'; // To get all user IDs

const TIMESHEET_KEY_PREFIX = 'rlTimesheet_';
const CURRENT_CLOCK_IN_KEY_PREFIX = 'rlCurrentClockIn_';

const getTimesheetStorageKey = (userId: string) => `${TIMESHEET_KEY_PREFIX}${userId}`;
const getCurrentClockInStorageKey = (userId: string) => `${CURRENT_CLOCK_IN_KEY_PREFIX}${userId}`;

export const timeService = {
  clockIn: async (userId: string): Promise<TimeEntry> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const existingClockIn = localStorage.getItem(getCurrentClockInStorageKey(userId));
        if (existingClockIn) {
          reject(new Error("Already clocked in."));
          return;
        }

        const newEntry: TimeEntry = {
          id: `time_${Date.now()}_${userId}`,
          userId,
          clockInTime: new Date(),
        };
        localStorage.setItem(getCurrentClockInStorageKey(userId), JSON.stringify(newEntry));
        resolve(newEntry);
      }, 200);
    });
  },

  clockOut: async (userId: string, jobId?: string): Promise<TimeEntry> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const currentClockInStr = localStorage.getItem(getCurrentClockInStorageKey(userId));
        if (!currentClockInStr) {
          reject(new Error("Not clocked in."));
          return;
        }

        const currentEntry: TimeEntry = JSON.parse(currentClockInStr);
        currentEntry.clockOutTime = new Date();
        if (jobId) {
            currentEntry.jobId = jobId;
        }

        const storageKey = getTimesheetStorageKey(userId);
        const entriesStr = localStorage.getItem(storageKey);
        const entries: TimeEntry[] = entriesStr ? JSON.parse(entriesStr) : [];
        
        entries.push(currentEntry);
        localStorage.setItem(storageKey, JSON.stringify(entries));
        localStorage.removeItem(getCurrentClockInStorageKey(userId));
        
        resolve(currentEntry);
      }, 200);
    });
  },

  logJobCompletionAndContinue: async (userId: string, jobId: string): Promise<TimeEntry> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const clockOutTime = new Date();
        const currentClockInStorageKey = getCurrentClockInStorageKey(userId);
        const currentClockInStr = localStorage.getItem(currentClockInStorageKey);

        if (!currentClockInStr) {
          reject(new Error("Cannot complete job because you are not clocked in."));
          return;
        }

        // Finalize the current time entry segment for the job
        const completedEntry: TimeEntry = JSON.parse(currentClockInStr);
        completedEntry.clockOutTime = clockOutTime;
        completedEntry.jobId = jobId;

        // Add it to the main timesheet
        const timesheetStorageKey = getTimesheetStorageKey(userId);
        const entriesStr = localStorage.getItem(timesheetStorageKey);
        const entries: TimeEntry[] = entriesStr ? JSON.parse(entriesStr) : [];
        entries.push(completedEntry);
        localStorage.setItem(timesheetStorageKey, JSON.stringify(entries));

        // Start a new clock-in segment immediately
        const newCurrentEntry: TimeEntry = {
          id: `time_${Date.now()}_${userId}`,
          userId,
          clockInTime: clockOutTime, // New segment starts where the last one ended
        };
        localStorage.setItem(currentClockInStorageKey, JSON.stringify(newCurrentEntry));

        resolve(completedEntry);
      }, 200);
    });
  },

  getCurrentClockInEntry: (userId: string): TimeEntry | null => {
    const entryStr = localStorage.getItem(getCurrentClockInStorageKey(userId));
    if (entryStr) {
      const entry = JSON.parse(entryStr);
      return { ...entry, clockInTime: new Date(entry.clockInTime) }; // Ensure Date object
    }
    return null;
  },

  getTimesheetEntries: async (userId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const storageKey = getTimesheetStorageKey(userId);
        const entriesStr = localStorage.getItem(storageKey);
        let entries: TimeEntry[] = entriesStr ? JSON.parse(entriesStr) : [];

        entries = entries.map(e => ({
            ...e,
            clockInTime: new Date(e.clockInTime),
            clockOutTime: e.clockOutTime ? new Date(e.clockOutTime) : undefined,
        }));
        
        if (startDate) {
            entries = entries.filter(e => e.clockInTime >= startDate);
        }
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            entries = entries.filter(e => e.clockInTime <= endOfDay);
        }
        
        entries.sort((a, b) => b.clockInTime.getTime() - a.clockInTime.getTime());
        resolve(entries);
      }, 300);
    });
  },

  updateTimesheetEntry: async (userId: string, entryId: string, updates: Partial<Pick<TimeEntry, 'clockInTime' | 'clockOutTime' | 'notes'>>): Promise<TimeEntry> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const storageKey = getTimesheetStorageKey(userId);
        const entriesStr = localStorage.getItem(storageKey);
        let entries: TimeEntry[] = entriesStr ? JSON.parse(entriesStr) : [];

        // Make sure we have Date objects to work with
        entries = entries.map(e => ({
            ...e,
            clockInTime: new Date(e.clockInTime),
            clockOutTime: e.clockOutTime ? new Date(e.clockOutTime) : undefined,
        }));

        const entryIndex = entries.findIndex(e => e.id === entryId);

        if (entryIndex === -1) {
          reject(new Error("Time entry not found."));
          return;
        }

        const originalEntry = entries[entryIndex];
        const updatedEntry = { ...originalEntry, ...updates };

        if (updatedEntry.clockOutTime && updatedEntry.clockInTime > updatedEntry.clockOutTime) {
            reject(new Error("Clock out time cannot be before clock in time."));
            return;
        }
        
        entries[entryIndex] = updatedEntry;
        
        localStorage.setItem(storageKey, JSON.stringify(entries));
        resolve(updatedEntry);
      }, 300);
    });
  },

  deleteTimesheetEntry: async (userId: string, entryId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const storageKey = getTimesheetStorageKey(userId);
            const entriesStr = localStorage.getItem(storageKey);
            let entries: TimeEntry[] = entriesStr ? JSON.parse(entriesStr) : [];

            const updatedEntries = entries.filter(e => e.id !== entryId);

            if (entries.length === updatedEntries.length) {
                reject(new Error("Time entry not found to delete."));
                return;
            }

            localStorage.setItem(storageKey, JSON.stringify(updatedEntries));
            resolve();
        }, 300);
    });
  },

  // New function for Admin
  getAllTimesheetEntriesForAdmin: async (startDate?: Date, endDate?: Date, filterUserIds?: string[]): Promise<TimeEntry[]> => {
    return new Promise(async (resolve) => {
        let allEntries: TimeEntry[] = [];
        const users = await userService.getAllUsers();
        const userIdsToFetch = filterUserIds && filterUserIds.length > 0 
            ? filterUserIds 
            : users.map(u => u.id);

        for (const userId of userIdsToFetch) {
            const storageKey = getTimesheetStorageKey(userId);
            const entriesStr = localStorage.getItem(storageKey);
            if (entriesStr) {
                const userEntries: TimeEntry[] = JSON.parse(entriesStr);
                allEntries.push(...userEntries);
            }
        }
        
        allEntries = allEntries.map(e => ({
            ...e,
            clockInTime: new Date(e.clockInTime),
            clockOutTime: e.clockOutTime ? new Date(e.clockOutTime) : undefined,
        }));

        if (startDate) {
            allEntries = allEntries.filter(e => e.clockInTime >= startDate);
        }
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            allEntries = allEntries.filter(e => e.clockInTime <= endOfDay);
        }

        allEntries.sort((a, b) => b.clockInTime.getTime() - a.clockInTime.getTime());
        resolve(allEntries);
    });
  }
};