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
      const authHeaders = await getGeminiApiKeyHeaders();
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          text,
          voiceName: selectedVoiceName,
        }),
        signal: controller.signal,
      });
      notifyGeminiQuotaUpdated();

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed with status ${response.status}`);
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

  return (
    <div className="w-full bg-[#F7F1E5] dark:bg-zinc-900 rounded-xl border border-zinc-300/70 dark:border-zinc-700 overflow-hidden">
      {/* Header / Controls */}
      <div className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#FDF7EB] dark:bg-zinc-800 border-b border-zinc-300/60 dark:border-zinc-700">
        {/* Voice Selector + Favorite Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative group flex-1 sm:flex-initial">
            <select
              value={selectedVoiceName}
              onChange={(e) => setSelectedVoiceName(e.target.value)}
              className="appearance-none w-full sm:w-56 bg-white/85 dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 py-2 pl-3 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-300/60 dark:focus:ring-zinc-600 cursor-pointer transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
              disabled={isLoading || isPlaying}
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.characterName?.mm || voice.name} ({translateGender(voice.analysis.gender)})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
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
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-500'
                  : 'bg-white/85 dark:bg-zinc-900 border-zinc-300/80 dark:border-zinc-700 text-zinc-500 hover:text-rose-500'
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
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 transform active:scale-95 ${
            isPlaying
              ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-300/80 dark:hover:bg-zinc-600'
              : 'bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white hover:bg-zinc-700 dark:hover:bg-indigo-500 shadow-md'
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
        className={`h-24 relative flex items-center justify-center bg-[#F7F1E5] dark:bg-zinc-900 overflow-hidden group ${
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
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        ></div>

        {/* Icon or Visualizer */}
        <div className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none">
          {isPlaying ? (
            <div className="w-full h-full opacity-80">
              <AudioVisualizer
                isPlaying={true}
                variant={visualizerVariant}
                analyserNode={analyserNode}
                color={
                  document.documentElement.classList.contains('dark') ? '#a5b4fc' : '#27272a'
                }
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-600">
              <Volume2 size={24} />
              <span className="text-xs font-medium">{t.clickToPreviewAudio}</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 bg-[#F7F1E5] dark:bg-zinc-900 flex items-center justify-center text-red-500 dark:text-red-400 gap-2 text-sm z-20 px-4 text-center">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiTtsPreview;