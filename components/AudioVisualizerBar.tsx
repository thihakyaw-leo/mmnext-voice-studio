/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  X,
  AudioLines,
  BarChart3,
  Activity,
  Waves,
  Gauge,
} from 'lucide-react';
import { Voice } from '../types';
import AudioVisualizer, { VisualizerVariant } from './AudioVisualizer';
import PitchFrequencyPanel from './PitchFrequencyPanel';
import { detectPitchAutocorrelation, frequencyToNote } from '../utils/pitchDetection';
import { useI18n } from '../i18n';

interface AudioVisualizerBarProps {
  isOpen: boolean;
  voice: Voice | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  variant: VisualizerVariant;
  analyserNode: AnalyserNode | null;
  isPitchPanelOpen: boolean;
  onTogglePitchPanel: () => void;
  onChangeVariant: (variant: VisualizerVariant) => void;
  onPlayToggle: (voiceName: string) => void;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const totalSec = Math.floor(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const AudioVisualizerBar: React.FC<AudioVisualizerBarProps> = ({
  isOpen,
  voice,
  isPlaying,
  currentTime,
  duration,
  variant,
  analyserNode,
  isPitchPanelOpen,
  onTogglePitchPanel,
  onChangeVariant,
  onPlayToggle,
  onClose,
}) => {
  const { t, language, translateGender, translatePitch } = useI18n();
  const [livePitchLabel, setLivePitchLabel] = useState<string | null>(null);
  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // Lightweight live pitch readout in the compact bar (~12Hz update)
  useEffect(() => {
    if (!isOpen || !isPlaying || !analyserNode) {
      setLivePitchLabel(null);
      return;
    }

    const buf = new Float32Array(analyserNode.fftSize);
    let rafId = 0;
    let lastCheck = 0;

    const tick = (now: number) => {
      if (now - lastCheck > 80) {
        lastCheck = now;
        analyserNode.getFloatTimeDomainData(buf);
        const sampleRate = analyserNode.context?.sampleRate || 48000;
        const { frequency } = detectPitchAutocorrelation(buf, sampleRate);
        if (frequency) {
          const note = frequencyToNote(frequency);
          setLivePitchLabel(`${Math.round(frequency)} Hz · ${note.label}`);
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, isPlaying, analyserNode]);

  const progress =
    duration > 0 && Number.isFinite(duration)
      ? Math.min(1, Math.max(0, currentTime / duration))
      : 0;

  const displayName = voice ? voice.characterName?.mm || voice.name : t.audioVisualizer;
  const metaText = voice
    ? [
        language === 'en' && voice.characterName ? voice.characterName.en : null,
        voice.name,
        translateGender(voice.analysis.gender),
        translatePitch(voice.pitch),
      ]
        .filter(Boolean)
        .join(' · ')
    : t.readyToPlay;

  const modes: { id: VisualizerVariant; label: string; icon: React.ReactNode }[] = [
    { id: 'wave', label: t.visualizerWave, icon: <Waves size={13} /> },
    { id: 'bars', label: t.visualizerBars, icon: <BarChart3 size={13} /> },
    { id: 'mirror', label: t.visualizerMirror, icon: <Activity size={13} /> },
  ];

  const cycleVariant = () => {
    const order: VisualizerVariant[] = ['wave', 'bars', 'mirror'];
    const idx = order.indexOf(variant);
    onChangeVariant(order[(idx + 1) % order.length]);
  };

  return (
    <>
      <PitchFrequencyPanel
        isOpen={isOpen && isPitchPanelOpen}
        isPlaying={isPlaying}
        analyserNode={analyserNode}
        visualizerVariant={variant}
        voiceLabel={voice ? `${displayName} (${voice.name})` : t.audioVisualizer}
        onClose={onTogglePitchPanel}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            aria-label={t.audioVisualizer}
            className="fixed bottom-0 inset-x-0 z-40 h-14 sm:h-16 bg-[#FDF7EB]/94 dark:bg-zinc-900/94 backdrop-blur-xl border-t border-zinc-300/75 dark:border-zinc-800 shadow-[0_-8px_30px_rgba(24,24,27,0.06)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.45)]"
          >
            {/* Real-time playback progress hairline */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-zinc-200/70 dark:bg-zinc-800 overflow-hidden pointer-events-none">
              <div
                className="h-full w-full origin-left bg-zinc-800 dark:bg-indigo-500 transition-transform duration-150 ease-linear"
                style={{ transform: `scaleX(${isPlaying || progress > 0 ? progress : 0})` }}
              />
            </div>

            <div className="max-w-[1800px] mx-auto h-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
              {/* Left: Play/Pause + Voice Identity */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0 max-w-[38%] sm:max-w-[260px]">
                <button
                  type="button"
                  disabled={!voice}
                  onClick={() => voice && onPlayToggle(voice.name)}
                  aria-label={
                    voice
                      ? `${isPlaying ? t.pauseSample : t.playSample}: ${displayName}`
                      : t.playSample
                  }
                  className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-40 ${
                    isPlaying
                      ? 'bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white shadow-sm'
                      : 'bg-zinc-700 dark:bg-zinc-100 text-[#FDF7EB] dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'
                  }`}
                >
                  {isPlaying ? (
                    <Pause size={15} fill="currentColor" />
                  ) : (
                    <Play size={15} className="ml-0.5" fill="currentColor" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AudioLines
                      size={13}
                      className={`shrink-0 ${
                        isPlaying
                          ? 'text-zinc-800 dark:text-indigo-400'
                          : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-white truncate">
                      {displayName}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {metaText}
                  </p>
                </div>
              </div>

              {/* Center: Live Amplitude AudioVisualizer Canvas */}
              <div className="flex-1 h-9 sm:h-11 min-w-[68px] rounded-xl bg-[#F5EFE2]/90 dark:bg-zinc-950/70 border border-zinc-300/60 dark:border-zinc-800 px-2 overflow-hidden flex items-center">
                <AudioVisualizer
                  isPlaying={isPlaying}
                  variant={variant}
                  analyserNode={analyserNode}
                  color={isDark ? '#a5b4fc' : '#27272a'}
                />
              </div>

              {/* Right: Live Pitch Readout + Pitch/Frequency Panel Toggle + Mode Switcher + Close */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {voice && (
                  <span className="hidden xl:inline-block text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                )}

                {/* Interactive Pitch & Frequency Graph Toggle Button */}
                <button
                  type="button"
                  onClick={onTogglePitchPanel}
                  aria-pressed={isPitchPanelOpen}
                  title={t.pitchAnalyzerTitle}
                  aria-label={t.pitchAnalyzerTitle}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    isPitchPanelOpen
                      ? 'bg-zinc-800 dark:bg-indigo-600 border-zinc-800 dark:border-indigo-500 text-[#FDF7EB] dark:text-white shadow-sm'
                      : 'bg-white/85 dark:bg-zinc-800 border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Gauge size={13} className={isPlaying && !isPitchPanelOpen ? 'text-emerald-600 dark:text-emerald-400' : ''} />
                  <span className="font-mono tabular-nums">
                    {livePitchLabel || t.pitchButtonLabel}
                  </span>
                </button>

                {/* Desktop Mode Switcher */}
                <div
                  className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700"
                  role="group"
                  aria-label={t.audioVisualizer}
                >
                  {modes.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onChangeVariant(m.id)}
                      aria-pressed={variant === m.id}
                      title={m.label}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                        variant === m.id
                          ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {m.icon}
                      <span className="hidden lg:inline">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Mobile Compact Mode Cycle Button */}
                <button
                  type="button"
                  onClick={cycleVariant}
                  title={modes.find((m) => m.id === variant)?.label || t.audioVisualizer}
                  aria-label={modes.find((m) => m.id === variant)?.label || t.audioVisualizer}
                  className="sm:hidden p-2 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
                >
                  {modes.find((m) => m.id === variant)?.icon}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.closeAudioVisualizer}
                  title={t.closeAudioVisualizer}
                  className="p-1.5 sm:p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default AudioVisualizerBar;
