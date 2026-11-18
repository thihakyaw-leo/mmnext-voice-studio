/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Voice } from '../types';
import { Play, Pause, Activity, ChevronLeft, ChevronRight, Heart, Columns2, Gauge, Sparkles, Share2 } from 'lucide-react';
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
  visualizerVariant?: VisualizerVariant;
  analyserNode?: AnalyserNode | null;
  disabled?: boolean;
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
  visualizerVariant = 'wave',
  analyserNode = null,
  disabled = false,
}) => {
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

  return (
    <div ref={wrapperRef} className="relative w-full h-full flex items-center justify-center">
      {/* Navigation Arrows */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 sm:px-12 z-50 pointer-events-none">
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0 || disabled}
          className={`p-4 rounded-full bg-[#FDF7EB]/85 dark:bg-zinc-800/80 backdrop-blur-md shadow-lg border border-zinc-300/70 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-200 transition-all hover:scale-110 active:scale-95 pointer-events-auto ${
            activeIndex === 0 ? 'opacity-0 cursor-default' : 'opacity-100 hover:bg-[#FDF7EB] dark:hover:bg-zinc-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={t.previousVoice}
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={handleNext}
          disabled={activeIndex >= voices.length - 1 || disabled}
          className={`p-4 rounded-full bg-[#FDF7EB]/85 dark:bg-zinc-800/80 backdrop-blur-md shadow-lg border border-zinc-300/70 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-200 transition-all hover:scale-110 active:scale-95 pointer-events-auto ${
            activeIndex >= voices.length - 1
              ? 'opacity-0 cursor-default'
              : 'opacity-100 hover:bg-[#FDF7EB] dark:hover:bg-zinc-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={t.nextVoice}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-[76vh] sm:h-[70vh] flex items-center justify-center"
        style={{ perspective: '1200px' }}
      >
        <div className="relative w-full h-full flex items-center justify-center transform-style-3d">
          <AnimatePresence initial={false}>
            {voices.map((voice, index) => {
              if (Math.abs(index - activeIndex) > visibleRange) return null;

              const isActive = index === activeIndex;
              const offset = index - activeIndex;
              const isPlaying = playingVoice === voice.name;
              const isFavorite = favorites.includes(voice.name);
              const compareIdx = compareVoices.indexOf(voice.name);
              const compareSlot = compareIdx === 0 ? 'A' : compareIdx === 1 ? 'B' : null;
              const displayName = voice.characterName?.mm || voice.name;
              const subLabel =
                language === 'en' && voice.characterName
                  ? `${voice.characterName.en} · ${voice.name}`
                  : voice.name;

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
                  className={`absolute w-[290px] max-h-[66vh] aspect-[3/5] sm:max-h-none sm:w-[360px] sm:aspect-[3/4] bg-white/95 dark:bg-zinc-800 rounded-3xl border border-zinc-300/70 dark:border-zinc-700 overflow-hidden cursor-pointer ${
                    isActive ? 'shadow-2xl' : 'shadow-lg'
                  }`}
                  style={{ zIndex }}
                  initial={{ scale: 0.8, opacity: 0, x: offset * 200 }}
                  animate={{
                    scale: isActive ? 1 : 0.85,
                    opacity: 1,
                    x,
                    z: isActive ? 0 : -100 - Math.abs(offset) * 30,
                    rotateY: offset * -15,
                    filter: isActive ? 'blur(0px)' : 'blur(0.5px)',
                  }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
                    animate={{ opacity: isActive ? 0 : 0.6 }}
                    className="absolute inset-0 bg-[#FDF7EB] dark:bg-zinc-900 z-40 pointer-events-none"
                  />

                  <div className="h-full flex flex-col relative">
                    <div className="flex-1 relative bg-[#F7F1E5] dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                      <div
                        className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]"
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
                            ? 'bg-rose-50/90 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-500 scale-105'
                            : 'bg-[#FDF7EB]/85 dark:bg-zinc-800/80 border-zinc-300/70 dark:border-zinc-700/70 text-zinc-500 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 hover:scale-105'
                        }`}
                      >
                        <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
                      </button>

                      {/* Top-Right Action Cluster: Share & Compare */}
                      <div className="absolute top-5 right-5 z-30 flex items-center gap-1.5">
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
                            className="h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-200 shadow-sm bg-[#FDF7EB]/85 dark:bg-zinc-800/80 border-zinc-300/70 dark:border-zinc-700/70 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-105"
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
                                ? 'bg-zinc-800 dark:bg-indigo-600 border-zinc-800 dark:border-indigo-500 text-[#FDF7EB] dark:text-white scale-105'
                                : 'bg-[#FDF7EB]/85 dark:bg-zinc-800/80 border-zinc-300/70 dark:border-zinc-700/70 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:scale-105'
                            }`}
                          >
                            <Columns2 size={14} />
                            {compareSlot && <span>{compareSlot}</span>}
                          </button>
                        )}
                      </div>

                      <div
                        className={`absolute inset-0 z-10 transition-opacity duration-500 ${
                          isPlaying ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <AudioVisualizer
                          isPlaying={isPlaying}
                          variant={visualizerVariant}
                          analyserNode={analyserNode}
                          color={
                            document.documentElement.classList.contains('dark')
                              ? '#a5b4fc'
                              : '#27272a'
                          }
                        />
                      </div>

                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
                          isPlaying ? 'opacity-0' : 'opacity-100'
                        }`}
                      >
                        <div className="w-20 h-20 rounded-full bg-[#FDF7EB] dark:bg-zinc-800 shadow-sm border border-zinc-300/60 dark:border-zinc-700 flex items-center justify-center">
                          <Activity size={32} className="text-zinc-400 dark:text-zinc-600" />
                        </div>
                      </div>

                      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <div className="w-20 h-20 rounded-full bg-zinc-800/90 dark:bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl transform transition-transform active:scale-95">
                          {isPlaying ? (
                            <Pause size={32} className="text-[#FDF7EB] dark:text-zinc-900 fill-current" />
                          ) : (
                            <Play
                              size={32}
                              className="text-[#FDF7EB] dark:text-zinc-900 fill-current ml-1"
                            />
                          )}
                        </div>
                      </div>

                      {isPlaying && (
                        <div className="absolute bottom-4 right-5 w-3 h-3 rounded-full animate-google-colors z-30"></div>
                      )}
                    </div>

                    <div className="h-[46%] sm:h-[44%] p-5 sm:p-6 flex flex-col justify-between bg-white/95 dark:bg-zinc-800 relative z-30">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-zinc-800 dark:text-white tracking-tight truncate leading-snug">
                              {displayName}
                            </h2>
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 truncate mt-0.5">
                              {subLabel}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0 pt-1">
                            <span className="px-2.5 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-300/70 dark:border-zinc-600">
                              {translateGender(voice.analysis.gender)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <span className="text-sm text-zinc-600 dark:text-zinc-400 font-light">
                            {translatePitch(voice.pitch)} {t.pitchSuffix}
                          </span>
                          <span className="text-zinc-400 dark:text-zinc-600">•</span>
                          <span className="text-sm text-zinc-600 dark:text-zinc-400 font-light">
                            {voice.analysis.characteristics[0]}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Tags: Pitch Range (Hz) & Emotional Tone */}
                        <div
                          className="flex flex-wrap items-center gap-1.5"
                          aria-label={t.voiceTagsLabel}
                        >
                          <span
                            title={t.pitchRangeTagLabel}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/60 text-[11px] font-mono font-medium text-indigo-700 dark:text-indigo-300 tabular-nums whitespace-nowrap"
                          >
                            <Gauge size={11} className="shrink-0 opacity-80" />
                            <span>{getVoicePitchHzRange(voice).label}</span>
                          </span>
                          <span
                            title={t.emotionalToneTagLabel}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 text-[11px] font-medium text-amber-800 dark:text-amber-300 truncate max-w-full"
                          >
                            <Sparkles size={11} className="shrink-0 opacity-80" />
                            <span className="truncate">{translateTone(getVoiceEmotionalTone(voice))}</span>
                          </span>
                        </div>
                        <div className="w-full h-px bg-zinc-200/80 dark:bg-zinc-700"></div>
                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-500 font-light leading-relaxed line-clamp-2">
                          {voice.analysis.characteristics.join(', ')}
                        </p>
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