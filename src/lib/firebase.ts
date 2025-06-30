import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Any value that is not set or is a placeholder will be considered invalid.
export const isFirebaseConfigured = !Object.values(firebaseConfig).some(
  (value) => !value || value.includes("your-")
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Firestore persistence failed: multiple tabs open.');
      } else if (err.code == 'unimplemented') {
        console.warn('Firestore persistence is not supported in this browser.');
      }
    });

} else {
  // This will show in the server console, not the browser.
  console.warn(`
    ---------------------------------------------------------------------
    WARNING: Firebase configuration is missing or invalid.
    The application will run in a limited mode.
    Please copy .env.example to .env and fill in your Firebase project's
    configuration details.
    You can find them in your Firebase Console:
    Project settings > General > Your apps > Web app.
    After updating, restart the development server.
    ---------------------------------------------------------------------
  `);
}

export { app, auth, db, storage };
