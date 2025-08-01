import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Make sure your Firebase project ID and authDomain spellings are correct!
// You wrote "invenorymanager" — if that's a typo, fix it to "inventorymanager" or your real project ID.

const firebaseConfig = {
  apiKey: "AIzaSyB0lxZpNrUtdDIiBoe99Izt39oqfNFv95o",
  authDomain: "inventorymanager.firebaseapp.com", // fixed typo "invenorymanager" → "inventorymanager"
  projectId: "inventorymanager",                  // fixed typo here too
  storageBucket: "inventorymanager.appspot.com",
  messagingSenderId: "720967799083",
  appId: "1:720967799083:web:5d240935718c0cf096b56e",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with React Native AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore Database
const db = getFirestore(app);

export { auth, db };

