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
 * - Future components that need Firestore access
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

/**
 * Firestore database instance.
 * 
 * Used for:
 * - Reading company information (Header component)
 * - Future: User authentication, message persistence, etc.
 * 
 * Collections currently in use:
 * - 'companies': Organization/company information
 */
export const db = getFirestore(app);

