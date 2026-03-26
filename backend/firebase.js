/**
 * Firebase configuration for backend/Node.js environment.
 * 
 * This module initializes Firebase client SDK using Node.js environment variables.
 * 
 * Purpose:
 * - Provides Firebase app instance for backend scripts
 * - Uses dotenv for environment variable management
 * - Separate from frontend config (different env var loading mechanism)
 * 
 * Environment Variables (defined in backend/.env):
 * - FIREBASE_API_KEY: Firebase Web API key
 * - FIREBASE_AUTH_DOMAIN: Authentication domain
 * - FIREBASE_DATABASE_URL: Realtime Database URL
 * - FIREBASE_PROJECT_ID: Firebase project ID
 * - FIREBASE_STORAGE_BUCKET: Cloud Storage bucket
 * - FIREBASE_MESSAGING_SENDER_ID: Messaging sender ID
 * - FIREBASE_APP_ID: Firebase app ID
 * 
 * Difference from frontend/src/firebase.js:
 * - Frontend: Uses Vite's import.meta.env (VITE_ prefix)
 * - Backend: Uses process.env (no prefix) via dotenv
 * - Frontend: Firestore client SDK
 * - Backend: Could use Firebase Admin SDK for privileged operations
 * 
 * Current Status:
 * - Module exists but not actively used in application
 * - TODO comment indicates future expansion for Firebase services
 * - May be used for scheduled tasks, data migration, or admin scripts
 * 
 * Future Enhancements:
 * - Consider migrating to Firebase Admin SDK for backend operations
 * - Add Firestore, Auth, or Storage service initialization as needed
 * - Implement backend-specific Firebase operations (bulk updates, etc.)
 */

// Load environment variables from .env file
import "dotenv/config";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Firebase configuration from Node.js environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

export default app;

