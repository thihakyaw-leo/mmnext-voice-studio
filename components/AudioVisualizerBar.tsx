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
        voice.characterName
          ? language === 'en' && voice.characterName.en && voice.characterName.en !== voice.name
            ? voice.characterName.en
            : voice.name
          : null,
        voice.characterName && language === 'en' && voice.characterName.en && voice.characterName.en !== voice.name
          ? voice.name
          : null,
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
        voiceLabel={
          voice
            ? voice.characterName?.mm
              ? `${voice.characterName.mm} (${voice.name})`
              : voice.name
            : t.audioVisualizer
        }
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
            className="fixed bottom-0 inset-x-0 z-40 h-14 sm:h-16 bg-[#FAF6EC]/94 dark:bg-[#06231B]/94 backdrop-blur-xl border-t border-[#D9CEB8] dark:border-[#C6A259]/25 shadow-[0_-8px_30px_rgba(6,35,27,0.08)] dark:shadow-[0_-8px_30px_rgba(2,14,11,0.65)]"
          >
            {/* Real-time playback progress hairline */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-[#EBE2CE] dark:bg-[#041813] overflow-hidden pointer-events-none">
              <div
                className="h-full w-full origin-left bg-[#114637] dark:bg-gradient-to-r dark:from-[#9C7A3C] dark:via-[#EAD7A4] dark:to-[#DFC589] transition-transform duration-150 ease-linear"
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
                  className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-40 border ${
                    isPlaying
                      ? 'bg-[#0D3A2E] dark:bg-[#DFC589] border-[#B49049]/40 text-[#FAF6EC] dark:text-[#041813] shadow-sm'
                      : 'bg-[#145240] dark:bg-[#114637] border-[#C6A259]/30 text-[#FAF6EC] dark:text-[#EAD7A4] hover:bg-[#0D3A2E] dark:hover:bg-[#195E4A]'
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
                          ? 'text-[#7D602D] dark:text-[#DFC589]'
                          : 'text-[#5B7469] dark:text-[#8DA399]'
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] truncate">
                      {displayName}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5B7469] dark:text-[#8DA399] truncate">
                    {metaText}
                  </p>
                </div>
              </div>

              {/* Center: Live Amplitude AudioVisualizer Canvas */}
              <div className="flex-1 h-9 sm:h-11 min-w-[68px] rounded-xl bg-[#F4EDE0]/95 dark:bg-[#041813]/90 border border-[#D9CEB8]/90 dark:border-[#C6A259]/20 px-2 overflow-hidden flex items-center">
                <AudioVisualizer
                  isPlaying={isPlaying}
                  variant={variant}
                  analyserNode={analyserNode}
                  color={isDark ? '#DFC589' : '#114637'}
                />
              </div>

              {/* Right: Live Pitch Readout + Pitch/Frequency Panel Toggle + Mode Switcher + Close */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {voice && (
                  <span className="hidden xl:inline-block text-xs font-mono tabular-nums text-[#5B7469] dark:text-[#8DA399] whitespace-nowrap">
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
                      ? 'bg-[#0D3A2E] dark:bg-[#DFC589] border-[#B49049]/50 dark:border-[#DFC589] text-[#FAF6EC] dark:text-[#041813] shadow-sm'
                      : 'bg-[#FAF6EC]/90 dark:bg-[#092E24] border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637]'
                  }`}
                >
                  <Gauge size={13} className={isPlaying && !isPitchPanelOpen ? 'text-[#2E8267] dark:text-[#DFC589]' : ''} />
                  <span className="font-mono tabular-nums">
                    {livePitchLabel || t.pitchButtonLabel}
                  </span>
                </button>

                {/* Desktop Mode Switcher */}
                <div
                  className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg bg-[#EBE2CE]/80 dark:bg-[#041813]/85 border border-[#D9CEB8] dark:border-[#C6A259]/20"
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
                          ? 'bg-[#FAF6EC] dark:bg-[#114637] text-[#06231B] dark:text-[#EAD7A4] shadow-sm'
                          : 'text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC]'
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
                  className="sm:hidden p-2 rounded-lg bg-[#EBE2CE]/80 dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4]"
                >
                  {modes.find((m) => m.id === variant)?.icon}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.closeAudioVisualizer}
                  title={t.closeAudioVisualizer}
                  className="p-1.5 sm:p-2 rounded-full text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors"
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
