// FIX: Use Firebase v8 namespaced API and types.
import firebase from 'firebase/compat/app';
import { User } from '../types';
import { userService } from './userService';
import { auth } from '../firebaseConfig';

export const authService = {
  login: async (username: string, passwordInput: string): Promise<User> => {
    try {
      // Firebase uses the 'username' as an email for authentication
      // FIX: Use v8 namespaced auth method.
      const userCredential = await auth.signInWithEmailAndPassword(username, passwordInput);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        // Once authenticated with Firebase, find the user's full profile in our Firestore service
        const appUser = await userService.getUserById(firebaseUser.uid);
        if (appUser) {
          return appUser;
        } else {
          // This case handles if a user exists in Firebase Auth but not in our database
          // FIX: Use v8 namespaced auth method.
          await auth.signOut(); // Sign out the user for consistency
          throw new Error("User profile not found in the database.");
        }
      } else {
        throw new Error("Authentication failed.");
      }
    } catch (error: any) {
        // Provide more user-friendly error messages
        let errorMessage = 'Invalid username or password.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Invalid username or password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'The username format is invalid.';
        }
        console.error("Firebase Login Error:", error);
        throw new Error(errorMessage);
    }
  },

  logout: async (): Promise<void> => {
    // FIX: Use v8 namespaced auth method.
    await auth.signOut();
  },

  // FIX: Use v8 namespaced auth method and types.
  onAuthChange: (callback: (user: User | null) => void): firebase.Unsubscribe => {
    return auth.onAuthStateChanged(async (firebaseUser: firebase.User | null) => {
      if (firebaseUser) {
        // User is signed in, fetch the full user profile from our service using their UID
        const appUser = await userService.getUserById(firebaseUser.uid);
        callback(appUser || null); // Pass null if profile not found
      } else {
        // User is signed out
        callback(null);
      }
    });
  },
};