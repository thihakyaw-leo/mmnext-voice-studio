/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Loader2, Volume2, AlertCircle, ChevronDown, Heart } from 'lucide-react';
import { Voice } from '../types';
import AudioVisualizer, { VisualizerVariant } from './AudioVisualizer';
import { useI18n } from '../i18n';
import { getGeminiApiKeyHeaders, notifyGeminiQuotaUpdated } from '../firebase';
import { beginTrackedApiRequest, endTrackedApiRequest } from '../utils/networkStatus';

interface AiTtsPreviewProps {
  text: string;
  voices: Voice[];
  favorites?: string[];
  onToggleFavorite?: (voiceName: string) => void;
  visualizerVariant?: VisualizerVariant;
}

const AiTtsPreview: React.FC<AiTtsPreviewProps> = ({
  text,
  voices,
  favorites = [],
  onToggleFavorite,
  visualizerVariant = 'wave',
}) => {
  const { t, translateGender } = useI18n();
  const [selectedVoiceName, setSelectedVoiceName] = useState(voices[0]?.name || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const stopAudio = () => {
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
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (isMountedRef.current) {
      setIsPlaying(false);
      setAnalyserNode(null);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopAudio();
    };
  }, []);

  useEffect(() => {
    if (voices.length > 0 && !voices.find((v) => v.name === selectedVoiceName)) {
      setSelectedVoiceName(voices[0].name);
    }
  }, [voices, selectedVoiceName]);

  const handlePlay = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (isLoading) return;

    if (isPlaying) {
      stopAudio();
      return;
    }

    stopAudio();
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let response: Response | null = null;
      let forceRefresh = false;

      for (let attempt = 0; attempt < 3; attempt++) {
        if (controller.signal.aborted) return;
        const attemptController = new AbortController();
        const onOuterAbort = () => attemptController.abort();
        controller.signal.addEventListener('abort', onOuterAbort, { once: true });
        const timer = window.setTimeout(() => attemptController.abort(), 120_000);
        const reqId = beginTrackedApiRequest();
        const startedAt = performance.now();

        try {
          const authHeaders = await getGeminiApiKeyHeaders(forceRefresh);
          response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({
              text,
              voiceName: selectedVoiceName,
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
          if ((response.status === 408 || response.status === 502 || response.status === 503 || response.status === 504) && attempt < 2) {
            await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
            continue;
          }
          break;
        } catch (fetchErr: any) {
          endTrackedApiRequest(reqId, performance.now() - startedAt, false);
          if (controller.signal.aborted) return;
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 900 * (attempt + 1)));
            continue;
          }
          throw fetchErr;
        } finally {
          window.clearTimeout(timer);
          controller.signal.removeEventListener('abort', onOuterAbort);
        }
      }

      if (!response || !response.ok) {
        const errBody = response ? await response.json().catch(() => ({})) : {};
        throw new Error(errBody.error || `Request failed with status ${response?.status || 500}`);
      }

      const wavBlob = await response.blob();
      if (!isMountedRef.current || controller.signal.aborted) return;

      const objectUrl = URL.createObjectURL(wavBlob);
      objectUrlRef.current = objectUrl;

      const audio = new Audio(objectUrl);
      audioRef.current = audio;

      // Connect real-time Web Audio AnalyserNode for same-origin WAV blob
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const source = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.78;
          source.connect(analyser);
          analyser.connect(ctx.destination);
          audioCtxRef.current = ctx;
          if (isMountedRef.current) {
            setAnalyserNode(analyser);
          }
        }
      } catch {
        // Fallback to procedural envelope in AudioVisualizer
      }

      audio.onended = () => {
        if (isMountedRef.current) setIsPlaying(false);
      };
      audio.onerror = () => {
        if (isMountedRef.current) {
          setIsPlaying(false);
          setError(t.ttsFailedError);
        }
      };

      await audio.play();
      if (isMountedRef.current) {
        setIsPlaying(true);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('TTS Error:', err);
      if (isMountedRef.current) {
        const msg = typeof err?.message === 'string' && err.message.trim() && !err.message.includes('{')
          ? err.message
          : t.ttsFailedError;
        setError(msg);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const isSelectedFavorite = favorites.includes(selectedVoiceName);

  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <div className="w-full bg-[#F4EDE0] dark:bg-[#041813] rounded-xl border border-[#D9CEB8] dark:border-[#C6A259]/22 overflow-hidden">
      {/* Header / Controls */}
      <div className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#FAF6EC] dark:bg-[#06231B] border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/20">
        {/* Voice Selector + Favorite Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative group flex-1 sm:flex-initial">
            <select
              value={selectedVoiceName}
              onChange={(e) => setSelectedVoiceName(e.target.value)}
              className="appearance-none w-full sm:w-56 bg-[#FAF6EC] dark:bg-[#041813]/90 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#FAF6EC] py-2 pl-3 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#B49049]/40 dark:focus:ring-[#DFC589]/40 cursor-pointer transition-all hover:border-[#B49049] dark:hover:border-[#DFC589]/50"
              disabled={isLoading || isPlaying}
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.characterName?.mm ? `${voice.characterName.mm} (${voice.name})` : voice.name} ({translateGender(voice.analysis.gender)})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#7D602D] dark:text-[#C6A259]">
              <ChevronDown size={14} />
            </div>
          </div>

          {onToggleFavorite && selectedVoiceName && (
            <button
              type="button"
              onClick={() => onToggleFavorite(selectedVoiceName)}
              aria-label={`${
                isSelectedFavorite ? t.removeFromFavorites : t.saveToFavorites
              }: ${selectedVoiceName}`}
              aria-pressed={isSelectedFavorite}
              title={isSelectedFavorite ? t.removeFromFavorites : t.saveToFavorites}
              className={`p-2 rounded-lg border transition-all shrink-0 ${
                isSelectedFavorite
                  ? 'bg-[#EBE2CE] dark:bg-[#114637] border-[#B49049] dark:border-[#DFC589]/60 text-[#7D602D] dark:text-[#DFC589]'
                  : 'bg-[#FAF6EC] dark:bg-[#041813]/85 border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#5B7469] dark:text-[#8DA399] hover:text-[#7D602D] dark:hover:text-[#DFC589]'
              }`}
            >
              <Heart size={16} className={isSelectedFavorite ? 'fill-current' : ''} />
            </button>
          )}
        </div>

        {/* Play Button */}
        <button
          onClick={handlePlay}
          disabled={isLoading}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 transform active:scale-95 border ${
            isPlaying
              ? 'bg-[#EBE2CE] dark:bg-[#114637] text-[#06231B] dark:text-[#EAD7A4] border-[#B49049]/50 dark:border-[#DFC589]/40 hover:bg-[#DFD3BA] dark:hover:bg-[#195E4A]'
              : 'bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border-[#B49049]/40 shadow-md'
          } ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isPlaying ? (
            <Square size={16} className="fill-current" />
          ) : (
            <Play size={16} className="fill-current" />
          )}
          <span>{isLoading ? t.generating : isPlaying ? t.stopPreview : t.listen}</span>
        </button>
      </div>

      {/* Visualizer Area */}
      <div
        className={`h-24 relative flex items-center justify-center bg-[#F4EDE0] dark:bg-[#041813] overflow-hidden group ${
          isLoading ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={handlePlay}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handlePlay();
        }}
        aria-label={isPlaying ? t.stopPreview : t.clickToPreviewAudio}
      >
        {/* Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.045] dark:opacity-[0.08] text-[#114637] dark:text-[#DFC589]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '9px 9px',
          }}
        ></div>

        {/* Icon or Visualizer */}
        <div className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none">
          {isPlaying ? (
            <div className="w-full h-full opacity-90">
              <AudioVisualizer
                isPlaying={true}
                variant={visualizerVariant}
                analyserNode={analyserNode}
                color={isDark ? '#DFC589' : '#114637'}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#5B7469] dark:text-[#8DA399]">
              <Volume2 size={24} />
              <span className="text-xs font-medium">{t.clickToPreviewAudio}</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 bg-[#F4EDE0] dark:bg-[#041813] flex items-center justify-center text-rose-600 dark:text-rose-400 gap-2 text-sm z-20 px-4 text-center">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiTtsPreview;