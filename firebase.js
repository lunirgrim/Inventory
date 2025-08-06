import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyB0lxZpNrUtdDIiBoe99Izt39oqfNFv95o",
  authDomain: "invenorymanager.firebaseapp.com",
  projectId: "invenorymanager",
  storageBucket: "invenorymanager.appspot.com",
  messagingSenderId: "720967799083",
  appId: "1:720967799083:web:5d240935718c0cf096b56e",
};

// Initialize Firebase app once
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

let auth; // singleton instance

// Safe async getter for cross-platform auth
export async function getAuthInstance() {
  if (auth) return auth;

  if (Platform.OS === 'web') {
    // Standard Web Auth
    auth = getAuth(app);
  } else {
    // Native (React Native) Auth setup using dynamic import
    const { initializeAuth, getReactNativePersistence } = await import('firebase/auth');
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }

  return auth;
}

export { db };

