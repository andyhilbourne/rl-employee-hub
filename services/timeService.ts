
// FIX: Use Firebase v8 namespaced API for Firestore.
import firebase, { db } from '../firebaseConfig';
import { TimeEntry } from '../types';
import { userService } from './userService';

// FIX: Use v8 namespaced API.
const timeEntriesCollectionRef = db.collection('timeEntries');
// FIX: Get Timestamp type from the v8 firebase object.
const Timestamp = firebase.firestore.Timestamp;

const mapDocToTimeEntry = (doc: firebase.firestore.DocumentSnapshot): TimeEntry => {
  const data = doc.data()!;
  return {
    id: doc.id,
    userId: data.userId,
    // FIX: Use v8 Timestamp type.
    clockInTime: (data.clockInTime as firebase.firestore.Timestamp).toDate(),
    clockOutTime: data.clockOutTime ? (data.clockOutTime as firebase.firestore.Timestamp).toDate() : undefined,
    jobId: data.jobId,
    siteId: data.siteId,
    notes: data.notes,
  };
};

export const timeService = {
  clockIn: async (userId: string): Promise<TimeEntry> => {
    try {
      // FIX: Use v8 namespaced API for transactions.
      const newEntryRef = await db.runTransaction(async (transaction) => {
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists) throw new Error("User not found.");
        if (userDoc.data()!.activeClockInId) throw new Error("Already clocked in.");

        const newTimeEntry = {
          userId,
          clockInTime: new Date(),
        };
        const newDocRef = db.collection('timeEntries').doc(); // Generate ref beforehand
        transaction.set(newDocRef, newTimeEntry);
        transaction.update(userDocRef, { activeClockInId: newDocRef.id });
        
        return newDocRef;
      });
      const newEntryDoc = await newEntryRef.get();
      return mapDocToTimeEntry(newEntryDoc);
    } catch (error) {
      console.error("Clock-in failed:", error);
      throw error;
    }
  },

  clockOut: async (userId: string, jobId?: string): Promise<TimeEntry> => {
     try {
      // FIX: Use v8 namespaced API for transactions.
      const entryRef = await db.runTransaction(async (transaction) => {
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists) throw new Error("User not found.");
        
        const activeClockInId = userDoc.data()!.activeClockInId;
        if (!activeClockInId) throw new Error("Not clocked in.");

        const timeEntryDocRef = db.collection('timeEntries').doc(activeClockInId);
        const updatePayload: any = { clockOutTime: new Date() };
        if (jobId) updatePayload.jobId = jobId;

        transaction.update(timeEntryDocRef, updatePayload);
        transaction.update(userDocRef, { activeClockInId: null });
        return timeEntryDocRef;
      });
      const updatedEntryDoc = await entryRef.get();
      return mapDocToTimeEntry(updatedEntryDoc);
    } catch (error) {
      console.error("Clock-out failed:", error);
      throw error;
    }
  },

  logJobCompletionAndContinue: async (userId: string, jobId: string): Promise<TimeEntry> => {
    try {
      // FIX: Use v8 namespaced API for transactions.
      const completedEntryRef = await db.runTransaction(async (transaction) => {
        const clockOutTime = new Date();
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists) throw new Error("User not found.");

        const activeClockInId = userDoc.data()!.activeClockInId;
        if (!activeClockInId) throw new Error("Cannot complete job because you are not clocked in.");
        
        const completedTimeEntryRef = db.collection('timeEntries').doc(activeClockInId);
        transaction.update(completedTimeEntryRef, { clockOutTime, jobId });

        const newTimeEntry = { userId, clockInTime: clockOutTime };
        const newDocRef = db.collection('timeEntries').doc();
        transaction.set(newDocRef, newTimeEntry);
        transaction.update(userDocRef, { activeClockInId: newDocRef.id });

        return completedTimeEntryRef;
      });
      const completedEntryDoc = await completedEntryRef.get();
      return mapDocToTimeEntry(completedEntryDoc);
    } catch (error)
    {
      console.error("Job completion logging failed:", error);
      throw error;
    }
  },

  getCurrentClockInEntry: async (userId: string): Promise<TimeEntry | null> => {
    const user = await userService.getUserById(userId);
    if (user && user.activeClockInId) {
      // FIX: Use v8 namespaced API.
      const entryDocRef = db.collection('timeEntries').doc(user.activeClockInId);
      const docSnap = await entryDocRef.get();
      if (docSnap.exists) {
        return mapDocToTimeEntry(docSnap);
      }
    }
    return null;
  },

  getTimesheetEntries: async (userId: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]> => {
    try {
      // FIX: Use v8 namespaced query API.
      let q: firebase.firestore.Query = timeEntriesCollectionRef
        .where("userId", "==", userId);

      if (startDate) q = q.where("clockInTime", ">=", startDate);
      if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          q = q.where("clockInTime", "<=", endOfDay);
      }
      
      const querySnapshot = await q.get();
      const entries = querySnapshot.docs.map(mapDocToTimeEntry);
      
      // Sort in-memory to avoid needing a composite index in Firestore
      entries.sort((a, b) => b.clockInTime.getTime() - a.clockInTime.getTime());
      
      return entries;
    } catch (error) {
      console.error("Error fetching timesheet entries:", error);
      throw new Error("Failed to fetch timesheet entries.");
    }
  },

  updateTimesheetEntry: async (entryId: string, updates: Partial<Pick<TimeEntry, 'clockInTime' | 'clockOutTime' | 'notes' | 'siteId'>>): Promise<TimeEntry> => {
    try {
      // FIX: Use v8 namespaced API.
      const entryDocRef = db.collection('timeEntries').doc(entryId);
      const originalDoc = await entryDocRef.get();

      if (!originalDoc.exists) throw new Error("Time entry not found.");

      const newClockOut = updates.clockOutTime;
      const newClockIn = updates.clockInTime;

      if(newClockOut && newClockIn && newClockIn > newClockOut) {
          throw new Error("Clock out time cannot be before clock in time.");
      }
      
      await entryDocRef.update(updates);
      const updatedDoc = await entryDocRef.get();
      return mapDocToTimeEntry(updatedDoc);
    } catch (error) {
      console.error("Error updating time entry:", error);
      throw error instanceof Error ? error : new Error("Failed to update time entry.");
    }
  },

  deleteTimesheetEntry: async (entryId: string): Promise<void> => {
    try {
      // FIX: Use v8 namespaced API.
      const entryDocRef = db.collection('timeEntries').doc(entryId);
      await entryDocRef.delete();
    } catch (error) {
      console.error("Error deleting time entry:", error);
      throw new Error("Failed to delete time entry.");
    }
  },

  getAllTimesheetEntriesForAdmin: async (startDate?: Date, endDate?: Date, filterUserIds?: string[]): Promise<TimeEntry[]> => {
    try {
      // FIX: Use v8 namespaced query API.
      let q: firebase.firestore.Query = timeEntriesCollectionRef.orderBy("clockInTime", "desc");

      if (filterUserIds && filterUserIds.length > 0) {
        q = q.where("userId", "in", filterUserIds);
      }
      if (startDate) {
        q = q.where("clockInTime", ">=", startDate);
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        q = q.where("clockInTime", "<=", endOfDay);
      }
      
      const querySnapshot = await q.get();
      return querySnapshot.docs.map(mapDocToTimeEntry);
    } catch (error) {
      console.error("Error fetching all admin timesheet entries:", error);
      throw new Error("Failed to fetch admin timesheet reports.");
    }
  }
};