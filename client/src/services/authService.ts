import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import {
  isFirebaseConfigured,
  getFirebaseAuth,
  getFirebaseDb,
  getGoogleProvider,
} from './firebase';

export type AuthError = { code: string; message: string };
export type { FirebaseUser };

function mapAuthError(error: unknown): AuthError {
  const code = (error as { code?: string })?.code || 'unknown';
  console.error('[Auth Error]', code, error);
  const messages: Record<string, string> = {
    'auth/user-not-found':          'No account found with this email address.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/email-already-in-use':    'An account with this email already exists.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/too-many-requests':       'Too many failed attempts. Please try again later.',
    'auth/network-request-failed':  'Network error. Check your connection.',
    'auth/popup-closed-by-user':    'Sign-in was cancelled.',
    'auth/cancelled-popup-request': 'Sign-in was cancelled.',
    'auth/invalid-credential':      'Invalid email or password.',
    'auth/operation-not-allowed':   'Email/Password sign-in not enabled in Firebase Console.',
    'auth/unauthorized-domain':     'Add localhost to Firebase authorized domains.',
    'auth/invalid-api-key':         'Invalid Firebase API key in client/.env.local.',
    'auth/popup-blocked':           'Popup blocked. Please allow popups for this site.',
    'not-configured':               'Firebase credentials not configured.',
  };
  return { code, message: messages[code] || `Auth error (${code}). Please try again.` };
}

async function upsertUserDoc(user: FirebaseUser): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    updatedAt: serverTimestamp(),
    ...(!snap.exists() && { createdAt: serverTimestamp() }),
  }, { merge: true });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<FirebaseUser> {
  if (!isFirebaseConfigured()) {
    throw { code: 'not-configured', message: 'Firebase credentials not configured.' };
  }
  try {
    const auth = getFirebaseAuth();
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    await upsertUserDoc(user);
    return user;
  } catch (err) {
    throw mapAuthError(err);
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<FirebaseUser> {
  if (!isFirebaseConfigured()) {
    throw { code: 'not-configured', message: 'Firebase credentials not configured.' };
  }
  try {
    const auth = getFirebaseAuth();
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await upsertUserDoc(user);
    return user;
  } catch (err) {
    throw mapAuthError(err);
  }
}

export async function signInWithGoogle(): Promise<FirebaseUser> {
  if (!isFirebaseConfigured()) {
    throw { code: 'not-configured', message: 'Firebase credentials not configured.' };
  }
  try {
    const auth = getFirebaseAuth();
    const { user } = await signInWithPopup(auth, getGoogleProvider());
    await upsertUserDoc(user);
    return user;
  } catch (err) {
    throw mapAuthError(err);
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw { code: 'not-configured', message: 'Firebase credentials not configured.' };
  }
  try {
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    throw mapAuthError(err);
  }
}

export function onAuthChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}
