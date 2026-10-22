import {
  initializeApp,
  getApps,
  getApp as firebaseGetApp,
  type FirebaseApp,
} from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || '',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID      || '',
};

export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    !firebaseConfig.apiKey.startsWith('your_')
  );
}

// Log configuration status in console for easy debugging
if (typeof window !== 'undefined') {
  const maskedKey = firebaseConfig.apiKey
    ? `${firebaseConfig.apiKey.slice(0, 10)}...${firebaseConfig.apiKey.slice(-5)}`
    : 'NOT SET';
  console.log(`[Firebase Init] Project: ${firebaseConfig.projectId || 'NOT SET'} | Auth Domain: ${firebaseConfig.authDomain || 'NOT SET'} | Key: ${maskedKey}`);
  
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.endsWith('R6h9U')) {
    console.error('[Firebase Init] ERROR: VITE_FIREBASE_API_KEY appears to be set to your Google Maps API key instead of your Firebase Web API key! Please check your Vercel Environment Variables.');
  }
}

// ─── Lazy singletons — nothing runs at import time ────────────────────────────
let _app:            FirebaseApp          | null = null;
let _auth:           Auth                 | null = null;
let _db:             Firestore            | null = null;
let _storage:        FirebaseStorage      | null = null;
let _googleProvider: GoogleAuthProvider   | null = null;

function resolveApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? firebaseGetApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(resolveApp());
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(resolveApp());
  return _db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) _storage = getStorage(resolveApp());
  return _storage;
}

export function getGoogleProvider(): GoogleAuthProvider {
  if (!_googleProvider) {
    _googleProvider = new GoogleAuthProvider();
    _googleProvider.addScope('email');
    _googleProvider.addScope('profile');
  }
  return _googleProvider;
}

export default { isFirebaseConfigured };
