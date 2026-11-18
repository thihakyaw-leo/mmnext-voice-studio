/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { VOICE_DATA } from './constants';
import Carousel3D from './components/Carousel3D';
import GridView from './components/GridView';
import FilterBar from './components/FilterBar';
import VoiceFinder from './components/VoiceFinder';
import AiResultCard from './components/AiResultCard';
import FavoritesDrawer from './components/FavoritesDrawer';
import MobileSidebar from './components/MobileSidebar';
import CompareView, { CompareSequencePhase } from './components/CompareView';
import AudioVisualizerBar from './components/AudioVisualizerBar';
import PitchDistributionModal from './components/PitchDistributionModal';
import LoginModal from './components/LoginModal';
import ShareVoiceModal from './components/ShareVoiceModal';
import { PITCH_HZ_MIN_BOUND, PITCH_HZ_MAX_BOUND } from './components/PitchRangeFilter';
import { VisualizerVariant } from './components/AudioVisualizer';
import { getVoicePitchHz } from './utils/pitchDetection';
import { FilterState, AiRecommendation, Voice } from './types';
import { Info, Heart, Loader2, AlertCircle, X } from 'lucide-react';
import { useI18n } from './i18n';
import {
  BurmeseCharacterName,
  CHARACTER_NAMES_STORAGE_KEY,
  generateBurmeseNameMap,
  loadBurmeseNameMap,
} from './burmeseNames';
import { ApiKeyModal } from './components/ApiKeyModal';
import { useFirebase } from './components/FirebaseProvider';
import {
  addFavoriteInFirestore,
  removeFavoriteInFirestore,
  clearFavoritesInFirestore,
  seedFavoritesInFirestore,
  syncCustomNamesInFirestore,
  clearCustomNamesInFirestore,
  saveCastingHistoryInFirestore,
  updateWorkspacePreferences,
  getGeminiApiKeyHeaders,
  notifyGeminiQuotaUpdated,
} from './firebase';

const FAVORITES_STORAGE_KEY = 'gemini-voice-library:favorites';
const VISUALIZER_VARIANT_STORAGE_KEY = 'gemini-voice-library:visualizer-variant';
const VALID_VOICE_NAMES = new Set(VOICE_DATA.map((v) => v.name));

function loadFavoritesFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const valid: string[] = [];
    for (const item of parsed) {
      if (typeof item === 'string' && VALID_VOICE_NAMES.has(item) && !seen.has(item)) {
        seen.add(item);
        valid.push(item);
      }
    }
    return valid;
  } catch {
    return [];
  }
}

