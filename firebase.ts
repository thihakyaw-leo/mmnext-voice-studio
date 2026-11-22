/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import firebaseConfig from './firebase-applet-config.json';
import { AiRecommendation } from './types';
import type { BurmeseCharacterName } from './burmeseNames';
import type { VisualizerVariant } from './components/AudioVisualizer';
import type { Language } from './i18n';
import { GOOGLE_DRIVE_SCOPES } from './utils/googleDrive';

// Validation Synchronicity Constants (Mirrored verbatim from firebase-blueprint.json & firestore.rules)
export const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const MAX_ID_LENGTH = 128;
export const MAX_DISPLAY_NAME_LENGTH = 120;
export const MAX_VOICE_NAME_LENGTH = 64;
export const MAX_BURMESE_NAME_LENGTH = 80;
export const MAX_CHARACTER_TRANSCRIPT_LENGTH = 2500;
export const MAX_PROMPT_LENGTH = 1000;
export const MAX_SYSTEM_INSTRUCTION_LENGTH = 4000;
export const MAX_SAMPLE_TEXT_LENGTH = 1000;
export const MAX_CASTING_VOICE_NAMES = 10;
export const MAX_API_KEY_LENGTH = 512;

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const analytics =
  typeof window !== 'undefined' && firebaseConfig.measurementId
    ? (() => {
        try {
          return getAnalytics(app);
        } catch (e) {
          console.warn('Firebase Analytics initialization skipped:', e);
          return null;
        }
      })()
    : null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// In-memory only OAuth access token for Google Drive (never written to localStorage/sessionStorage)
let cachedDriveAccessToken: string | null = null;
const driveTokenListeners = new Set<(connected: boolean) => void>();

function notifyDriveTokenListeners() {
  const connected = Boolean(cachedDriveAccessToken);
  for (const listener of driveTokenListeners) {
    try {
      listener(connected);
    } catch {}
  }
}

export function getGoogleDriveAccessToken(): string | null {
  return cachedDriveAccessToken;
}

export function clearGoogleDriveAccessToken(): void {
  if (cachedDriveAccessToken !== null) {
    cachedDriveAccessToken = null;
    notifyDriveTokenListeners();
  }
}

export function subscribeGoogleDriveTokenState(
  listener: (connected: boolean) => void
): () => void {
  driveTokenListeners.add(listener);
  return () => {
    driveTokenListeners.delete(listener);
  };
}

onAuthStateChanged(auth, (currentUser) => {
  if (!currentUser) {
    clearGoogleDriveAccessToken();
  }
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export async function signInWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function connectGoogleDrivePopup(): Promise<{ user: User; accessToken: string }> {
  const driveProvider = new GoogleAuthProvider();
  for (const scope of GOOGLE_DRIVE_SCOPES) {
    driveProvider.addScope(scope);
  }
  const params: Record<string, string> = {
    prompt: 'consent',
  };
  if (auth.currentUser?.email) {
    params.login_hint = auth.currentUser.email;
  }
  driveProvider.setCustomParameters(params);

  const result = await signInWithPopup(auth, driveProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;
  if (!accessToken) {
    throw new Error('Google Drive permission was not granted.');
  }
  cachedDriveAccessToken = accessToken;
  notifyDriveTokenListeners();
  return { user: result.user, accessToken };
}

export async function signOutFromFirebase(): Promise<void> {
  clearGoogleDriveAccessToken();
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('mmnext_user_gemini_api_key');
    } catch {}
  }
  await signOut(auth);
}

// --- Sanitization Helpers ---
function clampNonEmptyString(value: string, maxLen: number, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLen);
}

function isSafeId(id: string, maxLen = MAX_ID_LENGTH): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= maxLen && ID_PATTERN.test(id);
}

export interface UserWorkspacePrefs {
  language: Language;
  isDarkMode: boolean;
  visualizerVariant: VisualizerVariant;
  apiKey?: string | null;
}

export interface CastingHistoryRecord extends AiRecommendation {
  id: string;
  prompt: string;
  createdAtMs: number;
}

