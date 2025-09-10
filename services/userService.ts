// FIX: Use Firebase v8 namespaced API for Firestore and Auth.
import firebase, { db, auth } from '../firebaseConfig';
import { User } from '../types';

const DEFAULT_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbya5gmaGfXD3Iy-ChHE9Ev67WuE8CAZROoCf6VhAuTn49RQMDZ2X3yANkvhRrC8YMjq/exec';
// FIX: Use v8 namespaced API.
const usersCollectionRef = db.collection('users');

const migrateAdminIfNeeded = async () => {
    // This function ensures the primary admin account exists in Firestore.
    // FIX: Use v8 namespaced API.
    const adminDocRef = db.collection('users').doc('admin_andy'); // Using a predictable ID
    const docSnap = await adminDocRef.get();

    if (!docSnap.exists) {
        console.log("Primary admin not found in Firestore, creating...");
        try {
            // NOTE: On first run, you will need to manually create the 'andyhilbourne@gmail.com' user
            // in the Firebase Auth console and then create the corresponding document in Firestore.
            const adminUser: User = {
                id: 'admin_andy', 
                username: 'andyhilbourne@gmail.com', 
                name: 'Andy Hilbourne', 
                role: 'Admin', 
                webhookUrl: DEFAULT_WEBHOOK_URL,
                submittedWeeks: [],
            };
            // FIX: Use v8 namespaced API.
            await adminDocRef.set(adminUser);
            console.log("Primary admin created in Firestore.");
        } catch (error) {
            console.error("Could not create primary admin. They may need to be set up manually in Firebase Auth & Firestore.", error);
        }
    }
};

// Run the migration check once when the service loads.
migrateAdminIfNeeded();


export const userService = {
  getUserById: async (userId: string): Promise<User | undefined> => {
    try {
      // FIX: Use v8 namespaced API.
      const userDocRef = db.collection('users').doc(userId);
      const docSnap = await userDocRef.get();
      if (docSnap.exists) {
        return docSnap.data() as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw new Error("Failed to fetch user data.");
    }
  },
  
  findUserByUsername: async (username: string): Promise<User | undefined> => {
    try {
        // FIX: Use v8 namespaced query API.
        const q = usersCollectionRef.where("username", "==", username);
        const querySnapshot = await q.get();
        if (!querySnapshot.empty) {
            // Assuming username is unique, return the first result
            return querySnapshot.docs[0].data() as User;
        }
        return undefined;
    } catch (error) {
        console.error("Error finding user by username:", error);
        throw new Error("Failed to find user.");
    }
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      // FIX: Use v8 namespaced API.
      const querySnapshot = await usersCollectionRef.get();
      const users = querySnapshot.docs.map(doc => doc.data() as User);
      return users;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw new Error("Failed to fetch user list.");
    }
  },

  createUser: async (userData: Omit<User, 'id'>, password: string): Promise<User> => {
    // Check if username (email) already exists in Firestore first
    const existingUser = await userService.findUserByUsername(userData.username);
    if (existingUser) {
      throw new Error(`Username "${userData.username}" already exists.`);
    }

    try {
      // Step 1: Create user in Firebase Authentication
      // FIX: Use v8 namespaced auth method.
      const userCredential = await auth.createUserWithEmailAndPassword(userData.username, password);
      const newUserId = userCredential.user!.uid;

      // Step 2: Create user profile in Firestore
      const newUser: User = {
        ...userData,
        id: newUserId, // Use the UID from Auth as the document ID
        webhookUrl: DEFAULT_WEBHOOK_URL,
        submittedWeeks: [],
      };
      
      // FIX: Use v8 namespaced API.
      const userDocRef = db.collection('users').doc(newUserId);
      await userDocRef.set(newUser);
      
      return newUser;
    } catch (error: any) {
      console.error("Error creating user:", error);
       if (error.code === 'auth/email-already-in-use') {
        throw new Error(`The username "${userData.username}" is already registered.`);
      }
      throw new Error("Failed to create user account.");
    }
  },

  updateUser: async (userId: string, updates: Partial<Omit<User, 'id'>>): Promise<User> => {
    try {
      // If username is being changed, check for uniqueness first
      if (updates.username) {
          const existingUser = await userService.findUserByUsername(updates.username);
          if (existingUser && existingUser.id !== userId) {
              throw new Error(`Username "${updates.username}" is already taken.`);
          }
      }

      // FIX: Use v8 namespaced API.
      const userDocRef = db.collection('users').doc(userId);
      await userDocRef.update(updates);

      const updatedDoc = await userDocRef.get();
      return updatedDoc.data() as User;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user profile.");
    }
  },

  sendPasswordResetEmail: async (email: string): Promise<void> => {
    try {
        // FIX: Use v8 namespaced auth method.
        await auth.sendPasswordResetEmail(email);
    } catch (error: any) {
        console.error("Error sending password reset email:", error);
        if (error.code === 'auth/user-not-found') {
            throw new Error(`No user found with the email "${email}".`);
        }
        throw new Error("Failed to send password reset email.");
    }
  },

  addSubmittedWeek: async (userId: string, weekIdentifier: string): Promise<void> => {
    try {
        // FIX: Use v8 namespaced API.
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.update({
            // FIX: Use v8 namespaced FieldValue.
            submittedWeeks: firebase.firestore.FieldValue.arrayUnion(weekIdentifier)
        });
    } catch (error) {
        console.error("Error adding submitted week:", error);
        throw new Error("Failed to archive timesheet week.");
    }
  },

  // Note: Deleting a user from Firebase Authentication is a privileged operation
  // and cannot be done securely from the client-side SDK for other users. 
  // This requires a backend environment (e.g., Firebase Cloud Functions) with the Admin SDK.
  // The function is removed to prevent insecure implementation.
};