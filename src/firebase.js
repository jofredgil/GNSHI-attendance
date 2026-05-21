import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { enableMultiTabIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8_BY_XDf97Fv4rRdKD2OAX8AnD3VTjIA",
  authDomain: "gnshi-attendance.firebaseapp.com",
  projectId: "gnshi-attendance",
  storageBucket: "gnshi-attendance.firebasestorage.app",
  messagingSenderId: "1097687704477",
  appId: "1:1097687704477:web:b6e868eb423b8bca018574",
  measurementId: "G-122585KZQF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { firebaseConfig };

// Then immediately after: const db = getFirestore(app);
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    // Multiple tabs open — persistence only works in one tab at a time
    console.warn("Firestore persistence failed: multiple tabs open.");
  } else if (err.code === "unimplemented") {
    // Browser doesn't support persistence
    console.warn("Firestore persistence not supported in this browser.");
  }
});