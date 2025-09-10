// firebaseConfig.ts
// FIX: Use v8 compat imports to work with v9+ SDK.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// The new configuration from your fresh Firebase project.
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "rl-employee-hub-v2.firebaseapp.com",
  projectId: "rl-employee-hub-v2",
  storageBucket: "rl-employee-hub-v2.appspot.com",
  messagingSenderId: "386245536917",
  appId: "1:386245536917:web:ad4a354c95ee8e6d063f9c"
};


// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Cloud Firestore and get a reference to the service
const dbInstance = firebase.firestore();

// Enable offline persistence for a better offline experience.
// This allows the app to function with cached data when the network is unavailable.
try {
  dbInstance.enablePersistence()
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        // This can happen if multiple tabs are open, as persistence can only be enabled in one.
        console.warn('Firestore persistence failed: Multiple tabs open.');
      } else if (err.code == 'unimplemented') {
        // The browser does not support the required features for persistence.
        console.warn('Firestore persistence is not supported in this browser.');
      }
    });
} catch (error) {
  console.error("An error occurred while enabling Firestore persistence:", error);
}

export const db: firebase.firestore.Firestore = dbInstance;

// Initialize Firebase Authentication and get a reference to the service
export const auth: firebase.auth.Auth = firebase.auth();

export default firebase;