import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyB0lxZpNrUtdDIiBoe99Izt39oqfNFv95o",
  authDomain: "invenorymanager.firebaseapp.com",
  projectId: "invenorymanager",
  storageBucket: "invenorymanager.appspot.com",  // corrected here
  messagingSenderId: "720967799083",
  appId: "1:720967799083:web:5d240935718c0cf096b56e",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };

