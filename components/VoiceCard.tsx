/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Pause, Activity, Heart, Columns2, Gauge, Sparkles, Share2, Pencil, FileText } from 'lucide-react';
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
  onEditCharacter?: (voice: Voice) => void;
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
  onEditCharacter,
  visualizerVariant = 'wave',
  analyserNode = null,
}, ref) => {
  const { t, language, translateGender, translatePitch, translateTone } = useI18n();
  const displayName = voice.characterName?.mm || voice.name;
  const subLabel = voice.characterName
    ? language === 'en' && voice.characterName.en && voice.characterName.en !== voice.name
      ? `${voice.characterName.en} · ${voice.name}`
      : voice.name
    : null;
  const attireTitle = voice.characterProfile?.title
    ? voice.characterProfile.title[language] || voice.characterProfile.title.mm
    : null;
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

  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <div
      ref={ref}
      data-voice-card="true"
      className={`group relative bg-[#FAF6EC]/95 dark:bg-[#092E24]/95 border luminous-hairline transition-all duration-200 flex flex-col sm:flex-row min-h-[268px] sm:min-h-[136px] h-auto cursor-pointer rounded-2xl overflow-hidden focus:outline-none ${
        isPlaying
          ? 'luxury-active-bloom border-[#B49049] dark:border-[#DFC589]/70 ring-1 ring-[#C6A259]/35'
          : isSelected
          ? 'luxury-active-bloom border-[#114637]/70 dark:border-[#C6A259]/60 ring-1 ring-[#C6A259]/25'
          : 'border-[#D9CEB8]/90 dark:border-[#C6A259]/20 shadow-sm hover:border-[#B49049]/70 dark:hover:border-[#DFC589]/45 hover:shadow-md'
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
      <div className="relative h-36 sm:h-full w-full sm:w-28 bg-[#041813] shrink-0 border-b sm:border-b-0 sm:border-r border-[#D9CEB8]/80 dark:border-[#C6A259]/20 flex items-center justify-center overflow-hidden group/thumb">
        {/* Subtle Gold Hairline Accent when Speaking */}
        {isPlaying && (
          <div className="absolute top-0 inset-x-0 h-[2px] z-30 bg-gradient-to-r from-[#9C7A3C] via-[#EAD7A4] to-[#9C7A3C]" />
        )}

        {/* 3D Realistic Character Portrait in Myanmar Traditional Attire */}
        {voice.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={voice.imageUrl}
              alt={`${displayName} Myanmar traditional attire`}
              className="w-full h-full object-cover object-top filter transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/20 pointer-events-none" />
            <span className="absolute bottom-1 left-1.5 px-1 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-xs text-[#DFC589] border border-[#DFC589]/25 pointer-events-none">
              3D MM
            </span>
          </div>
        )}

        {/* Active Visualizer Overlay */}
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-200 ${
            isPlaying ? 'opacity-90 bg-black/40 backdrop-blur-xs' : 'opacity-0 pointer-events-none'
          }`}
        >
          <AudioVisualizer
            isPlaying={isPlaying}
            variant={visualizerVariant}
            analyserNode={analyserNode}
            color={isDark ? '#DFC589' : '#F3E2B8'}
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
          <div className="h-12 w-12 sm:h-9 sm:w-9 bg-[#0D3A2E]/90 dark:bg-[#DFC589]/95 rounded-full flex items-center justify-center shadow-lg border border-[#C6A259]/40 transform transition-transform active:scale-95">
            {isPlaying ? (
              <Pause size={16} className="text-[#FAF6EC] dark:text-[#041813] sm:w-3.5 sm:h-3.5" fill="currentColor" />
            ) : (
              <Play size={16} className="text-[#FAF6EC] dark:text-[#041813] ml-0.5 sm:w-3.5 sm:h-3.5" fill="currentColor" />
            )}
          </div>
        </div>
      </div>

      {/* Content Area - Right Side */}
      <div className="flex-1 p-5 sm:px-5 sm:py-4 flex flex-col justify-between min-w-0 bg-transparent">
        {/* Top Row: Title + Functional Action Affordances */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#7D602D] dark:text-[#C6A259] truncate">
                {translateGender(voice.analysis.gender)} · {translatePitch(voice.pitch)}
              </p>
              <h3 className="text-lg sm:text-[17px] font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] tracking-tight truncate mt-0.5">
                {displayName}
              </h3>
              {attireTitle && (
                <p className="text-[11px] font-medium text-[#7D602D] dark:text-[#DFC589] truncate">
                  {attireTitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-0.5 shrink-0 -mr-1">
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
                      ? 'bg-[#0D3A2E] dark:bg-[#DFC589] text-[#FAF6EC] dark:text-[#041813]'
                      : 'text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#DFC589] hover:bg-[#EBE2CE]/70 dark:hover:bg-[#114637]/60'
                  }`}
                >
                  <Columns2 size={12} />
                  {compareSlot && <span>{compareSlot}</span>}
                </button>
              )}
              {onEditCharacter && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCharacter(voice);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                    }
                  }}
                  aria-label={`${t.editCharacterProfile}: ${displayName}`}
                  title={t.editCharacterProfile}
                  className={`p-1.5 rounded-full transition-all ${
                    voice.transcript?.trim()
                      ? 'text-[#7D602D] dark:text-[#DFC589] bg-[#EBE2CE]/90 dark:bg-[#114637]/70 hover:bg-[#DFD3BA] dark:hover:bg-[#195E4A]/70'
                      : 'text-[#5B7469] dark:text-[#8DA399] hover:text-[#7D602D] dark:hover:text-[#DFC589] hover:bg-[#EBE2CE]/70 dark:hover:bg-[#114637]/60'
                  }`}
                >
                  <Pencil size={13} />
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
                  className="p-1.5 rounded-full text-[#5B7469] dark:text-[#8DA399] hover:text-[#7D602D] dark:hover:text-[#DFC589] hover:bg-[#EBE2CE]/70 dark:hover:bg-[#114637]/60 transition-all"
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
                    ? 'text-[#9C7A3C] dark:text-[#DFC589] bg-[#EBE2CE]/80 dark:bg-[#114637]/70'
                    : 'text-[#5B7469] dark:text-[#8DA399] hover:text-[#9C7A3C] dark:hover:text-[#DFC589] hover:bg-[#EBE2CE]/70 dark:hover:bg-[#114637]/60'
                }`}
              >
                <Heart size={14} className={isFavorite ? 'fill-current' : ''} />
              </button>
            </div>
          </div>

          {/* Custom character sub-label (when set) & real characteristics */}
          {subLabel && (
            <p className="text-[11px] font-medium text-[#5B7469] dark:text-[#8DA399] truncate mt-0.5">
              {subLabel}
            </p>
          )}
          <p className="text-xs text-[#2B463B] dark:text-[#C5D1CA] leading-relaxed line-clamp-2 sm:line-clamp-1 font-light mt-1">
            {voice.analysis.characteristics.join(', ')}
          </p>
        </div>

        {/* Clean Unboxed Editorial Metadata Footer */}
        <div
          className="mt-3 sm:mt-2.5 pt-2 border-t border-[#D9CEB8]/70 dark:border-[#C6A259]/15 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]"
          aria-label={t.voiceTagsLabel}
        >
          <span
            title={t.pitchRangeTagLabel}
            className="inline-flex items-center gap-1 font-mono font-medium text-[#7D602D] dark:text-[#DFC589] tabular-nums whitespace-nowrap"
          >
            <Gauge size={11} className="shrink-0 opacity-80" />
            <span>{pitchRange.label}</span>
          </span>
          <span className="text-[#B49049]/60 dark:text-[#C6A259]/40" aria-hidden="true">·</span>
          <span
            title={t.emotionalToneTagLabel}
            className="inline-flex items-center gap-1 font-medium text-[#145240] dark:text-[#9EB5AC] truncate max-w-[160px]"
          >
            <Sparkles size={10} className="shrink-0 opacity-75 text-[#9C7A3C] dark:text-[#C6A259]" />
            <span className="truncate">{translateTone(emotionalTone)}</span>
          </span>
          {voice.transcript?.trim() && (
            <>
              <span className="text-[#B49049]/60 dark:text-[#C6A259]/40" aria-hidden="true">·</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCharacter?.(voice);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
                }}
                className="inline-flex items-center gap-1 font-medium text-[#7D602D] dark:text-[#DFC589] hover:underline whitespace-nowrap"
                title={voice.transcript.trim()}
              >
                <FileText size={10} className="shrink-0" />
                <span>{t.transcriptSavedBadge}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

VoiceCard.displayName = 'VoiceCard';

export default VoiceCard;