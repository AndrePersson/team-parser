import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase App Initialized:", app);
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Initialize Firestore
let db;
try {
  db = getFirestore(app);
  console.log("Firestore Initialized:", db);
} catch (error) {
  console.error("Error initializing Firestore:", error);
}

// Check if db is initialized correctly
if (!db) {
  console.error("Firestore is not initialized properly.");
} else {
  console.log("Firestore instance is ready to use.");
}

// Export functions for use in your app
export { db, collection, addDoc, getDocs, deleteDoc, doc };
