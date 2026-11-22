/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  UserCheck,
  RotateCcw,
  Gauge,
  Sparkles,
  Check,
  Download,
  FileText,
  Play,
  Square,
  Loader2,
  AlertCircle,
  Volume2,
  Maximize2,
  Eye,
} from 'lucide-react';
import { Voice } from '../types';
import { BurmeseCharacterName } from '../burmeseNames';
import { useI18n } from '../i18n';
import { getCharacterAttireProfile } from '../characterProfiles';
import { getVoicePitchHzRange, getVoiceEmotionalTone } from '../utils/pitchDetection';
import {
  MAX_BURMESE_NAME_LENGTH,
  MAX_CHARACTER_TRANSCRIPT_LENGTH,
  getGeminiApiKeyHeaders,
  notifyGeminiQuotaUpdated,
} from '../firebase';
import { beginTrackedApiRequest, endTrackedApiRequest } from '../utils/networkStatus';

interface CharacterProfileModalProps {
  voice: Voice | null;
  onSave: (
    voiceName: string,
    name: BurmeseCharacterName | null,
    transcript: string | null
  ) => void;
  onStopMainPlayback?: () => void;
  onClose: () => void;
}

const CharacterProfileModal: React.FC<CharacterProfileModalProps> = ({
  voice,
  onSave,
  onStopMainPlayback,
  onClose,
}) => {
  const { t, language, translateGender, translatePitch, translateTone } = useI18n();
  const [mmName, setMmName] = useState('');
  const [enName, setEnName] = useState('');
  const [transcript, setTranscript] = useState('');
  const [exportedFormat, setExportedFormat] = useState<'json' | 'txt' | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [isDownloadingTts, setIsDownloadingTts] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const transcriptInputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ttsBlobCacheRef = useRef<Map<string, Blob>>(new Map());
  const isMountedRef = useRef(true);

  const stopModalAudio = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (isMountedRef.current) {
      setIsPlayingTts(false);
      setIsGeneratingTts(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopModalAudio();
    };
  }, [stopModalAudio]);

  useEffect(() => {
    stopModalAudio();
    setTtsError(null);
    if (!voice) return;

    setMmName(voice.characterName?.mm || '');
    setEnName(
      voice.characterName?.en && voice.characterName.en !== voice.characterName.mm
        ? voice.characterName.en
        : ''
    );
    setTranscript(voice.transcript || '');

    window.setTimeout(() => transcriptInputRef.current?.focus(), 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopModalAudio();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [voice, onClose, stopModalAudio]);

  if (!voice) return null;

  const attireProfile = voice.characterProfile || getCharacterAttireProfile(voice.name);
  const pitchRange = getVoicePitchHzRange(voice);
  const emotionalTone = translateTone(getVoiceEmotionalTone(voice));
  const trimmedTranscript = transcript.trim().slice(0, MAX_CHARACTER_TRANSCRIPT_LENGTH);

  const synthesizeTranscriptWav = async (
    targetVoiceName: string,
    textToSpeak: string,
    signal: AbortSignal
  ): Promise<Blob> => {
    const cacheKey = `${targetVoiceName}::${textToSpeak}`;
    const cached = ttsBlobCacheRef.current.get(cacheKey);
    if (cached) return cached;

    let response: Response | null = null;
    let forceRefresh = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      const attemptController = new AbortController();
      const onOuterAbort = () => attemptController.abort();
      signal.addEventListener('abort', onOuterAbort, { once: true });
      const timer = window.setTimeout(() => attemptController.abort(), 120_000);
      const reqId = beginTrackedApiRequest();
      const startedAt = performance.now();

      try {
        const authHeaders = await getGeminiApiKeyHeaders(forceRefresh);
        response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            text: textToSpeak,
            voiceName: targetVoiceName,
          }),
          signal: attemptController.signal,
        });
        endTrackedApiRequest(reqId, performance.now() - startedAt, response.ok);
        notifyGeminiQuotaUpdated();

        if (response.status === 401 && !forceRefresh && attempt < 2) {
          forceRefresh = true;
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        if (
          (response.status === 408 ||
            response.status === 502 ||
            response.status === 503 ||
            response.status === 504) &&
          attempt < 2
        ) {
          await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
          continue;
        }
        break;
      } catch (fetchErr) {
        endTrackedApiRequest(reqId, performance.now() - startedAt, false);
        if (signal.aborted) throw fetchErr;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
          continue;
        }
        throw fetchErr;
      } finally {
        window.clearTimeout(timer);
        signal.removeEventListener('abort', onOuterAbort);
      }
    }

    if (!response || !response.ok) {
      const errBody = response ? await response.json().catch(() => ({})) : {};
      throw new Error(
        errBody.error ||
          (response?.status === 429 ? t.dailyQuotaExhaustedBanner : t.ttsFailedError)
      );
    }

    const wavBlob = await response.blob();
    if (ttsBlobCacheRef.current.size >= 24) {
      const oldestKey = ttsBlobCacheRef.current.keys().next().value;
      if (oldestKey) ttsBlobCacheRef.current.delete(oldestKey);
    }
    ttsBlobCacheRef.current.set(cacheKey, wavBlob);
    return wavBlob;
  };

  const handlePlayTts = async () => {
    if (!trimmedTranscript) return;
    if (isGeneratingTts) return;

    if (isPlayingTts) {
      stopModalAudio();
      return;
    }

    onStopMainPlayback?.();
    stopModalAudio();
    setTtsError(null);
    setIsGeneratingTts(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const wavBlob = await synthesizeTranscriptWav(
        voice.name,
        trimmedTranscript,
        controller.signal
      );
      if (!isMountedRef.current || controller.signal.aborted) return;

      const objectUrl = URL.createObjectURL(wavBlob);
      objectUrlRef.current = objectUrl;

      const audio = new Audio(objectUrl);
      audioRef.current = audio;
      audio.onended = () => {
        if (isMountedRef.current) setIsPlayingTts(false);
      };
      audio.onerror = () => {
        if (isMountedRef.current) {
          setIsPlayingTts(false);
          setTtsError(t.ttsFailedError);
        }
      };

      await audio.play();
      if (isMountedRef.current) {
        setIsPlayingTts(true);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Character Profile TTS error:', err);
      if (isMountedRef.current) {
        const msg =
          typeof err?.message === 'string' && err.message.trim() && !err.message.includes('{')
            ? err.message
            : t.ttsFailedError;
        setTtsError(msg);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      if (isMountedRef.current) {
        setIsGeneratingTts(false);
      }
    }
  };

  const handleDownloadTtsWav = async () => {
    if (!trimmedTranscript || isDownloadingTts) return;
    setTtsError(null);
    setIsDownloadingTts(true);

    const controller = new AbortController();
    try {
      const wavBlob = await synthesizeTranscriptWav(
        voice.name,
        trimmedTranscript,
        controller.signal
      );
      if (!isMountedRef.current) return;

      const url = URL.createObjectURL(wavBlob);
      const safeVoiceSlug = voice.name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeVoiceSlug}-transcript-tts.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (isMountedRef.current) {
        const msg =
          typeof err?.message === 'string' && err.message.trim() && !err.message.includes('{')
            ? err.message
            : t.ttsFailedError;
        setTtsError(msg);
      }
    } finally {
      if (isMountedRef.current) {
        setIsDownloadingTts(false);
      }
    }
  };

  const handleClose = () => {
    stopModalAudio();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    stopModalAudio();
    const trimmedMm = mmName.trim().slice(0, MAX_BURMESE_NAME_LENGTH);
    const trimmedEn = enName.trim().slice(0, MAX_BURMESE_NAME_LENGTH);
    const nextName: BurmeseCharacterName | null =
      !trimmedMm && !trimmedEn
        ? null
        : {
            mm: trimmedMm || trimmedEn,
            en: trimmedEn || trimmedMm || trimmedEn,
          };
    const nextTranscript = trimmedTranscript || null;
    onSave(voice.name, nextName, nextTranscript);
    onClose();
  };

  const handleClearCustomName = () => {
    stopModalAudio();
    setMmName('');
    setEnName('');
    onSave(voice.name, null, trimmedTranscript || null);
    onClose();
  };

  const handleExport = (format: 'json' | 'txt') => {
    const trimmedMm = mmName.trim().slice(0, MAX_BURMESE_NAME_LENGTH);
    const trimmedEn = enName.trim().slice(0, MAX_BURMESE_NAME_LENGTH);
    const customCharacter =
      trimmedMm || trimmedEn
        ? {
            mm: trimmedMm || trimmedEn,
            en: trimmedEn || trimmedMm,
          }
        : null;
    const exportedAt = new Date().toISOString();
    const safeVoiceSlug = voice.name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const dateStamp = exportedAt.slice(0, 10);

    let content: string;
    let mimeType: string;

    if (format === 'json') {
      const payload = {
        app: 'MMNext Voice Studio',
        exportedAt,
        voiceId: voice.name,
        characterName: customCharacter,
        transcript: trimmedTranscript || null,
        gender: voice.analysis.gender,
        pitch: voice.pitch,
        analysisPitch: voice.analysis.pitch,
        pitchRangeHz: pitchRange.label,
        emotionalTone: getVoiceEmotionalTone(voice),
        characteristics: voice.analysis.characteristics,
        audioSampleUrl: voice.audioSampleUrl,
        traditionalAttireProfile: {
          title: attireProfile.title,
          attireCategory: attireProfile.attireCategory,
          upperAttire: attireProfile.upperAttire,
          lowerAttire: attireProfile.lowerAttire,
          accessories: attireProfile.accessories,
          personaRole: attireProfile.personaRole,
          suitableProjects: attireProfile.suitableProjects,
          imagePath: attireProfile.imagePath,
        },
      };
      content = JSON.stringify(payload, null, 2);
      mimeType = 'application/json;charset=utf-8';
    } else {
      const lines = [
        'MMNext Voice Studio — Character Profile Backup',
        `Exported At: ${exportedAt}`,
        '----------------------------------------',
        `Gemini Voice ID: ${voice.name}`,
        `Custom Character Name: ${customCharacter ? customCharacter.mm : '(None — Default Voice Name)'}`,
        ...(customCharacter && customCharacter.en !== customCharacter.mm
          ? [`English / Romanized Label: ${customCharacter.en}`]
          : []),
        `Character Transcript (TTS): ${trimmedTranscript || '(None)'}`,
        `Gender: ${voice.analysis.gender}`,
        `Pitch Category: ${voice.pitch} (${voice.analysis.pitch})`,
        `Pitch Range (Hz): ${pitchRange.label}`,
        `Emotional Tone: ${getVoiceEmotionalTone(voice)}`,
        `Characteristics: ${voice.analysis.characteristics.join(', ')}`,
        `Sample URL: ${voice.audioSampleUrl}`,
        '',
        '--- Myanmar Traditional Attire (မြန်မာရိုးရာ ဝတ်စားဆင်ယင်ပုံ) ---',
        `Character Persona: ${attireProfile.title.mm} / ${attireProfile.title.en}`,
        `Attire Category: ${attireProfile.attireCategory.mm} (${attireProfile.attireCategory.en})`,
        `Upper Garment (အင်္ကျီ): ${attireProfile.upperAttire.mm}`,
        `Lower Garment (လုံချည်/ပုဆိုး/ထမီ): ${attireProfile.lowerAttire.mm}`,
        `Accessories & Thanakha (အဆင်တန်ဆာ): ${attireProfile.accessories.mm}`,
        `Persona & Voice Role: ${attireProfile.personaRole.mm}`,
        `Suitable Projects: ${attireProfile.suitableProjects.mm.join(', ')}`,
      ];
      content = lines.join('\n');
      mimeType = 'text/plain;charset=utf-8';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `character-profile-${safeVoiceSlug}-${dateStamp}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportedFormat(format);
    window.setTimeout(() => {
      setExportedFormat((curr) => (curr === format ? null : curr));
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-[#020E0B]/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-profile-modal-title"
    >
      <div className="absolute inset-0" onClick={handleClose} />

      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-[#FAF6EC] dark:bg-[#06231B] border border-[#D9CEB8] dark:border-[#C6A259]/28 luminous-hairline shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/20 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EBE2CE] dark:bg-[#114637] border border-[#B49049]/40 dark:border-[#C6A259]/30 text-[#7D602D] dark:text-[#DFC589] flex items-center justify-center shrink-0">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0">
              <h2
                id="character-profile-modal-title"
                className="text-lg font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] tracking-tight truncate"
              >
                {t.characterProfileTitle}
              </h2>
              <p className="text-xs text-[#5B7469] dark:text-[#8DA399] leading-relaxed mt-0.5">
                {t.characterProfileSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors shrink-0"
            aria-label={t.close}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* 3D Realistic Character in Myanmar Traditional Attire */}
          <div className="rounded-2xl bg-gradient-to-b from-[#FAF4E6] to-[#F1E8D6] dark:from-[#092B21] dark:to-[#041913] border border-[#D9CEB8] dark:border-[#C6A259]/35 overflow-hidden shadow-sm">
            <div className="p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* 3D Portrait with Lightbox Trigger */}
              <div className="relative group shrink-0">
                <div className="w-28 h-36 rounded-xl overflow-hidden border-2 border-[#B49049]/40 dark:border-[#C6A259]/50 shadow-md bg-[#020E0B] relative">
                  <img
                    src={attireProfile.imagePath}
                    alt={`${voice.name} in Myanmar traditional attire`}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-1.5 left-1.5 right-1.5 px-1 py-0.5 rounded text-[9px] font-semibold text-center uppercase tracking-wider bg-black/60 backdrop-blur-xs text-[#DFC589] border border-[#DFC589]/30">
                    3D Realistic
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImageZoomed(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl text-white cursor-pointer"
                  title={t.character3dZoomHint}
                  aria-label={t.character3dZoomHint}
                >
                  <div className="p-1.5 rounded-full bg-black/70 border border-[#DFC589]/60 text-[#DFC589]">
                    <Maximize2 size={16} />
                  </div>
                </button>
              </div>

              {/* Character Details in Myanmar Attire */}
              <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#0D3A2E] text-[#FAF6EC] dark:bg-[#C6A259]/20 dark:text-[#DFC589] border border-[#B49049]/30 dark:border-[#C6A259]/30">
                    {t.myanmarAttireTitle}
                  </span>
                  <span className="text-[11px] font-medium text-[#7D602D] dark:text-[#DFC589]">
                    {attireProfile.attireCategory[language] || attireProfile.attireCategory.mm}
                  </span>
                </div>

                <h3 className="text-base font-serif font-bold text-[#06231B] dark:text-[#FAF6EC] leading-snug">
                  {attireProfile.title[language] || attireProfile.title.mm}
                </h3>

                <p className="text-xs text-[#42594E] dark:text-[#A7BCB2] leading-relaxed line-clamp-2">
                  {attireProfile.personaRole[language] || attireProfile.personaRole.mm}
                </p>

                {/* Suitable Project Tags */}
                <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-1">
                  {(attireProfile.suitableProjects[language] || attireProfile.suitableProjects.mm).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#E7DDD0] dark:bg-[#0E3A2F] text-[#145240] dark:text-[#DFC589] border border-[#B49049]/25 dark:border-[#C6A259]/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Structured Traditional Attire Breakdown */}
            <div className="px-4 pb-3.5 pt-2 border-t border-[#D9CEB8]/70 dark:border-[#C6A259]/20 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2 rounded-xl bg-white/50 dark:bg-[#041913]/60 border border-[#D9CEB8]/60 dark:border-[#C6A259]/15">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7D602D] dark:text-[#C6A259] mb-0.5">
                  {t.upperAttireLabel}
                </span>
                <p className="text-[11px] text-[#2B463B] dark:text-[#C5D1CA] leading-snug">
                  {attireProfile.upperAttire[language] || attireProfile.upperAttire.mm}
                </p>
              </div>

              <div className="p-2 rounded-xl bg-white/50 dark:bg-[#041913]/60 border border-[#D9CEB8]/60 dark:border-[#C6A259]/15">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7D602D] dark:text-[#C6A259] mb-0.5">
                  {t.lowerAttireLabel}
                </span>
                <p className="text-[11px] text-[#2B463B] dark:text-[#C5D1CA] leading-snug">
                  {attireProfile.lowerAttire[language] || attireProfile.lowerAttire.mm}
                </p>
              </div>

              <div className="p-2 rounded-xl bg-white/50 dark:bg-[#041913]/60 border border-[#D9CEB8]/60 dark:border-[#C6A259]/15">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#7D602D] dark:text-[#C6A259] mb-0.5">
                  {t.accessoriesLabel}
                </span>
                <p className="text-[11px] text-[#2B463B] dark:text-[#C5D1CA] leading-snug">
                  {attireProfile.accessories[language] || attireProfile.accessories.mm}
                </p>
              </div>
            </div>
          </div>

          {/* Verified Gemini Voice Real Data */}
          <div className="p-4 rounded-2xl bg-[#F4EDE0]/90 dark:bg-[#041813]/85 border border-[#D9CEB8] dark:border-[#C6A259]/20 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7D602D] dark:text-[#C6A259]">
                {t.builtInVoiceId}
              </span>
              <span className="text-xs font-semibold text-[#06231B] dark:text-[#FAF6EC] font-mono">
                {voice.name}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#2B463B] dark:text-[#C5D1CA]">
              <span className="font-medium">{translateGender(voice.analysis.gender)}</span>
              <span aria-hidden="true" className="text-[#B49049]/60 dark:text-[#C6A259]/40">·</span>
              <span className="font-medium">{translatePitch(voice.pitch)}</span>
              <span aria-hidden="true" className="text-[#B49049]/60 dark:text-[#C6A259]/40">·</span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-[#7D602D] dark:text-[#DFC589] tabular-nums">
                <Gauge size={11} />
                <span>{pitchRange.label}</span>
              </span>
              <span aria-hidden="true" className="text-[#B49049]/60 dark:text-[#C6A259]/40">·</span>
              <span className="inline-flex items-center gap-1 text-[#145240] dark:text-[#EAD7A4] font-medium">
                <Sparkles size={11} className="text-[#9C7A3C] dark:text-[#C6A259]" />
                <span>{emotionalTone}</span>
              </span>
            </div>

            <p className="text-xs text-[#5B7469] dark:text-[#9EB5AC] leading-relaxed">
              {voice.analysis.characteristics.join(', ')}
            </p>
          </div>

          {/* Character Transcript (TTS Script) Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="character-transcript-input"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#06231B] dark:text-[#FAF6EC]"
              >
                <Volume2 size={14} className="text-[#7D602D] dark:text-[#DFC589]" />
                <span>{t.characterTranscriptLabel}</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#5B7469] dark:text-[#8DA399] tabular-nums">
                  {transcript.length}/{MAX_CHARACTER_TRANSCRIPT_LENGTH}
                </span>
                {transcript.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      stopModalAudio();
                      setTranscript('');
                      setTtsError(null);
                      transcriptInputRef.current?.focus();
                    }}
                    className="text-[11px] font-medium text-[#5B7469] hover:text-rose-600 dark:text-[#8DA399] dark:hover:text-rose-400 transition-colors"
                  >
                    {t.clearTranscript}
                  </button>
                )}
              </div>
            </div>

            <textarea
              ref={transcriptInputRef}
              id="character-transcript-input"
              rows={4}
              maxLength={MAX_CHARACTER_TRANSCRIPT_LENGTH}
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                if (ttsError) setTtsError(null);
              }}
              placeholder={t.characterTranscriptPlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6EC] dark:bg-[#041813]/90 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-sm text-[#06231B] dark:text-[#FAF6EC] placeholder-[#5B7469]/70 dark:placeholder-[#8DA399]/60 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[#B49049]/40 dark:focus:ring-[#DFC589]/40"
            />

            <p className="text-[11px] text-[#5B7469] dark:text-[#8DA399] leading-relaxed">
              {t.characterTranscriptHint}
            </p>

            {/* Immediate TTS Preview & Download Controls */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handlePlayTts}
                disabled={!trimmedTranscript || isGeneratingTts}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 whitespace-nowrap shrink-0 border ${
                  isPlayingTts
                    ? 'bg-[#EBE2CE] dark:bg-[#114637] text-[#06231B] dark:text-[#EAD7A4] border-[#B49049]/50 dark:border-[#DFC589]/40 hover:bg-[#DFD3BA] dark:hover:bg-[#195E4A]'
                    : 'bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border-[#B49049]/40 shadow-sm'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isGeneratingTts ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : isPlayingTts ? (
                  <Square size={14} className="fill-current" />
                ) : (
                  <Play size={14} className="fill-current" />
                )}
                <span>
                  {isGeneratingTts
                    ? t.generating
                    : isPlayingTts
                    ? t.stopPreview
                    : t.speakTranscript}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTtsWav}
                disabled={!trimmedTranscript || isDownloadingTts}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#FAF6EC]/90 dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:text-[#7D602D] dark:hover:text-[#DFC589] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                {isDownloadingTts ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Download size={13} />
                )}
                <span>{isDownloadingTts ? t.downloadingSpeech : t.downloadSpeech}</span>
              </button>
            </div>

            {ttsError && (
              <div
                role="alert"
                className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span className="leading-snug">{ttsError}</span>
              </div>
            )}
          </div>

          {/* Optional Custom Character Name Fields */}
          <div className="pt-3 border-t border-[#D9CEB8]/80 dark:border-[#C6A259]/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="character-name-mm-input"
                className="block text-xs font-semibold text-[#2B463B] dark:text-[#C5D1CA] mb-1.5"
              >
                {t.characterNameMmLabel}
              </label>
              <input
                id="character-name-mm-input"
                type="text"
                maxLength={MAX_BURMESE_NAME_LENGTH}
                value={mmName}
                onChange={(e) => setMmName(e.target.value)}
                placeholder={t.characterNameMmPlaceholder}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EC] dark:bg-[#041813]/90 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-sm text-[#06231B] dark:text-[#FAF6EC] placeholder-[#5B7469]/70 dark:placeholder-[#8DA399]/60 focus:outline-none focus:ring-2 focus:ring-[#B49049]/40 dark:focus:ring-[#DFC589]/40"
              />
            </div>

            <div>
              <label
                htmlFor="character-name-en-input"
                className="block text-xs font-semibold text-[#2B463B] dark:text-[#C5D1CA] mb-1.5"
              >
                {t.characterNameEnLabel}
              </label>
              <input
                id="character-name-en-input"
                type="text"
                maxLength={MAX_BURMESE_NAME_LENGTH}
                value={enName}
                onChange={(e) => setEnName(e.target.value)}
                placeholder={t.characterNameEnPlaceholder}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAF6EC] dark:bg-[#041813]/90 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-sm text-[#06231B] dark:text-[#FAF6EC] placeholder-[#5B7469]/70 dark:placeholder-[#8DA399]/60 focus:outline-none focus:ring-2 focus:ring-[#B49049]/40 dark:focus:ring-[#DFC589]/40"
              />
            </div>
          </div>

          {/* Local Backup Export Row */}
          <div className="pt-3 border-t border-[#D9CEB8]/80 dark:border-[#C6A259]/20 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-[#5B7469] dark:text-[#8DA399]">
              {t.exportBackupLabel}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExport('json')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FAF6EC]/90 dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:text-[#7D602D] dark:hover:text-[#DFC589] transition-colors active:scale-95 whitespace-nowrap shrink-0"
              >
                {exportedFormat === 'json' ? (
                  <Check size={13} className="text-[#2E8267] dark:text-[#DFC589]" />
                ) : (
                  <Download size={13} />
                )}
                <span>{exportedFormat === 'json' ? t.exportedNotice : t.exportProfileJson}</span>
              </button>
              <button
                type="button"
                onClick={() => handleExport('txt')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FAF6EC]/90 dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:text-[#7D602D] dark:hover:text-[#DFC589] transition-colors active:scale-95 whitespace-nowrap shrink-0"
              >
                {exportedFormat === 'txt' ? (
                  <Check size={13} className="text-[#2E8267] dark:text-[#DFC589]" />
                ) : (
                  <FileText size={13} />
                )}
                <span>{exportedFormat === 'txt' ? t.exportedNotice : t.exportProfileTxt}</span>
              </button>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            {voice.characterName ? (
              <button
                type="button"
                onClick={handleClearCustomName}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#FAF6EC]/90 dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#5B7469] dark:text-[#8DA399] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw size={13} />
                <span>{t.clearCharacterProfile}</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-[#EBE2CE]/80 dark:bg-[#092E24] border border-[#D9CEB8]/80 dark:border-[#C6A259]/20 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#DFD3BA] dark:hover:bg-[#114637] transition-colors whitespace-nowrap shrink-0"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 text-xs font-semibold shadow-sm transition-all active:scale-95 whitespace-nowrap shrink-0"
              >
                <Check size={14} />
                <span>{t.saveCharacterProfile}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 3D Realistic Character Portrait Lightbox */}
      {isImageZoomed && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setIsImageZoomed(false)}
        >
          <div
            className="relative max-w-md w-full rounded-3xl overflow-hidden bg-[#06231B] border border-[#C6A259]/40 shadow-2xl p-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-[#C6A259]/40 shadow-inner bg-black">
              <img
                src={attireProfile.imagePath}
                alt={`${voice.name} Myanmar Traditional Attire`}
                className="w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="w-full mt-3 text-center space-y-1">
              <h4 className="text-base font-serif font-bold text-[#FAF6EC]">
                {attireProfile.title[language] || attireProfile.title.mm}
              </h4>
              <p className="text-xs text-[#DFC589]">
                {attireProfile.attireCategory[language] || attireProfile.attireCategory.mm}
              </p>
              <p className="text-[11px] text-[#9EB5AC] px-2 leading-relaxed">
                {attireProfile.personaRole[language] || attireProfile.personaRole.mm}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsImageZoomed(false)}
              className="mt-3 px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#DFC589] hover:bg-[#F3E2B8] text-[#06231B] transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterProfileModal;
