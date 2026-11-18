/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  signInWithGooglePopup,
  signOutFromFirebase,
  ensureUserWorkspace,
  subscribeUserData,
  getFirebaseAuthHeaders,
  GEMINI_QUOTA_UPDATED_EVENT,
  GeminiDailyQuota,
  CastingHistoryRecord,
  UserWorkspacePrefs,
} from '../firebase';
import type { BurmeseCharacterName } from '../burmeseNames';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  authBusy: boolean;
  authError: string | null;
  cloudSynced: boolean;
  cloudFavorites: string[] | null;
  cloudCustomNames: Record<string, BurmeseCharacterName> | null;
  cloudCastingHistory: CastingHistoryRecord[];
  cloudPreferences: UserWorkspacePrefs | null;
  dailyQuota: GeminiDailyQuota | null;
  refreshDailyQuota: () => Promise<void>;
  signInWithGoogle: () => Promise<User | null>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export const FirebaseProvider: React.FC<{
  children: React.ReactNode;
  defaultPrefs: UserWorkspacePrefs;
}> = ({ children, defaultPrefs }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [cloudFavorites, setCloudFavorites] = useState<string[] | null>(null);
  const [cloudCustomNames, setCloudCustomNames] = useState<Record<
    string,
    BurmeseCharacterName
  > | null>(null);
  const [cloudCastingHistory, setCloudCastingHistory] = useState<CastingHistoryRecord[]>([]);
  const [cloudPreferences, setCloudPreferences] = useState<UserWorkspacePrefs | null>(null);
  const [dailyQuota, setDailyQuota] = useState<GeminiDailyQuota | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);
  const defaultPrefsRef = useRef(defaultPrefs);
  defaultPrefsRef.current = defaultPrefs;

  if (fatalError) {
    throw fatalError;
  }

  const refreshDailyQuota = useCallback(async () => {
    if (!auth.currentUser) {
      setDailyQuota(null);
      return;
    }
    try {
      const headers = await getFirebaseAuthHeaders();
      if (!headers.Authorization) return;
      const resp = await fetch('/api/quota', { headers });
      if (!resp.ok) return;
      const data = (await resp.json()) as GeminiDailyQuota;
      if (data && typeof data.userRemaining === 'number') {
        setDailyQuota(data);
      }
    } catch {
      // Ignore transient quota poll errors
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        setCloudSynced(false);
        setCloudFavorites(null);
        setCloudCustomNames(null);
        setCloudCastingHistory([]);
        setCloudPreferences(null);
        setDailyQuota(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    void refreshDailyQuota();
    const handleQuotaEvent = () => {
      void refreshDailyQuota();
    };
    window.addEventListener(GEMINI_QUOTA_UPDATED_EVENT, handleQuotaEvent);
    return () => window.removeEventListener(GEMINI_QUOTA_UPDATED_EVENT, handleQuotaEvent);
  }, [authReady, user, refreshDailyQuota]);

  useEffect(() => {
    if (!authReady || !user) return;

    let cancelled = false;
    let unsubData: (() => void) | null = null;

    (async () => {
      try {
        const prefs = await ensureUserWorkspace(user, defaultPrefsRef.current);
        if (cancelled) return;
        setCloudPreferences(prefs);

        unsubData = subscribeUserData(user.uid, {
          onFavorites: (names) => {
            if (!cancelled) {
              setCloudFavorites(names);
              setCloudSynced(true);
            }
          },
          onCustomNames: (map) => {
            if (!cancelled) {
              setCloudCustomNames(map);
            }
          },
          onCastingHistory: (items) => {
            if (!cancelled) {
              setCloudCastingHistory(items);
            }
          },
          onPreferences: (nextPrefs) => {
            if (!cancelled) {
              setCloudPreferences(nextPrefs);
            }
          },
          onError: (err) => {
            if (!cancelled) {
              setFatalError(err);
            }
          },
        });
      } catch (err) {
        if (!cancelled) {
          setFatalError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubData?.();
    };
  }, [authReady, user]);

  const signInWithGoogle = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const signedInUser = await signInWithGooglePopup();
      return signedInUser;
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code) : '';
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || msg.includes('popup-closed-by-user')) {
        return null;
      }

      if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups and try again.');
      } else if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setAuthError('This domain is not authorized for Firebase Auth yet.');
      } else if (code === 'auth/network-request-failed' || msg.includes('network-request-failed')) {
        setAuthError('Network error while contacting Google Sign-In. Please try again.');
      } else {
        setAuthError(msg);
      }
      return null;
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOutFromFirebase();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Sign-out failed.');
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        authBusy,
        authError,
        cloudSynced,
        cloudFavorites,
        cloudCustomNames,
        cloudCastingHistory,
        cloudPreferences,
        dailyQuota,
        refreshDailyQuota,
        signInWithGoogle,
        signOut,
        clearAuthError,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return ctx;
}
