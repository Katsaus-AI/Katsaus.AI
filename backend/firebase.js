// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxbxx6hfbQ4Mw1b71sKEOttjAR6yHONqo",
  authDomain: "teks4407.firebaseapp.com",
  databaseURL: "https://teks4407-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "teks4407",
  storageBucket: "teks4407.firebasestorage.app",
  messagingSenderId: "71543363715",
  appId: "1:71543363715:web:743546d674f84cc14263b6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
