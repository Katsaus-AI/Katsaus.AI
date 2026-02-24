import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBxbxx6hfbQ4Mw1b71sKEOttjAR6yHONqo',
  authDomain: 'teks4407.firebaseapp.com',
  databaseURL: 'https://teks4407-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'teks4407',
  storageBucket: 'teks4407.firebasestorage.app',
  messagingSenderId: '71543363715',
  appId: '1:71543363715:web:743546d674f84cc14263b6',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