export async function ensureUserWorkspace(
  user: User,
  defaults: UserWorkspacePrefs
): Promise<UserWorkspacePrefs> {
  if (!isSafeId(user.uid)) {
    throw new Error('Invalid user UID format.');
  }
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  let existingSnap;
  try {
    existingSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (existingSnap.exists()) {
    const data = existingSnap.data();
    return {
      language: data.language === 'mm' ? 'mm' : 'en',
      isDarkMode: Boolean(data.isDarkMode),
      visualizerVariant:
        data.visualizerVariant === 'bars' || data.visualizerVariant === 'mirror'
          ? data.visualizerVariant
          : 'wave',
      apiKey: typeof data.apiKey === 'string' ? data.apiKey : null,
    };
  }

  const displayName = clampNonEmptyString(
    user.displayName || 'Voice Studio User',
    MAX_DISPLAY_NAME_LENGTH,
    'Voice Studio User'
  );
  const language: Language = defaults.language === 'mm' ? 'mm' : 'en';
  const visualizerVariant: VisualizerVariant =
    defaults.visualizerVariant === 'bars' || defaults.visualizerVariant === 'mirror'
      ? defaults.visualizerVariant
      : 'wave';

  try {
    await setDoc(userRef, {
      userId: user.uid,
      displayName,
      language,
      isDarkMode: Boolean(defaults.isDarkMode),
      visualizerVariant,
      apiKey: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userPath);
  }

  return { language, isDarkMode: Boolean(defaults.isDarkMode), visualizerVariant, apiKey: null };
}

export async function updateWorkspacePreferences(
  userId: string,
  patch: Partial<UserWorkspacePrefs>
): Promise<void> {
  if (!isSafeId(userId)) return;
  const userPath = `users/${userId}`;
  const userRef = doc(db, 'users', userId);

  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (patch.language === 'en' || patch.language === 'mm') {
    payload.language = patch.language;
  }
  if (typeof patch.isDarkMode === 'boolean') {
    payload.isDarkMode = patch.isDarkMode;
  }
  if (
    patch.visualizerVariant === 'wave' ||
    patch.visualizerVariant === 'bars' ||
    patch.visualizerVariant === 'mirror'
  ) {
    payload.visualizerVariant = patch.visualizerVariant;
  }

  try {
    await updateDoc(userRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function addFavoriteInFirestore(userId: string, voiceName: string): Promise<void> {
  if (!isSafeId(userId) || !isSafeId(voiceName, MAX_VOICE_NAME_LENGTH)) return;
  const path = `users/${userId}/favorites/${voiceName}`;
  try {
    await setDoc(doc(db, 'users', userId, 'favorites', voiceName), {
      userId,
      voiceName,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeFavoriteInFirestore(userId: string, voiceName: string): Promise<void> {
  if (!isSafeId(userId) || !isSafeId(voiceName, MAX_VOICE_NAME_LENGTH)) return;
  const path = `users/${userId}/favorites/${voiceName}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'favorites', voiceName));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearFavoritesInFirestore(
  userId: string,
  voiceNames: string[]
): Promise<void> {
  if (!isSafeId(userId) || voiceNames.length === 0) return;
  const path = `users/${userId}/favorites`;
  try {
    const batch = writeBatch(db);
    for (const voiceName of voiceNames) {
      if (isSafeId(voiceName, MAX_VOICE_NAME_LENGTH)) {
        batch.delete(doc(db, 'users', userId, 'favorites', voiceName));
      }
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedFavoritesInFirestore(
  userId: string,
  missingVoiceNames: string[]
): Promise<void> {
  if (!isSafeId(userId) || missingVoiceNames.length === 0) return;
  const path = `users/${userId}/favorites`;
  try {
    const batch = writeBatch(db);
    for (const voiceName of missingVoiceNames) {
      if (isSafeId(voiceName, MAX_VOICE_NAME_LENGTH)) {
        batch.set(doc(db, 'users', userId, 'favorites', voiceName), {
          userId,
          voiceName,
          createdAt: serverTimestamp(),
        });
      }
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveCustomCharacterNameInFirestore(
  userId: string,
  voiceName: string,
  entry: BurmeseCharacterName
): Promise<void> {
  if (!isSafeId(userId) || !isSafeId(voiceName, MAX_VOICE_NAME_LENGTH)) return;
  const path = `users/${userId}/customNames/${voiceName}`;
  const ref = doc(db, 'users', userId, 'customNames', voiceName);
  const mm = clampNonEmptyString(entry.mm, MAX_BURMESE_NAME_LENGTH, voiceName);
  const en = clampNonEmptyString(entry.en || entry.mm, MAX_BURMESE_NAME_LENGTH, mm);

  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await updateDoc(ref, {
        mm,
        en,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        userId,
        voiceName,
        mm,
        en,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCustomCharacterNameInFirestore(
  userId: string,
  voiceName: string
): Promise<void> {
  if (!isSafeId(userId) || !isSafeId(voiceName, MAX_VOICE_NAME_LENGTH)) return;
  const path = `users/${userId}/customNames/${voiceName}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'customNames', voiceName));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function clearCustomNamesInFirestore(
  userId: string,
  voiceNames: string[]
): Promise<void> {
  if (!isSafeId(userId) || voiceNames.length === 0) return;
  const path = `users/${userId}/customNames`;
  try {
    const batch = writeBatch(db);
    for (const voiceName of voiceNames) {
      if (isSafeId(voiceName, MAX_VOICE_NAME_LENGTH)) {
        batch.delete(doc(db, 'users', userId, 'customNames', voiceName));
      }
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCharacterTranscriptInFirestore(
  userId: string,
  voiceName: string,
  transcriptText: string
): Promise<void> {
  if (!isSafeId(userId) || !isSafeId(voiceName, MAX_VOICE_NAME_LENGTH)) return;
  const trimmed = transcriptText.trim().slice(0, MAX_CHARACTER_TRANSCRIPT_LENGTH);
  if (!trimmed) {
    await deleteCharacterTranscriptInFirestore(userId, voiceName);
    return;
  }
  const path = `users/${userId}/characterTranscripts/${voiceName}`;
  const ref = doc(db, 'users', userId, 'characterTranscripts', voiceName);

  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await updateDoc(ref, {
        transcript: trimmed,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        userId,
        voiceName,
        transcript: trimmed,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCharacterTranscriptInFirestore(
  userId: string,
  voiceName: string
): Promise<void> {
  if (!isSafeId(userId) || !isSafeId(voiceName, MAX_VOICE_NAME_LENGTH)) return;
  const path = `users/${userId}/characterTranscripts/${voiceName}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'characterTranscripts', voiceName));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCastingHistoryInFirestore(
  userId: string,
  prompt: string,
  rec: AiRecommendation
): Promise<string | null> {
  if (!isSafeId(userId)) return null;
  const castingId = `cast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `users/${userId}/castingHistory/${castingId}`;

  const sanitizedVoiceNames = (rec.voiceNames || [])
    .map((v) => v.trim().slice(0, MAX_VOICE_NAME_LENGTH))
    .filter((v) => isSafeId(v, MAX_VOICE_NAME_LENGTH))
    .slice(0, MAX_CASTING_VOICE_NAMES);

  if (sanitizedVoiceNames.length === 0) return null;

  try {
    await setDoc(doc(db, 'users', userId, 'castingHistory', castingId), {
      userId,
      prompt: clampNonEmptyString(prompt, MAX_PROMPT_LENGTH, 'Voice Casting Request'),
      voiceNames: sanitizedVoiceNames,
      systemInstruction: clampNonEmptyString(
        rec.systemInstruction || '',
        MAX_SYSTEM_INSTRUCTION_LENGTH,
        'Voice persona instruction'
      ),
      sampleText: clampNonEmptyString(
        rec.sampleText || '',
        MAX_SAMPLE_TEXT_LENGTH,
        'Voice preview sample'
      ),
      createdAt: serverTimestamp(),
    });
    return castingId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCastingHistoryInFirestore(
  userId: string,
  castingId: string
): Promise<void> {
  if (!isSafeId(userId) || !isSafeId(castingId)) return;
  const path = `users/${userId}/castingHistory/${castingId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'castingHistory', castingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeUserData(
  userId: string,
  handlers: {
    onFavorites: (voiceNames: string[]) => void;
    onCustomNames: (nameMap: Record<string, BurmeseCharacterName>) => void;
    onCharacterTranscripts: (transcriptMap: Record<string, string>) => void;
    onCastingHistory: (items: CastingHistoryRecord[]) => void;
    onPreferences: (prefs: UserWorkspacePrefs) => void;
    onError: (err: Error) => void;
  }
): Unsubscribe {
  const userPath = `users/${userId}`;
  const favPath = `users/${userId}/favorites`;
  const namesPath = `users/${userId}/customNames`;
  const transcriptsPath = `users/${userId}/characterTranscripts`;
  const castingPath = `users/${userId}/castingHistory`;

  const unsubUser = onSnapshot(
    doc(db, 'users', userId),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      handlers.onPreferences({
        language: data.language === 'mm' ? 'mm' : 'en',
        isDarkMode: Boolean(data.isDarkMode),
        visualizerVariant:
          data.visualizerVariant === 'bars' || data.visualizerVariant === 'mirror'
            ? data.visualizerVariant
            : 'wave',
        apiKey: typeof data.apiKey === 'string' ? data.apiKey : null,
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, userPath);
      } catch (wrapped) {
        handlers.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const favQuery = query(
    collection(db, 'users', userId, 'favorites'),
    where('userId', '==', userId),
    limit(50)
  );
  const unsubFavs = onSnapshot(
    favQuery,
    (snapshot) => {
      const items: { name: string; ts: number }[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (typeof data.voiceName === 'string') {
          const ts =
            data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
          items.push({ name: data.voiceName, ts });
        }
      });
      items.sort((a, b) => b.ts - a.ts);
      handlers.onFavorites(items.map((i) => i.name));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, favPath);
      } catch (wrapped) {
        handlers.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const namesQuery = query(
    collection(db, 'users', userId, 'customNames'),
    where('userId', '==', userId),
    limit(50)
  );
  const unsubNames = onSnapshot(
    namesQuery,
    (snapshot) => {
      const nextMap: Record<string, BurmeseCharacterName> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          typeof data.voiceName === 'string' &&
          typeof data.mm === 'string' &&
          typeof data.en === 'string'
        ) {
          nextMap[data.voiceName] = { mm: data.mm, en: data.en };
        }
      });
      handlers.onCustomNames(nextMap);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, namesPath);
      } catch (wrapped) {
        handlers.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const castingQuery = query(
    collection(db, 'users', userId, 'castingHistory'),
    where('userId', '==', userId),
    limit(20)
  );
  const unsubCasting = onSnapshot(
    castingQuery,
    (snapshot) => {
      const records: CastingHistoryRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          typeof data.prompt === 'string' &&
          Array.isArray(data.voiceNames) &&
          typeof data.systemInstruction === 'string' &&
          typeof data.sampleText === 'string'
        ) {
          const createdAtMs =
            data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : 0;
          records.push({
            id: docSnap.id,
            prompt: data.prompt,
            voiceNames: data.voiceNames.filter((v): v is string => typeof v === 'string'),
            systemInstruction: data.systemInstruction,
            sampleText: data.sampleText,
            createdAtMs,
          });
        }
      });
      records.sort((a, b) => b.createdAtMs - a.createdAtMs);
      handlers.onCastingHistory(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, castingPath);
      } catch (wrapped) {
        handlers.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const transcriptsQuery = query(
    collection(db, 'users', userId, 'characterTranscripts'),
    where('userId', '==', userId),
    limit(50)
  );
  const unsubTranscripts = onSnapshot(
    transcriptsQuery,
    (snapshot) => {
      const nextTranscripts: Record<string, string> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (typeof data.voiceName === 'string' && typeof data.transcript === 'string') {
          nextTranscripts[data.voiceName] = data.transcript;
        }
      });
      handlers.onCharacterTranscripts(nextTranscripts);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, transcriptsPath);
      } catch (wrapped) {
        handlers.onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  return () => {
    unsubUser();
    unsubFavs();
    unsubNames();
    unsubTranscripts();
    unsubCasting();
  };
}

export interface GeminiDailyQuota {
  date: string;
  globalLimit: number;
  globalUsed: number;
  globalRemaining: number;
  userLimit: number;
  userUsed: number;
  userRemaining: number;
  upstreamExhausted: boolean;
  exhausted: boolean;
}

export const GEMINI_QUOTA_UPDATED_EVENT = 'mmnext:gemini-quota-updated';

export function notifyGeminiQuotaUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GEMINI_QUOTA_UPDATED_EVENT));
  }
}

export async function getFirebaseAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (!currentUser) return {};
  try {
    const token = await currentUser.getIdToken(forceRefresh);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function saveUserApiKeyInFirestore(userId: string, apiKey: string): Promise<void> {
  if (!isSafeId(userId)) return;
  const userPath = `users/${userId}`;
  const userRef = doc(db, 'users', userId);
  const trimmed = apiKey.trim();
  if (trimmed.length > MAX_API_KEY_LENGTH) {
    throw new Error(`API key exceeds maximum allowed length (${MAX_API_KEY_LENGTH} characters).`);
  }
  try {
    const existingSnap = await getDoc(userRef);
    if (existingSnap.exists()) {
      await updateDoc(userRef, {
        apiKey: trimmed ? trimmed : null,
        updatedAt: serverTimestamp(),
      });
    } else {
      const currentUser = auth.currentUser;
      const displayName = clampNonEmptyString(
        currentUser?.displayName || 'Voice Studio User',
        MAX_DISPLAY_NAME_LENGTH,
        'Voice Studio User'
      );
      await setDoc(userRef, {
        userId,
        displayName,
        language: 'en',
        isDarkMode: false,
        visualizerVariant: 'wave',
        apiKey: trimmed ? trimmed : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('mmnext_user_gemini_api_key', trimmed);
      } else {
        localStorage.removeItem('mmnext_user_gemini_api_key');
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function getGeminiApiKeyHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  const authHeaders: Record<string, string> = {};
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken(forceRefresh);
      if (token) authHeaders.Authorization = `Bearer ${token}`;
    } catch {}
  }
  try {
    const localKey = typeof window !== 'undefined' ? localStorage.getItem('mmnext_user_gemini_api_key') : '';
    const trimmedKey = localKey ? localKey.trim() : '';
    if (trimmedKey && (trimmedKey.startsWith('AIza') || trimmedKey.startsWith('AQ.'))) {
      authHeaders['X-Gemini-Api-Key'] = trimmedKey;
    }
  } catch {}
  return authHeaders;
}


