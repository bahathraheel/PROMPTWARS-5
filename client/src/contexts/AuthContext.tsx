import React, { createContext, useContext, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { isFirebaseConfigured, getFirebaseAuth } from '../services/firebase';
import type { FirebaseUser } from '../services/authService';
import { useAuthStore } from '../store';

interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;
  initialized: boolean;
  firebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  initialized: true,
  firebaseConfigured: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized, setUser, setLoading, setInitialized } = useAuthStore();
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = onAuthStateChanged(
        getFirebaseAuth(),
        (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
          setInitialized(true);
        },
        (error) => {
          console.error('[AuthContext] Auth state error:', error);
          setLoading(false);
          setInitialized(true);
        }
      );
    } catch (err) {
      console.error('[AuthContext] Failed to subscribe to auth state:', err);
      setLoading(false);
      setInitialized(true);
    }

    return () => unsubscribe?.();
  }, [configured, setUser, setLoading, setInitialized]);

  return (
    <AuthContext.Provider value={{ user, loading, initialized, firebaseConfigured: configured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