const App: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const {
    user,
    authReady,
    cloudFavorites,
    cloudCustomNames,
    cloudPreferences,
  } = useFirebase();
  const [asyncFatalError, setAsyncFatalError] = useState<Error | null>(null);
  if (asyncFatalError) {
    throw asyncFatalError;
  }

  const reportFirestoreError = useCallback((err: unknown) => {
    setAsyncFatalError(err instanceof Error ? err : new Error(String(err)));
  }, []);

  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiRecommendation | null>(null);
  const [isAiCardVisible, setIsAiCardVisible] = useState(false);
  const [showVoiceFinder, setShowVoiceFinder] = useState(false);
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showPitchChart, setShowPitchChart] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [shareTargets, setShareTargets] = useState<Voice[] | null>(null);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid' | 'compare'>('carousel');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [visualizerVariant, setVisualizerVariant] = useState<VisualizerVariant>(() => {
    try {
      const saved = localStorage.getItem(VISUALIZER_VARIANT_STORAGE_KEY);
      if (saved === 'wave' || saved === 'bars' || saved === 'mirror') return saved;
    } catch {
      // Ignore storage errors
    }
    return 'wave';
  });
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isPitchPanelOpen, setIsPitchPanelOpen] = useState(true);
  const [lastPlayedVoiceName, setLastPlayedVoiceName] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{ currentTime: number; duration: number }>({
    currentTime: 0,
    duration: 0,
  });
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // Side-by-side comparison state
  const [compareVoices, setCompareVoices] = useState<string[]>([]);
  const [comparePair, setComparePair] = useState<[string, string]>(() => [
    VOICE_DATA[0]?.name || '',
    VOICE_DATA[1]?.name || VOICE_DATA[0]?.name || '',
  ]);
  const [sequencePhase, setSequencePhase] = useState<CompareSequencePhase>('idle');
  const [activeCompareSingleSlot, setActiveCompareSingleSlot] = useState<'a' | 'b' | null>(null);

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState<string[]>(loadFavoritesFromStorage);

  // Persona-matched Burmese character names persisted in localStorage
  const [burmeseNameMap, setBurmeseNameMap] = useState<Record<string, BurmeseCharacterName>>(
    () => loadBurmeseNameMap(VOICE_DATA)
  );

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const pendingFocusVoiceRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sampleBlobCacheRef = useRef<Map<string, Blob>>(new Map());
  const activeObjectUrlRef = useRef<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    gender: 'All',
    pitch: 'All',
    pitchHzRange: [PITCH_HZ_MIN_BOUND, PITCH_HZ_MAX_BOUND],
    search: '',
    favoritesOnly: false,
  });

  // Deep-link support for shared voice (?voice=Name) or shared comparison pair (?compare=A,B)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const compareParam = params.get('compare');
      if (compareParam) {
        const parts = compareParam
          .split(',')
          .map((s) => s.trim())
          .filter((name) => VALID_VOICE_NAMES.has(name));
        if (parts.length >= 2) {
          setComparePair([parts[0], parts[1]]);
          setCompareVoices([parts[0], parts[1]]);
          setViewMode('compare');
          return;
        }
      }

      const voiceParam = params.get('voice');
      if (voiceParam && VALID_VOICE_NAMES.has(voiceParam)) {
        const idx = VOICE_DATA.findIndex((v) => v.name === voiceParam);
        if (idx >= 0) {
          pendingFocusVoiceRef.current = voiceParam;
          setActiveIndex(idx);
          setViewMode('carousel');
        }
      }
    } catch {
      // Ignore malformed URL params
    }
  }, []);

  // Persist favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to persist favorites to localStorage', e);
    }
  }, [favorites]);

  // Persist Burmese character names to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHARACTER_NAMES_STORAGE_KEY, JSON.stringify(burmeseNameMap));
    } catch (e) {
      console.error('Failed to persist Burmese names to localStorage', e);
    }
  }, [burmeseNameMap]);

  // Persist AudioVisualizer variant preference
  useEffect(() => {
    try {
      localStorage.setItem(VISUALIZER_VARIANT_STORAGE_KEY, visualizerVariant);
    } catch {
      // Ignore storage errors
    }
  }, [visualizerVariant]);

  // Sync favorites and character names across browser tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === FAVORITES_STORAGE_KEY) {
        setFavorites(loadFavoritesFromStorage());
      } else if (e.key === CHARACTER_NAMES_STORAGE_KEY) {
        setBurmeseNameMap(loadBurmeseNameMap(VOICE_DATA));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Theme Management
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Firebase Cloud Sync Effects ---
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;
  const burmeseNameMapRef = useRef(burmeseNameMap);
  burmeseNameMapRef.current = burmeseNameMap;
  const seededFavUidRef = useRef<string | null>(null);
  const seedingFavInFlightRef = useRef(false);
  const hydratedNamesUidRef = useRef<string | null>(null);
  const hydratedPrefsUidRef = useRef<string | null>(null);
  const skipNextLanguagePushRef = useRef(false);
  const lastCloudLanguageRef = useRef<'en' | 'mm' | null>(null);

  useEffect(() => {
    if (!user) {
      seededFavUidRef.current = null;
      seedingFavInFlightRef.current = false;
      hydratedNamesUidRef.current = null;
      hydratedPrefsUidRef.current = null;
      lastCloudLanguageRef.current = null;
      setPlayingVoice(null);
      setSequencePhase('idle');
      setActiveCompareSingleSlot(null);
      setShareTargets(null);
      setShowVoiceFinder(false);
      setShowFavoritesDrawer(false);
      setShowMobileSidebar(false);
      setShowPitchChart(false);
    }
  }, [user]);

  // Sync favorites from Firestore & migrate any missing local favorites on sign-in
  useEffect(() => {
    if (!user || cloudFavorites === null) return;
    const validCloud = cloudFavorites.filter((name) => VALID_VOICE_NAMES.has(name));

    if (seededFavUidRef.current !== user.uid) {
      seededFavUidRef.current = user.uid;
      const missing = favoritesRef.current.filter(
        (name) => VALID_VOICE_NAMES.has(name) && !validCloud.includes(name)
      );
      if (missing.length > 0) {
        seedingFavInFlightRef.current = true;
        setFavorites(Array.from(new Set([...missing, ...validCloud])));
        void seedFavoritesInFirestore(user.uid, missing)
          .catch(reportFirestoreError)
          .finally(() => {
            seedingFavInFlightRef.current = false;
          });
        return;
      }
    }

    if (!seedingFavInFlightRef.current) {
      setFavorites(validCloud);
    }
  }, [user, cloudFavorites, reportFirestoreError]);

  // Sync custom Burmese character names from Firestore
  useEffect(() => {
    if (!user || cloudCustomNames === null) return;
    const cloudEntries = Object.entries(cloudCustomNames).filter(([voiceName]) =>
      VALID_VOICE_NAMES.has(voiceName)
    );

    if (cloudEntries.length > 0) {
      hydratedNamesUidRef.current = user.uid;
      const baseDefaults = generateBurmeseNameMap(VOICE_DATA, false);
      const merged: Record<string, BurmeseCharacterName> = { ...baseDefaults };
      for (const [voiceName, entry] of cloudEntries) {
        merged[voiceName] = entry;
      }
      setBurmeseNameMap(merged);
      return;
    }

    if (hydratedNamesUidRef.current !== user.uid) {
      hydratedNamesUidRef.current = user.uid;
      let hasLocalCustomNames = false;
      try {
        hasLocalCustomNames = Boolean(localStorage.getItem(CHARACTER_NAMES_STORAGE_KEY));
      } catch {
        hasLocalCustomNames = false;
      }
      if (hasLocalCustomNames) {
        void syncCustomNamesInFirestore(user.uid, burmeseNameMapRef.current).catch(
          reportFirestoreError
        );
      }
    }
  }, [user, cloudCustomNames, reportFirestoreError]);

  // Hydrate workspace preferences from Firestore
  useEffect(() => {
    if (!user || !cloudPreferences) return;
    hydratedPrefsUidRef.current = user.uid;
    setIsDarkMode(cloudPreferences.isDarkMode);
    setVisualizerVariant(cloudPreferences.visualizerVariant);

    if (
      cloudPreferences.language !== language &&
      lastCloudLanguageRef.current !== cloudPreferences.language
    ) {
      skipNextLanguagePushRef.current = true;
      setLanguage(cloudPreferences.language);
    }
    lastCloudLanguageRef.current = cloudPreferences.language;
  }, [user, cloudPreferences, language, setLanguage]);

  // Push language preference changes to Firestore while signed in
  useEffect(() => {
    if (!user || hydratedPrefsUidRef.current !== user.uid) return;
    if (skipNextLanguagePushRef.current) {
      skipNextLanguagePushRef.current = false;
      return;
    }
    if (cloudPreferences?.language === language) return;
    void updateWorkspacePreferences(user.uid, { language }).catch(reportFirestoreError);
  }, [user, language, cloudPreferences?.language, reportFirestoreError]);

  const ensureAudioAnalyser = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (!audioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const source = ctx.createMediaElementSource(audio);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.78;
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioCtxRef.current = ctx;
        mediaSourceRef.current = source;
        analyserRef.current = analyser;
        setAnalyserNode(analyser);
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch {
      // Fallback to native <audio> playback without Web Audio graph
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        mediaSourceRef.current?.disconnect();
        analyserRef.current?.disconnect();
        audioCtxRef.current?.close().catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  // Centralized Authenticated Audio Playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let cancelled = false;
    const controller = new AbortController();
    audio.pause();
    audio.currentTime = 0;
    setAudioProgress({ currentTime: 0, duration: 0 });

    if (activeObjectUrlRef.current) {
      URL.revokeObjectURL(activeObjectUrlRef.current);
      activeObjectUrlRef.current = null;
    }

    if (playingVoice) {
      const voice = VOICE_DATA.find((v) => v.name === playingVoice);
      if (voice) {
        setPlaybackError(null);
        ensureAudioAnalyser();
        setLastPlayedVoiceName(voice.name);
        setIsVisualizerOpen(true);

        (async () => {
          try {
            let wavBlob = sampleBlobCacheRef.current.get(voice.name);
            if (!wavBlob) {
              const authHeaders = await getGeminiApiKeyHeaders();
              const resp = await fetch(
                `/api/voice-sample/${encodeURIComponent(voice.name)}?lang=mm&v=1`,
                {
                  headers: authHeaders,
                  signal: controller.signal,
                }
              );
              notifyGeminiQuotaUpdated();
              if (!resp.ok) {
                const errBody = await resp.json().catch(() => ({}));
                throw new Error(
                  errBody.error ||
                    (resp.status === 429
                      ? t.dailyQuotaExhaustedBanner
                      : t.ttsFailedError)
                );
              }
              wavBlob = await resp.blob();
              sampleBlobCacheRef.current.set(voice.name, wavBlob);
            }

            if (cancelled || controller.signal.aborted) return;

            const objectUrl = URL.createObjectURL(wavBlob);
            activeObjectUrlRef.current = objectUrl;
            audio.src = objectUrl;
            await audio.play();
          } catch (e: any) {
            if (cancelled || controller.signal.aborted || e?.name === 'AbortError') return;
            console.error('Playback failed', e);
            setPlaybackError(typeof e?.message === 'string' && e.message.trim() ? e.message : t.ttsFailedError);
            setPlayingVoice(null);
            setSequencePhase('idle');
            setActiveCompareSingleSlot(null);
          }
        })();
      }
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [playingVoice, ensureAudioAnalyser, t.dailyQuotaExhaustedBanner, t.ttsFailedError]);

  // Brief pause between Voice A and Voice B during sequential comparison
  useEffect(() => {
    if (sequencePhase !== 'gap') return;
    const timer = window.setTimeout(() => {
      setSequencePhase('playing-b');
      setPlayingVoice(comparePair[1]);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [sequencePhase, comparePair]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (user) {
        void updateWorkspacePreferences(user.uid, { isDarkMode: next }).catch(reportFirestoreError);
      }
      return next;
    });
  }, [user, reportFirestoreError]);

  const handleVisualizerVariantChange = useCallback(
    (nextVariant: VisualizerVariant) => {
      setVisualizerVariant(nextVariant);
      if (user) {
        void updateWorkspacePreferences(user.uid, { visualizerVariant: nextVariant }).catch(
          reportFirestoreError
        );
      }
    },
    [user, reportFirestoreError]
  );

  const toggleFavorite = useCallback(
    (voiceName: string) => {
      const exists = favoritesRef.current.includes(voiceName);
      setFavorites((prev) =>
        prev.includes(voiceName)
          ? prev.filter((name) => name !== voiceName)
          : [voiceName, ...prev]
      );
      if (user) {
        const op = exists
          ? removeFavoriteInFirestore(user.uid, voiceName)
          : addFavoriteInFirestore(user.uid, voiceName);
        void op.catch(reportFirestoreError);
      }
    },
    [user, reportFirestoreError]
  );

  const removeFavorite = useCallback(
    (voiceName: string) => {
      setFavorites((prev) => prev.filter((name) => name !== voiceName));
      if (user) {
        void removeFavoriteInFirestore(user.uid, voiceName).catch(reportFirestoreError);
      }
    },
    [user, reportFirestoreError]
  );

  const clearFavorites = useCallback(() => {
    const toDelete = [...favoritesRef.current];
    setFavorites([]);
    setFilters((prev) => (prev.favoritesOnly ? { ...prev, favoritesOnly: false } : prev));
    if (user && toDelete.length > 0) {
      void clearFavoritesInFirestore(user.uid, toDelete).catch(reportFirestoreError);
    }
  }, [user, reportFirestoreError]);

  const handleRandomizeNames = useCallback(() => {
    const nextMap = generateBurmeseNameMap(VOICE_DATA, true, burmeseNameMapRef.current);
    setBurmeseNameMap(nextMap);
    if (user) {
      void syncCustomNamesInFirestore(user.uid, nextMap).catch(reportFirestoreError);
    }
  }, [user, reportFirestoreError]);

  const handleResetBurmeseNames = useCallback(() => {
    try {
      localStorage.removeItem(CHARACTER_NAMES_STORAGE_KEY);
    } catch {}
    setBurmeseNameMap(loadBurmeseNameMap(VOICE_DATA));
    if (user && cloudCustomNames) {
      const keys = Object.keys(cloudCustomNames);
      if (keys.length > 0) {
        void clearCustomNamesInFirestore(user.uid, keys).catch(reportFirestoreError);
      }
    }
  }, [user, cloudCustomNames, reportFirestoreError]);

  const voicesWithNames = useMemo<Voice[]>(() => {
    return VOICE_DATA.map((voice) => ({
      ...voice,
      characterName: burmeseNameMap[voice.name],
    }));
  }, [burmeseNameMap]);

  const favoriteVoices = useMemo(() => {
    return favorites
      .map((name) => voicesWithNames.find((v) => v.name === name))
      .filter((v): v is Voice => !!v);
  }, [favorites, voicesWithNames]);

  const uniqueGenders = useMemo(
    () => Array.from(new Set(VOICE_DATA.map((v) => v.analysis.gender))).sort(),
    []
  );
  const uniquePitches = useMemo(
    () => Array.from(new Set(VOICE_DATA.map((v) => v.analysis.pitch))).sort(),
    []
  );

  const filteredVoices = useMemo(() => {
    const baseData = voicesWithNames;
    if (aiResult) {
      const recommended = aiResult.voiceNames
        .map((name) => baseData.find((v) => v.name === name))
        .filter((v): v is Voice => !!v);
      return recommended.length > 0 ? recommended : baseData;
    }

    return baseData.filter((voice) => {
      const matchFavorite = !filters.favoritesOnly || favorites.includes(voice.name);
      const matchGender = filters.gender === 'All' || voice.analysis.gender === filters.gender;
      const matchPitch = filters.pitch === 'All' || voice.analysis.pitch === filters.pitch;
      const voiceHz = getVoicePitchHz(voice);
      const matchPitchHz = voiceHz >= filters.pitchHzRange[0] && voiceHz <= filters.pitchHzRange[1];

      const searchLower = filters.search.toLowerCase();
      const matchSearch =
        filters.search === '' ||
        voice.name.toLowerCase().includes(searchLower) ||
        (voice.characterName?.mm.toLowerCase().includes(searchLower) ?? false) ||
        (voice.characterName?.en.toLowerCase().includes(searchLower) ?? false) ||
        voice.characteristics.some((c) => c.toLowerCase().includes(searchLower)) ||
        voice.analysis.characteristics.some((c) => c.toLowerCase().includes(searchLower)) ||
        voice.analysis.gender.toLowerCase().startsWith(searchLower) ||
        voice.pitch.toLowerCase().includes(searchLower) ||
        voice.analysis.pitch.toLowerCase().includes(searchLower);

      return matchFavorite && matchGender && matchPitch && matchPitchHz && matchSearch;
    });
  }, [filters, aiResult, favorites, voicesWithNames]);

  // Reset activeIndex when filter criteria change (unless focusing a specific voice from Favorites)
  useEffect(() => {
    if (pendingFocusVoiceRef.current) return;
    setActiveIndex(0);
  }, [filters.gender, filters.pitch, filters.pitchHzRange, filters.search, filters.favoritesOnly, aiResult]);

  // Focus pending voice or clamp activeIndex when filteredVoices updates
  useEffect(() => {
    if (pendingFocusVoiceRef.current) {
      const targetIdx = filteredVoices.findIndex(
        (v) => v.name === pendingFocusVoiceRef.current
      );
      pendingFocusVoiceRef.current = null;
      if (targetIdx >= 0) {
        setActiveIndex(targetIdx);
      } else {
        setActiveIndex(0);
      }
      return;
    }

    setActiveIndex((prev) =>
      filteredVoices.length === 0 ? 0 : Math.min(prev, filteredVoices.length - 1)
    );
  }, [filteredVoices]);

  const handlePlayToggle = useCallback((voiceName: string) => {
    setSequencePhase('idle');
    setActiveCompareSingleSlot(null);
    setPlayingVoice((current) => (current === voiceName ? null : voiceName));
  }, []);

  const handleAudioEnded = useCallback(() => {
    if (sequencePhase === 'playing-a') {
      setPlayingVoice(null);
      setSequencePhase('gap');
    } else if (sequencePhase === 'playing-b') {
      setPlayingVoice(null);
      setSequencePhase('idle');
    } else {
      setPlayingVoice(null);
      setActiveCompareSingleSlot(null);
    }
  }, [sequencePhase]);

  const handleToggleCompare = useCallback(
    (voiceName: string) => {
      setCompareVoices((prev) => {
        let next: string[];
        if (prev.includes(voiceName)) {
          next = prev.filter((name) => name !== voiceName);
        } else if (prev.length < 2) {
          next = [...prev, voiceName];
        } else {
          next = [prev[0], voiceName];
        }

        if (next.length === 2) {
          setComparePair([next[0], next[1]]);
        } else if (next.length === 1) {
          setComparePair((prevPair) => {
            const other =
              prevPair[1] !== next[0]
                ? prevPair[1]
                : prevPair[0] !== next[0]
                ? prevPair[0]
                : VOICE_DATA.find((v) => v.name !== next[0])?.name || next[0];
            return [next[0], other];
          });
        }
        return next;
      });
    },
    []
  );

  const handleViewModeChange = useCallback(
    (mode: 'carousel' | 'grid' | 'compare') => {
      if (viewMode === 'compare' && mode !== 'compare' && sequencePhase !== 'idle') {
        setSequencePhase('idle');
        setPlayingVoice(null);
        setActiveCompareSingleSlot(null);
      }
      setViewMode(mode);
    },
    [viewMode, sequencePhase]
  );

  const handleChangeCompareVoiceA = useCallback(
    (voiceName: string) => {
      setSequencePhase('idle');
      setPlayingVoice(null);
      setActiveCompareSingleSlot(null);
      setComparePair(([, b]) => {
        setCompareVoices([voiceName, b]);
        return [voiceName, b];
      });
    },
    []
  );

  const handleChangeCompareVoiceB = useCallback(
    (voiceName: string) => {
      setSequencePhase('idle');
      setPlayingVoice(null);
      setActiveCompareSingleSlot(null);
      setComparePair(([a]) => {
        setCompareVoices([a, voiceName]);
        return [a, voiceName];
      });
    },
    []
  );

  const handleSwapCompareVoices = useCallback(() => {
    setSequencePhase('idle');
    setPlayingVoice(null);
    setActiveCompareSingleSlot(null);
    setComparePair(([a, b]) => {
      setCompareVoices([b, a]);
      return [b, a];
    });
  }, []);

  const handleRandomComparePair = useCallback(() => {
    if (VOICE_DATA.length < 2) return;
    setSequencePhase('idle');
    setPlayingVoice(null);
    setActiveCompareSingleSlot(null);
    const firstIdx = Math.floor(Math.random() * VOICE_DATA.length);
    let secondIdx = Math.floor(Math.random() * (VOICE_DATA.length - 1));
    if (secondIdx >= firstIdx) secondIdx += 1;
    const v1 = VOICE_DATA[firstIdx].name;
    const v2 = VOICE_DATA[secondIdx].name;
    setComparePair([v1, v2]);
    setCompareVoices([v1, v2]);
  }, []);

  const handlePlayCompareSequential = useCallback(() => {
    setActiveCompareSingleSlot(null);
    setSequencePhase('playing-a');
    setPlayingVoice(comparePair[0]);
  }, [comparePair]);

  const handleStopCompare = useCallback(() => {
    setSequencePhase('idle');
    setPlayingVoice(null);
    setActiveCompareSingleSlot(null);
  }, []);

  const handlePlayCompareSingle = useCallback(
    (voiceName: string, slot: 'a' | 'b') => {
      if (sequencePhase === 'idle' && playingVoice === voiceName && activeCompareSingleSlot === slot) {
        setPlayingVoice(null);
        setActiveCompareSingleSlot(null);
        return;
      }
      setSequencePhase('idle');
      setActiveCompareSingleSlot(slot);
      setPlayingVoice(voiceName);
    },
    [sequencePhase, playingVoice, activeCompareSingleSlot]
  );

  const clearAiResult = () => {
    setAiResult(null);
    setIsAiCardVisible(false);
    setFilters((prev) => ({ ...prev, search: '' }));
  };

  const handleSelectFavoriteVoice = (voiceName: string) => {
    setShowFavoritesDrawer(false);
    if (viewMode === 'compare') {
      setSequencePhase('idle');
      setPlayingVoice(null);
      setActiveCompareSingleSlot(null);
      setViewMode('carousel');
    }
    const idxInFiltered = filteredVoices.findIndex((v) => v.name === voiceName);
    if (idxInFiltered >= 0) {
      setActiveIndex(idxInFiltered);
    } else {
      pendingFocusVoiceRef.current = voiceName;
      setAiResult(null);
      setIsAiCardVisible(false);
      setFilters({
        gender: 'All',
        pitch: 'All',
        pitchHzRange: [PITCH_HZ_MIN_BOUND, PITCH_HZ_MAX_BOUND],
        search: '',
        favoritesOnly: false,
      });
    }
  };

  const handleOpenAiCasting = () => {
    setSequencePhase('idle');
    setActiveCompareSingleSlot(null);
    setPlayingVoice(null);
    setShowVoiceFinder(true);
  };

  const activeVisualizerVoice = useMemo(() => {
    const targetName =
      playingVoice ||
      lastPlayedVoiceName ||
      filteredVoices[activeIndex]?.name ||
      voicesWithNames[0]?.name ||
      null;
    if (!targetName) return null;
    return voicesWithNames.find((v) => v.name === targetName) || null;
  }, [playingVoice, lastPlayedVoiceName, filteredVoices, activeIndex, voicesWithNames]);

  const isModalOpen =
    showVoiceFinder ||
    showFavoritesDrawer ||
    showMobileSidebar ||
    showLoginModal ||
    Boolean(shareTargets) ||
    Boolean(aiResult && isAiCardVisible);

  const isAnyModalOpen = isModalOpen || showPitchChart;

  // Global keyboard shortcuts for Carousel & Grid views (Arrow keys, Home/End, Space)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!authReady || !user || isAnyModalOpen || viewMode === 'compare' || filteredVoices.length === 0) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        if (tag === 'BUTTON' && !target?.closest('[data-voice-card="true"]')) {
          return;
        }
        e.preventDefault();
        const activeVoice = filteredVoices[activeIndex];
        if (activeVoice) {
          handlePlayToggle(activeVoice.name);
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(filteredVoices.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (viewMode === 'carousel') {
          setActiveIndex((prev) => Math.max(0, prev - 1));
        } else {
          const gridEl = document.querySelector('[data-voice-grid="true"]');
          const cols = gridEl
            ? window.getComputedStyle(gridEl).gridTemplateColumns.split(' ').filter(Boolean).length || 1
            : 1;
          setActiveIndex((prev) => (prev - cols >= 0 ? prev - cols : prev));
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (viewMode === 'carousel') {
          setActiveIndex((prev) => Math.min(filteredVoices.length - 1, prev + 1));
        } else {
          const gridEl = document.querySelector('[data-voice-grid="true"]');
          const cols = gridEl
            ? window.getComputedStyle(gridEl).gridTemplateColumns.split(' ').filter(Boolean).length || 1
            : 1;
          setActiveIndex((prev) => (prev + cols < filteredVoices.length ? prev + cols : prev));
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActiveIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setActiveIndex(filteredVoices.length - 1);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isAnyModalOpen, viewMode, filteredVoices, activeIndex, handlePlayToggle]);

  return (
    <div className="h-screen w-screen bg-[#FDF7EB] dark:bg-[#09090b] text-zinc-800 dark:text-zinc-100 font-sans overflow-hidden flex flex-col relative transition-colors duration-300">
      {/* Single Shared Audio Element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={handleStopCompare}
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setAudioProgress({
            currentTime: el.currentTime || 0,
            duration: Number.isFinite(el.duration) ? el.duration : 0,
          });
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setAudioProgress({
            currentTime: el.currentTime || 0,
            duration: Number.isFinite(el.duration) ? el.duration : 0,
          });
        }}
        preload="none"
      />

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-zinc-200/50 dark:bg-blue-900/20 blur-3xl opacity-70"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-stone-200/60 dark:bg-purple-900/20 blur-3xl opacity-60"></div>
      </div>

      {!authReady ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 relative z-10 px-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-zinc-900/10 ring-1 ring-zinc-300/70 dark:ring-zinc-700">
            <img
              src="/assets/aistudio/1Artboard_1_2x_180530e3.png"
              alt={t.appTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <Loader2 size={22} className="animate-spin text-zinc-600 dark:text-indigo-400" />
        </div>
      ) : !user ? (
        <LoginModal
          isOpen={true}
          required={true}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onClose={() => {}}
        />
      ) : (
        <>
          {/* Main App Content - aria-hidden and inert when modal is open */}
          <div
            className="flex flex-col flex-1 overflow-hidden"
            aria-hidden={isModalOpen}
            inert={isModalOpen}
            style={isModalOpen ? { pointerEvents: 'none' } : {}}
          >
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          uniqueGenders={uniqueGenders}
          uniquePitches={uniquePitches}
          onOpenAiCasting={handleOpenAiCasting}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          favoritesCount={favorites.length}
          compareCount={compareVoices.length}
          onOpenFavorites={() => setShowFavoritesDrawer(true)}
          onRandomizeNames={handleRandomizeNames}
          onOpenMobileSidebar={() => setShowMobileSidebar(true)}
          isVisualizerOpen={isVisualizerOpen}
          onToggleVisualizer={() => setIsVisualizerOpen((prev) => !prev)}
          onOpenPitchChart={() => setShowPitchChart(true)}
          onOpenLogin={() => setShowLoginModal(true)}
          onOpenApiKeySettings={() => setShowApiKeyModal(true)}
        />

        <main className="flex-1 relative flex flex-col overflow-hidden">
          {playbackError && (
            <div
              role="alert"
              className="mx-auto mt-16 lg:mt-3 z-40 max-w-xl w-[calc(100%-2rem)] px-4 py-2.5 rounded-xl bg-rose-50/95 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs flex items-center justify-between gap-2 shadow-md backdrop-blur-md"
            >
              <span className="flex items-center gap-2 min-w-0">
                <AlertCircle size={15} className="shrink-0" />
                <span className="leading-snug">{playbackError}</span>
              </span>
              <button
                type="button"
                onClick={() => setPlaybackError(null)}
                className="p-1 rounded hover:bg-rose-200/60 dark:hover:bg-rose-900/60 shrink-0"
                aria-label={t.close}
              >
                <X size={13} />
              </button>
            </div>
          )}
          {viewMode === 'compare' ? (
            <div className="flex-1 overflow-hidden">
              <CompareView
                allVoices={voicesWithNames}
                voiceAName={comparePair[0]}
                voiceBName={comparePair[1]}
                onChangeVoiceA={handleChangeCompareVoiceA}
                onChangeVoiceB={handleChangeCompareVoiceB}
                onSwapVoices={handleSwapCompareVoices}
                onRandomPair={handleRandomComparePair}
                playingVoice={playingVoice}
                sequencePhase={sequencePhase}
                activeSingleSlot={activeCompareSingleSlot}
                onPlaySequential={handlePlayCompareSequential}
                onStopComparison={handleStopCompare}
                onPlaySingle={handlePlayCompareSingle}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onSharePair={(a, b) => setShareTargets([a, b])}
                visualizerVariant={visualizerVariant}
                analyserNode={analyserNode}
              />
            </div>
          ) : filteredVoices.length > 0 ? (
            viewMode === 'carousel' ? (
              <div className="w-full flex-1 flex items-center justify-center pt-14 lg:pt-0 pb-12 lg:pb-8 min-h-0">
                <Carousel3D
                  voices={filteredVoices}
                  activeIndex={activeIndex}
                  onChange={setActiveIndex}
                  playingVoice={playingVoice}
                  onPlayToggle={handlePlayToggle}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  compareVoices={compareVoices}
                  onToggleCompare={handleToggleCompare}
                  onShare={(voice) => setShareTargets([voice])}
                  visualizerVariant={visualizerVariant}
                  analyserNode={analyserNode}
                  disabled={isModalOpen}
                />
              </div>
            ) : (
              <div className="flex-1 overflow-hidden">
                <GridView
                  voices={filteredVoices}
                  activeIndex={activeIndex}
                  onSelectIndex={setActiveIndex}
                  playingVoice={playingVoice}
                  onPlayToggle={handlePlayToggle}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  compareVoices={compareVoices}
                  onToggleCompare={handleToggleCompare}
                  onShare={(voice) => setShareTargets([voice])}
                  visualizerVariant={visualizerVariant}
                  analyserNode={analyserNode}
                />
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center pb-24 px-4">
              <div className="text-center animate-fade-in max-w-md">
                {filters.favoritesOnly && favorites.length === 0 ? (
                  <>
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/60 mb-6 shadow-sm">
                      <Heart size={30} className="text-rose-400" />
                    </div>
                    <h3 className="text-xl font-serif text-zinc-900 dark:text-white mb-2">
                      {t.noFavoritesTitle}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm leading-relaxed">
                      {t.noFavoritesHint}
                    </p>
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, favoritesOnly: false }))}
                      className="px-5 py-2.5 bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white rounded-full text-sm font-medium hover:bg-zinc-700 dark:hover:bg-indigo-500 transition-colors"
                    >
                      {t.browseAllVoices}
                    </button>
                  </>
                ) : filters.favoritesOnly ? (
                  <>
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F1E5] dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 mb-6 shadow-sm">
                      <Heart size={30} className="text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <h3 className="text-xl font-serif text-zinc-800 dark:text-white mb-2">
                      {t.noMatchingFavorites}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm leading-relaxed">
                      {t.noMatchingFavoritesHint}
                    </p>
                    <button
                      onClick={() =>
                        setFilters({
                          gender: 'All',
                          pitch: 'All',
                          pitchHzRange: [PITCH_HZ_MIN_BOUND, PITCH_HZ_MAX_BOUND],
                          search: '',
                          favoritesOnly: true,
                        })
                      }
                      className="px-5 py-2.5 bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white rounded-full text-sm font-medium hover:bg-zinc-700 dark:hover:bg-indigo-500 transition-colors"
                    >
                      {t.resetFilters}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#F7F1E5] dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 mb-6 shadow-sm">
                      <Info size={32} className="text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <h3 className="text-xl font-serif text-zinc-800 dark:text-white mb-2">
                      {t.noVoicesFound}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm leading-relaxed">
                      {t.noVoicesHint}
                    </p>
                    <button
                      onClick={handleOpenAiCasting}
                      className="px-5 py-2.5 bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white rounded-full text-sm font-medium hover:bg-zinc-700 dark:hover:bg-indigo-500 transition-colors"
                    >
                      {t.openAiCasting}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {!aiResult && filteredVoices.length > 0 && viewMode !== 'compare' && (
            <div
              className={`absolute left-0 right-0 text-center pointer-events-none transition-all duration-300 ${
                isVisualizerOpen ? 'bottom-16 sm:bottom-20' : 'bottom-6'
              }`}
            >
              <div className="text-xs text-zinc-500 dark:text-zinc-500 font-medium tracking-wider bg-[#FDF7EB]/85 dark:bg-zinc-900/75 backdrop-blur-sm inline-flex items-center gap-3 px-3.5 py-1 rounded-full border border-zinc-300/60 dark:border-zinc-800 shadow-sm">
                <span className="tracking-widest uppercase">
                  {activeIndex + 1} / {filteredVoices.length}
                </span>
                <span className="hidden lg:inline text-zinc-300 dark:text-zinc-700">|</span>
                <span className="hidden lg:inline-flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>
                    {viewMode === 'carousel' ? '← →' : '↑ ↓ ← →'}{' '}
                    {viewMode === 'carousel' ? t.shortcutNavArrows : t.shortcutNavGrid}
                  </span>
                  {viewMode === 'carousel' && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <span>{t.shortcutWheel}</span>
                    </>
                  )}
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span>Space {t.shortcutPlayPause}</span>
                </span>
              </div>
            </div>
          )}
        </main>

        <AudioVisualizerBar
          isOpen={isVisualizerOpen}
          voice={activeVisualizerVoice}
          isPlaying={Boolean(playingVoice)}
          currentTime={audioProgress.currentTime}
          duration={audioProgress.duration}
          variant={visualizerVariant}
          analyserNode={analyserNode}
          isPitchPanelOpen={isPitchPanelOpen}
          onTogglePitchPanel={() => setIsPitchPanelOpen((prev) => !prev)}
          onChangeVariant={handleVisualizerVariantChange}
          onPlayToggle={handlePlayToggle}
          onClose={() => setIsVisualizerOpen(false)}
        />
      </div>

      {/* Mobile Sidebar Drawer (< lg) */}
      <MobileSidebar
        isOpen={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
        filters={filters}
        onFilterChange={setFilters}
        uniqueGenders={uniqueGenders}
        uniquePitches={uniquePitches}
        onOpenAiCasting={handleOpenAiCasting}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        favoritesCount={favorites.length}
        compareCount={compareVoices.length}
        onOpenFavorites={() => setShowFavoritesDrawer(true)}
        onRandomizeNames={handleRandomizeNames}
        isVisualizerOpen={isVisualizerOpen}
        onToggleVisualizer={() => setIsVisualizerOpen((prev) => !prev)}
        onOpenPitchChart={() => setShowPitchChart(true)}
      />

      {/* Favorites Slide-over Drawer */}
      <FavoritesDrawer
        isOpen={showFavoritesDrawer}
        onClose={() => setShowFavoritesDrawer(false)}
        favoriteVoices={favoriteVoices}
        playingVoice={playingVoice}
        onPlayToggle={handlePlayToggle}
        onRemoveFavorite={removeFavorite}
        onClearFavorites={clearFavorites}
        favoritesOnly={!!filters.favoritesOnly}
        onToggleFavoritesOnly={() =>
          setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))
        }
        onSelectVoice={handleSelectFavoriteVoice}
        visualizerVariant={visualizerVariant}
        analyserNode={analyserNode}
        onResetBurmeseNames={handleResetBurmeseNames}
        onOpenLogin={() => setShowLoginModal(true)}
        onShare={(voice) => {
          setShowFavoritesDrawer(false);
          setShareTargets([voice]);
        }}
      />

      <PitchDistributionModal
        isOpen={showPitchChart}
        onClose={() => setShowPitchChart(false)}
        voices={voicesWithNames}
        onSelectPitchFilter={(p) => setFilters((prev) => ({ ...prev, pitch: p }))}
        isDarkMode={isDarkMode}
      />

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      <ApiKeyModal isOpen={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} />

      <ShareVoiceModal
        isOpen={Boolean(shareTargets)}
        voices={shareTargets || []}
        onClose={() => setShareTargets(null)}
      />

      {/* Modals are rendered outside the aria-hidden container */}
      {showVoiceFinder && (
        <VoiceFinder
          voices={voicesWithNames}
          onRecommendation={(rec, promptText) => {
            if (rec) {
              setPlayingVoice(null);
              setAiResult(rec);
              setIsAiCardVisible(true);
              setFilters((prev) => ({ ...prev, search: '' }));
              if (user && promptText) {
                void saveCastingHistoryInFirestore(user.uid, promptText, rec).catch(
                  reportFirestoreError
                );
              }
            }
            setShowVoiceFinder(false);
          }}
          onClose={() => setShowVoiceFinder(false)}
        />
      )}

          {aiResult && isAiCardVisible && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ai-result-title"
            >
              <div className="absolute inset-0" onClick={clearAiResult}></div>
              <div className="relative w-full max-w-5xl animate-slide-up max-h-[90vh] overflow-hidden rounded-2xl">
                <AiResultCard
                  result={aiResult}
                  voices={filteredVoices}
                  onClose={clearAiResult}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  visualizerVariant={visualizerVariant}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;