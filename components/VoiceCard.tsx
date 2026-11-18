/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, Activity, Heart, Columns2, Gauge, Sparkles, Share2 } from 'lucide-react';
import { Voice } from '../types';
import AudioVisualizer, { VisualizerVariant } from './AudioVisualizer';
import { useI18n } from '../i18n';
import { getVoicePitchHzRange, getVoiceEmotionalTone } from '../utils/pitchDetection';

interface VoiceCardProps {
  voice: Voice;
  isPlaying: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onPlayToggle: (voiceName: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (voiceName: string) => void;
  compareSlot?: 'A' | 'B' | null;
  onToggleCompare?: (voiceName: string) => void;
  onShare?: (voice: Voice) => void;
  visualizerVariant?: VisualizerVariant;
  analyserNode?: AnalyserNode | null;
}

const VoiceCard = React.forwardRef<HTMLDivElement, VoiceCardProps>(({
  voice,
  isPlaying,
  isSelected = false,
  onSelect,
  onPlayToggle,
  isFavorite,
  onToggleFavorite,
  compareSlot = null,
  onToggleCompare,
  onShare,
  visualizerVariant = 'wave',
  analyserNode = null,
}, ref) => {
  const { t, language, translateGender, translatePitch, translateTone } = useI18n();
  const displayName = voice.characterName?.mm || voice.name;
  const subLabel =
    language === 'en' && voice.characterName
      ? `${voice.characterName.en} · ${voice.name}`
      : voice.name;
  const pitchRange = getVoicePitchHzRange(voice);
  const emotionalTone = getVoiceEmotionalTone(voice);

  const handleClick = () => {
    onSelect?.();
    onPlayToggle(voice.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      ref={ref}
      data-voice-card="true"
      className={`group relative bg-white/95 dark:bg-zinc-800 border transition-all duration-200 flex flex-col sm:flex-row min-h-[268px] sm:min-h-[128px] h-auto cursor-pointer rounded-2xl overflow-hidden hover:border-zinc-400 dark:hover:border-zinc-600 focus:outline-none ${
        isPlaying
          ? 'border-zinc-500 dark:border-blue-800 ring-2 ring-zinc-300/80 dark:ring-blue-900/30 shadow-md'
          : isSelected
          ? 'border-zinc-700 dark:border-indigo-500 ring-2 ring-zinc-800/20 dark:ring-indigo-500/30 shadow-md'
          : 'border-zinc-300/70 dark:border-zinc-700 shadow-sm hover:shadow-md'
      }`}
      onClick={handleClick}
      onFocus={(e) => {
        if (e.target === e.currentTarget) {
          onSelect?.();
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${isPlaying ? t.pauseSample : t.playSample}: ${displayName}`}
    >
      {/* Visualizer / Action Area - Left Side */}
      <div className="relative h-36 sm:h-full w-full sm:w-28 bg-[#F7F1E5]/85 dark:bg-zinc-900/50 shrink-0 border-b sm:border-b-0 sm:border-r border-zinc-200/80 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
        {/* Technical Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.1]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '8px 8px',
          }}
        ></div>

        {/* Resting State Visual */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            isPlaying ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Activity size={24} className="text-zinc-400 dark:text-zinc-600 sm:w-5 sm:h-5" strokeWidth={1.5} />
        </div>

        {/* Active Visualizer */}
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-200 ${
            isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <AudioVisualizer
            isPlaying={isPlaying}
            variant={visualizerVariant}
            analyserNode={analyserNode}
            color={document.documentElement.classList.contains('dark') ? '#a5b4fc' : '#27272a'}
          />
        </div>

        {/* Play Button Overlay - Tactile Feel */}
        <div
          className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-200 ${
            isPlaying
              ? 'opacity-0 hover:opacity-100 focus:opacity-100'
              : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100'
          }`}
        >
          <div className="h-12 w-12 sm:h-9 sm:w-9 bg-zinc-800 dark:bg-zinc-100 rounded-full flex items-center justify-center shadow-lg transform transition-transform active:scale-95">
            {isPlaying ? (
              <Pause size={16} className="text-[#FDF7EB] dark:text-zinc-900 sm:w-3.5 sm:h-3.5" fill="currentColor" />
            ) : (
              <Play size={16} className="text-[#FDF7EB] dark:text-zinc-900 ml-0.5 sm:w-3.5 sm:h-3.5" fill="currentColor" />
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div
          className={`absolute top-2 left-2 w-1.5 h-1.5 rounded-full ${
            isPlaying ? 'animate-google-colors' : 'bg-zinc-300 dark:bg-zinc-600'
          }`}
        ></div>
      </div>

      {/* Content Area - Right Side */}
      <div className="flex-1 p-5 sm:p-4 flex flex-col justify-between sm:justify-center min-w-0 bg-white/95 dark:bg-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-1 sm:mb-0.5">
          <h3 className="text-lg sm:text-base font-semibold text-zinc-800 dark:text-white tracking-tight truncate">
            {displayName}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <span className="inline-flex items-center px-2 py-0.5 border border-zinc-300/70 dark:border-zinc-700 bg-[#F7F1E5]/80 dark:bg-zinc-900/50 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 rounded-full">
              {translateGender(voice.analysis.gender)}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 border border-zinc-300/70 dark:border-zinc-700 bg-[#F7F1E5]/80 dark:bg-zinc-900/50 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 rounded-full">
              {translatePitch(voice.pitch)}
            </span>
            {onToggleCompare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(voice.name);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                  }
                }}
                aria-label={`${compareSlot ? t.removeFromCompare : t.addToCompare}: ${displayName}`}
                aria-pressed={!!compareSlot}
                title={compareSlot ? t.removeFromCompare : t.addToCompare}
                className={`inline-flex items-center gap-0.5 px-1.5 py-1 rounded-full transition-all text-[10px] font-bold ${
                  compareSlot
                    ? 'bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white'
                    : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <Columns2 size={12} />
                {compareSlot && <span>{compareSlot}</span>}
              </button>
            )}
            {onShare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(voice);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                  }
                }}
                aria-label={`${t.shareVoice}: ${displayName}`}
                title={t.shareVoice}
                className="p-1.5 rounded-full text-zinc-400 dark:text-zinc-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-all"
              >
                <Share2 size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(voice.name);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              aria-label={`${isFavorite ? t.removeFromFavorites : t.saveToFavorites}: ${displayName}`}
              aria-pressed={isFavorite}
              title={isFavorite ? t.removeFromFavorites : t.saveToFavorites}
              className={`p-1.5 rounded-full transition-all ${
                isFavorite
                  ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                  : 'text-zinc-400 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60'
              }`}
            >
              <Heart size={14} className={isFavorite ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        {/* Built-in voice sub-label & characteristics */}
        <p className="text-xs sm:text-[11px] font-medium text-zinc-500 dark:text-zinc-500 truncate mb-1 sm:mb-0.5">
          {subLabel}
        </p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2 sm:line-clamp-1 font-light">
          {voice.analysis.characteristics.join(', ')}
        </p>

        {/* Tags: Pitch Range (Hz) & Emotional Tone */}
        <div
          className="mt-2 sm:mt-1.5 pt-1.5 border-t border-zinc-200/70 dark:border-zinc-700/60 flex flex-wrap items-center gap-1.5"
          aria-label={t.voiceTagsLabel}
        >
          <span
            title={t.pitchRangeTagLabel}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/60 text-[10px] font-mono font-medium text-indigo-700 dark:text-indigo-300 tabular-nums whitespace-nowrap"
          >
            <Gauge size={10} className="shrink-0 opacity-80" />
            <span>{pitchRange.label}</span>
          </span>
          <span
            title={t.emotionalToneTagLabel}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 text-[10px] font-medium text-amber-800 dark:text-amber-300 truncate max-w-full"
          >
            <Sparkles size={10} className="shrink-0 opacity-80" />
            <span className="truncate">{translateTone(emotionalTone)}</span>
          </span>
        </div>
      </div>
    </div>
  );
});

VoiceCard.displayName = 'VoiceCard';

export default VoiceCard;