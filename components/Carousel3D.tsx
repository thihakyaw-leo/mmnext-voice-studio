/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useReducedMotion } from 'framer-motion';
import { Voice } from '../types';
import { Play, Pause, Activity, ChevronLeft, ChevronRight, Heart, Columns2, Gauge, Sparkles, Share2, Pencil, FileText } from 'lucide-react';
import AudioVisualizer, { VisualizerVariant } from './AudioVisualizer';
import { useI18n } from '../i18n';
import { getVoicePitchHzRange, getVoiceEmotionalTone } from '../utils/pitchDetection';

interface Carousel3DProps {
  voices: Voice[];
  activeIndex: number;
  onChange: (index: number) => void;
  playingVoice: string | null;
  onPlayToggle: (voiceName: string) => void;
  favorites: string[];
  onToggleFavorite: (voiceName: string) => void;
  compareVoices?: string[];
  onToggleCompare?: (voiceName: string) => void;
  onShare?: (voice: Voice) => void;
  onEditCharacter?: (voice: Voice) => void;
  visualizerVariant?: VisualizerVariant;
  analyserNode?: AnalyserNode | null;
  disabled?: boolean;
  filterKey?: string;
}

const Carousel3D: React.FC<Carousel3DProps> = ({
  voices,
  activeIndex,
  onChange,
  playingVoice,
  onPlayToggle,
  favorites,
  onToggleFavorite,
  compareVoices = [],
  onToggleCompare,
  onShare,
  onEditCharacter,
  visualizerVariant = 'wave',
  analyserNode = null,
  disabled = false,
  filterKey = 'default',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const prevFilterKeyRef = useRef(filterKey);
  const prevActiveIndexRef = useRef(activeIndex);
  const applyStaggerRef = useRef(true);

  if (prevFilterKeyRef.current !== filterKey) {
    prevFilterKeyRef.current = filterKey;
    prevActiveIndexRef.current = activeIndex;
    applyStaggerRef.current = true;
  } else if (prevActiveIndexRef.current !== activeIndex) {
    prevActiveIndexRef.current = activeIndex;
    applyStaggerRef.current = false;
  }
  const { t, language, translateGender, translatePitch, translateTone } = useI18n();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(activeIndex);
  const voicesLengthRef = useRef(voices.length);
  const wheelAccumRef = useRef(0);
  const wheelLockUntilRef = useRef(0);
  const wheelResetTimerRef = useRef<number | null>(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  activeIndexRef.current = activeIndex;
  voicesLengthRef.current = voices.length;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePrev = () => {
    if (activeIndex > 0) onChange(activeIndex - 1);
  };

  const handleNext = () => {
    if (activeIndex < voices.length - 1) onChange(activeIndex + 1);
  };

  // Mouse wheel & trackpad navigation across Character Cards
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (disabled || voicesLengthRef.current <= 1) return;

      const rawDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (rawDelta === 0) return;

      e.preventDefault();

      const scale = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? 300 : 1;
      wheelAccumRef.current += rawDelta * scale;

      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
      wheelResetTimerRef.current = window.setTimeout(() => {
        wheelAccumRef.current = 0;
        wheelResetTimerRef.current = null;
      }, 140);

      const now = performance.now();
      if (now < wheelLockUntilRef.current) return;

      if (Math.abs(wheelAccumRef.current) >= 35) {
        const direction = wheelAccumRef.current > 0 ? 1 : -1;
        wheelAccumRef.current = 0;
        wheelLockUntilRef.current = now + 170;

        const current = activeIndexRef.current;
        const maxIdx = voicesLengthRef.current - 1;
        const nextIndex = Math.max(0, Math.min(maxIdx, current + direction));
        if (nextIndex !== current) {
          onChange(nextIndex);
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current);
      }
    };
  }, [disabled, onChange]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;
    const threshold = 50;
    if (info.offset.x > threshold && activeIndex > 0) {
      onChange(activeIndex - 1);
    } else if (info.offset.x < -threshold && activeIndex < voices.length - 1) {
      onChange(activeIndex + 1);
    }
  };

  const visibleRange = 3;

  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <div ref={wrapperRef} className="relative w-full h-full flex items-center justify-center">
      {/* Navigation Arrows */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 sm:px-12 z-50 pointer-events-none">
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0 || disabled}
          className={`p-3.5 sm:p-4 rounded-full bg-[#FAF6EC]/90 dark:bg-[#06231B]/90 backdrop-blur-md shadow-lg border luminous-hairline border-[#D9CEB8] dark:border-[#C6A259]/30 text-[#06231B] dark:text-[#DFC589] transition-all hover:scale-105 hover:border-[#B49049] dark:hover:border-[#DFC589]/60 active:scale-95 pointer-events-auto ${
            activeIndex === 0 ? 'opacity-0 cursor-default' : 'opacity-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={t.previousVoice}
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={handleNext}
          disabled={activeIndex >= voices.length - 1 || disabled}
          className={`p-3.5 sm:p-4 rounded-full bg-[#FAF6EC]/90 dark:bg-[#06231B]/90 backdrop-blur-md shadow-lg border luminous-hairline border-[#D9CEB8] dark:border-[#C6A259]/30 text-[#06231B] dark:text-[#DFC589] transition-all hover:scale-105 hover:border-[#B49049] dark:hover:border-[#DFC589]/60 active:scale-95 pointer-events-auto ${
            activeIndex >= voices.length - 1
              ? 'opacity-0 cursor-default'
              : 'opacity-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={t.nextVoice}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[76vh] sm:h-[70vh] flex items-center justify-center"
        style={{ perspective: '1200px' }}
      >
        <div
          key={filterKey}
          className="relative w-full h-full flex items-center justify-center transform-style-3d"
        >
          <AnimatePresence>
            {voices.map((voice, index) => {
              if (Math.abs(index - activeIndex) > visibleRange) return null;

              const isActive = index === activeIndex;
              const offset = index - activeIndex;
              const isPlaying = playingVoice === voice.name;
              const isFavorite = favorites.includes(voice.name);
              const compareIdx = compareVoices.indexOf(voice.name);
              const compareSlot = compareIdx === 0 ? 'A' : compareIdx === 1 ? 'B' : null;
              const displayName = voice.characterName?.mm || voice.name;
              const subLabel = voice.characterName
                ? language === 'en' && voice.characterName.en && voice.characterName.en !== voice.name
                  ? `${voice.characterName.en} · ${voice.name}`
                  : voice.name
                : null;

              const zIndex = 100 - Math.abs(offset);
              const isMobile = windowWidth < 640;

              let x = 0;
              if (isMobile) {
                const mobileSpacing = windowWidth * 0.75;
                x = offset * mobileSpacing;
              } else {
                const baseGap = 280;
                const stackStep = 45;
                if (offset !== 0) {
                  x = Math.sign(offset) * (baseGap + (Math.abs(offset) - 1) * stackStep);
                }
              }

              return (
                <motion.div
                  key={voice.name}
                  data-voice-card="true"
                  className={`absolute w-[290px] max-h-[66vh] aspect-[3/5] sm:max-h-none sm:w-[360px] sm:aspect-[3/4] bg-[#FAF6EC]/95 dark:bg-[#092E24]/95 rounded-3xl border luminous-hairline overflow-hidden cursor-pointer ${
                    isActive
                      ? isPlaying
                        ? 'luxury-active-bloom border-[#B49049] dark:border-[#DFC589]/70 shadow-2xl'
                        : 'luxury-active-bloom border-[#B49049]/80 dark:border-[#C6A259]/55 shadow-2xl'
                      : 'border-[#D9CEB8]/80 dark:border-[#C6A259]/20 shadow-lg'
                  }`}
                  style={{ zIndex }}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0, x }
                      : {
                          scale: isActive ? 0.92 : 0.78,
                          opacity: 0,
                          y: 18,
                          x: offset * 220,
                        }
                  }
                  animate={
                    shouldReduceMotion
                      ? { opacity: 1, x }
                      : {
                          scale: isActive ? 1 : 0.85,
                          opacity: 1,
                          y: 0,
                          x,
                          z: isActive ? 0 : -100 - Math.abs(offset) * 30,
                          rotateY: offset * -15,
                          filter: isActive ? 'blur(0px)' : 'blur(0.5px)',
                        }
                  }
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0.01 }
                      : {
                          type: 'spring',
                          stiffness: 280,
                          damping: 28,
                          delay: applyStaggerRef.current ? Math.abs(offset) * 0.045 : 0,
                        }
                  }
                  onClick={() => {
                    if (disabled) return;
                    if (isActive) {
                      onPlayToggle(voice.name);
                    } else {
                      onChange(index);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === 'Enter' && e.target === e.currentTarget) {
                      e.preventDefault();
                      if (isActive) {
                        onPlayToggle(voice.name);
                      } else {
                        onChange(index);
                      }
                    }
                  }}
                  drag={isActive && !disabled ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  whileHover={isActive && !disabled ? { scale: 1.02 } : {}}
                  role="button"
                  tabIndex={isActive && !disabled ? 0 : -1}
                  aria-label={`${displayName} — ${
                    isActive ? (isPlaying ? t.pauseSample : t.playSample) : t.focusInLibrary
                  }`}
                >
                  {/* Fader Overlay for Inactive Cards */}
                  <motion.div
                    animate={{ opacity: isActive ? 0 : 0.62 }}
                    className="absolute inset-0 bg-[#F4EDE0] dark:bg-[#020E0B] z-40 pointer-events-none"
                  />

                  <div className="h-full flex flex-col relative">
                    <div className="flex-1 relative bg-[#F4EDE0] dark:bg-[#041813] flex items-center justify-center overflow-hidden">
                      {/* Soft Volumetric Golden Bloom inside Visualizer Stage */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-80 dark:opacity-100"
                        style={{
                          background: isDark
                            ? 'radial-gradient(circle at 50% 45%, rgba(223, 197, 137, 0.13), rgba(20, 82, 64, 0.18) 48%, transparent 75%)'
                            : 'radial-gradient(circle at 50% 45%, rgba(180, 144, 73, 0.10), transparent 70%)',
                        }}
                      />
                      <div
                        className="absolute inset-0 opacity-[0.045] dark:opacity-[0.08] text-[#114637] dark:text-[#DFC589]"
                        style={{
                          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                          backgroundSize: '12px 12px',
                        }}
                      ></div>

                      {/* Favorite Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (disabled) return;
                          if (isActive) {
                            onToggleFavorite(voice.name);
                          } else {
                            onChange(index);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                          }
                        }}
                        tabIndex={isActive && !disabled ? 0 : -1}
                        aria-label={`${isFavorite ? t.removeFromFavorites : t.saveToFavorites}: ${displayName}`}
                        aria-pressed={isFavorite}
                        title={isFavorite ? t.removeFromFavorites : t.saveToFavorites}
                        className={`absolute top-5 left-5 z-30 h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 shadow-sm ${
                          isFavorite
                            ? 'bg-[#EBE2CE]/95 dark:bg-[#114637]/90 border-[#B49049] dark:border-[#DFC589]/60 text-[#7D602D] dark:text-[#DFC589] scale-105'
                            : 'bg-[#FAF6EC]/85 dark:bg-[#06231B]/80 border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#5B7469] dark:text-[#8DA399] hover:text-[#7D602D] dark:hover:text-[#DFC589] hover:scale-105'
                        }`}
                      >
                        <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
                      </button>

                      {/* Top-Right Action Cluster: Edit, Share & Compare */}
                      <div className="absolute top-5 right-5 z-30 flex items-center gap-1.5">
                        {onEditCharacter && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (disabled) return;
                              if (isActive) {
                                onEditCharacter(voice);
                              } else {
                                onChange(index);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                              }
                            }}
                            tabIndex={isActive && !disabled ? 0 : -1}
                            aria-label={`${t.editCharacterProfile}: ${displayName}`}
                            title={t.editCharacterProfile}
                            className={`h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 shadow-sm hover:scale-105 ${
                              voice.transcript?.trim()
                                ? 'bg-[#EBE2CE]/95 dark:bg-[#114637]/90 border-[#B49049] dark:border-[#DFC589]/60 text-[#7D602D] dark:text-[#DFC589]'
                                : 'bg-[#FAF6EC]/85 dark:bg-[#06231B]/80 border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#5B7469] dark:text-[#8DA399] hover:text-[#7D602D] dark:hover:text-[#DFC589]'
                            }`}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {onShare && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (disabled) return;
                              if (isActive) {
                                onShare(voice);
                              } else {
                                onChange(index);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                              }
                            }}
                            tabIndex={isActive && !disabled ? 0 : -1}
                            aria-label={`${t.shareVoice}: ${displayName}`}
                            title={t.shareVoice}
                            className="h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 shadow-sm bg-[#FAF6EC]/85 dark:bg-[#06231B]/80 border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#5B7469] dark:text-[#8DA399] hover:text-[#7D602D] dark:hover:text-[#DFC589] hover:scale-105"
                          >
                            <Share2 size={14} />
                          </button>
                        )}

                        {onToggleCompare && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (disabled) return;
                              if (isActive) {
                                onToggleCompare(voice.name);
                              } else {
                                onChange(index);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                              }
                            }}
                            tabIndex={isActive && !disabled ? 0 : -1}
                            aria-label={`${
                              compareSlot ? t.removeFromCompare : t.addToCompare
                            }: ${displayName}`}
                            aria-pressed={!!compareSlot}
                            title={compareSlot ? t.removeFromCompare : t.addToCompare}
                            className={`h-9 min-w-[36px] px-2 rounded-full flex items-center justify-center gap-1 backdrop-blur-md border transition-all duration-200 shadow-sm text-xs font-bold ${
                              compareSlot
                                ? 'bg-[#0D3A2E] dark:bg-[#DFC589] border-[#B49049] dark:border-[#DFC589] text-[#FAF6EC] dark:text-[#041813] scale-105'
                                : 'bg-[#FAF6EC]/85 dark:bg-[#06231B]/80 border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC] hover:scale-105'
                            }`}
                          >
                            <Columns2 size={14} />
                            {compareSlot && <span>{compareSlot}</span>}
                          </button>
                        )}
                      </div>

                      {/* 3D Realistic Character Portrait in Myanmar Traditional Attire */}
                      {voice.imageUrl && (
                        <div className="absolute inset-0 z-0 overflow-hidden">
                          <img
                            src={voice.imageUrl}
                            alt={`${displayName} in authentic Myanmar traditional attire`}
                            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            loading={isActive ? 'eager' : 'lazy'}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30 pointer-events-none" />
                          <div className="absolute bottom-3 left-4 z-20 flex items-center gap-1.5 pointer-events-none">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-xs text-[#DFC589] border border-[#DFC589]/30 shadow-xs">
                              3D Realistic
                            </span>
                            {voice.characterProfile?.attireCategory && (
                              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#041913]/70 backdrop-blur-xs text-[#FAF6EC] border border-white/10 truncate max-w-[200px]">
                                {voice.characterProfile.attireCategory[language] || voice.characterProfile.attireCategory.mm}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Active Audio Visualizer Overlay */}
                      <div
                        className={`absolute inset-0 z-10 transition-opacity duration-300 ${
                          isPlaying ? 'opacity-90 bg-black/45 backdrop-blur-xs' : 'opacity-0 pointer-events-none'
                        }`}
                      >
                        <AudioVisualizer
                          isPlaying={isPlaying}
                          variant={visualizerVariant}
                          analyserNode={analyserNode}
                          color={isDark ? '#DFC589' : '#F3E2B8'}
                        />
                      </div>

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-200">
                        <div className="w-20 h-20 rounded-full bg-[#0D3A2E]/90 dark:bg-[#DFC589]/95 backdrop-blur-sm flex items-center justify-center shadow-xl border border-[#C6A259]/40 transform transition-transform active:scale-95">
                          {isPlaying ? (
                            <Pause size={30} className="text-[#FAF6EC] dark:text-[#041813] fill-current" />
                          ) : (
                            <Play
                              size={30}
                              className="text-[#FAF6EC] dark:text-[#041813] fill-current ml-1"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Speaking Hairline Divider */}
                    <div
                      className={`h-[1.5px] w-full transition-opacity duration-300 ${
                        isPlaying
                          ? 'bg-gradient-to-r from-transparent via-[#DFC589] to-transparent opacity-100'
                          : 'bg-[#D9CEB8]/80 dark:bg-[#C6A259]/20 opacity-100'
                      }`}
                    />

                    <div className="h-[46%] sm:h-[44%] p-6 flex flex-col justify-between bg-[#FAF6EC]/95 dark:bg-[#092E24]/95 relative z-30">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#7D602D] dark:text-[#C6A259] truncate">
                          {translateGender(voice.analysis.gender)} · {translatePitch(voice.pitch)} {t.pitchSuffix}
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] tracking-tight truncate leading-snug mt-1">
                          {displayName}
                        </h2>
                        {voice.characterProfile?.title && (
                          <p className="text-xs sm:text-sm font-medium text-[#7D602D] dark:text-[#DFC589] truncate mt-0.5">
                            {voice.characterProfile.title[language] || voice.characterProfile.title.mm}
                          </p>
                        )}
                        {subLabel && (
                          <p className="text-xs font-medium text-[#5B7469] dark:text-[#8DA399] truncate mt-0.5">
                            {subLabel}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-xs sm:text-sm text-[#2B463B] dark:text-[#C5D1CA] font-light leading-relaxed line-clamp-2">
                          {voice.analysis.characteristics.join(', ')}
                        </p>
                        <div className="w-full h-px bg-[#D9CEB8]/70 dark:bg-[#C6A259]/20"></div>
                        {/* Clean Editorial Metadata Row */}
                        <div
                          className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]"
                          aria-label={t.voiceTagsLabel}
                        >
                          <span
                            title={t.pitchRangeTagLabel}
                            className="inline-flex items-center gap-1 font-mono font-medium text-[#7D602D] dark:text-[#DFC589] tabular-nums whitespace-nowrap"
                          >
                            <Gauge size={11} className="shrink-0 opacity-85" />
                            <span>{getVoicePitchHzRange(voice).label}</span>
                          </span>
                          <span className="text-[#B49049]/60 dark:text-[#C6A259]/40" aria-hidden="true">·</span>
                          <span
                            title={t.emotionalToneTagLabel}
                            className="inline-flex items-center gap-1 font-medium text-[#145240] dark:text-[#9EB5AC] truncate max-w-[165px]"
                          >
                            <Sparkles size={11} className="shrink-0 opacity-80 text-[#9C7A3C] dark:text-[#C6A259]" />
                            <span className="truncate">{translateTone(getVoiceEmotionalTone(voice))}</span>
                          </span>
                          {voice.transcript?.trim() && (
                            <>
                              <span className="text-[#B49049]/60 dark:text-[#C6A259]/40" aria-hidden="true">·</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (disabled) return;
                                  if (isActive) {
                                    onEditCharacter?.(voice);
                                  } else {
                                    onChange(index);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
                                }}
                                tabIndex={isActive && !disabled ? 0 : -1}
                                title={voice.transcript.trim()}
                                className="inline-flex items-center gap-1 font-medium text-[#7D602D] dark:text-[#DFC589] hover:underline whitespace-nowrap"
                              >
                                <FileText size={11} className="shrink-0" />
                                <span>{t.transcriptSavedBadge}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Carousel3D;