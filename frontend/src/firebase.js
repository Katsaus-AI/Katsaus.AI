/**
 * Firebase configuration and initialization for frontend application.
 * 
 * This module:
 * - Initializes Firebase app with configuration from environment variables
 * - Exports Firestore database instance for use throughout the app
 * 
 * Environment Variables (defined in .env file):
 * - VITE_FIREBASE_API_KEY: Firebase Web API key (public, used for client auth)
 * - VITE_FIREBASE_AUTH_DOMAIN: Authentication domain (e.g., project-id.firebaseapp.com)
 * - VITE_FIREBASE_DATABASE_URL: Realtime Database URL (optional if only using Firestore)
 * - VITE_FIREBASE_PROJECT_ID: Firebase project identifier
 * - VITE_FIREBASE_STORAGE_BUCKET: Cloud Storage bucket (e.g., project-id.appspot.com)
 * - VITE_FIREBASE_MESSAGING_SENDER_ID: Cloud Messaging sender ID
 * - VITE_FIREBASE_APP_ID: Firebase app identifier
 * 
 * Setup Instructions:
 * 1. Create Firebase project at https://console.firebase.google.com
 * 2. Copy frontend/.env.example to frontend/.env
 * 3. Fill in values from Firebase Console > Project Settings > General
 * 4. Ensure .env is in .gitignore (already configured)
 * 
 * Security Note:
 * - API keys in .env are public (embedded in frontend bundle)
 * - Security is enforced by Firestore Security Rules, not key secrecy
 * - Never put sensitive backend credentials in frontend .env
 * 
 * Used by:
 * - Header.jsx (fetches company name from Firestore)
 * - AuthPanel and useAuth for user sign-in and profile storage
 * - Future components that need Firestore access
 */

import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const requiredEnvKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingEnvKeys = requiredEnvKeys.filter((key) => !import.meta.env[key]);

if (missingEnvKeys.length > 0) {
  console.warn(
    `[firebase] Missing env vars: ${missingEnvKeys.join(', ')}. Using local demo defaults. Fill frontend/.env for real Firebase data.`
  );
}

// Firebase configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-no-project.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-no-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-no-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:demo',
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

/**
 * Firestore database instance.
 * 
 * Used for:
 * - Reading company information (Header component)
 * - User profile documents and per-user news feeds
 * 
 * Collections currently in use:
 * - 'companies': Organization/company information
 */
export const db = getFirestore(app);

/**
 * Firebase Auth instance for email/password sign-in.
 */
export const auth = getAuth(app);

const useEmulators =
  (import.meta.env.VITE_USE_FIREBASE_EMULATORS ?? 'true') !== 'false' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

if (useEmulators) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

