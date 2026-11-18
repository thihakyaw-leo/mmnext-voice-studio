/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Play,
  Pause,
  Square,
  ArrowLeftRight,
  Shuffle,
  Heart,
  ChevronDown,
  Activity,
  Volume2,
  Columns2,
  Share2,
} from 'lucide-react';
import { Voice } from '../types';
import AudioVisualizer, { VisualizerVariant } from './AudioVisualizer';
import { useI18n } from '../i18n';

export type CompareSequencePhase = 'idle' | 'playing-a' | 'gap' | 'playing-b';

interface CompareViewProps {
  allVoices: Voice[];
  voiceAName: string;
  voiceBName: string;
  onChangeVoiceA: (voiceName: string) => void;
  onChangeVoiceB: (voiceName: string) => void;
  onSwapVoices: () => void;
  onRandomPair: () => void;
  playingVoice: string | null;
  sequencePhase: CompareSequencePhase;
  activeSingleSlot: 'a' | 'b' | null;
  onPlaySequential: () => void;
  onStopComparison: () => void;
  onPlaySingle: (voiceName: string, slot: 'a' | 'b') => void;
  favorites: string[];
  onToggleFavorite: (voiceName: string) => void;
  onSharePair?: (voiceA: Voice, voiceB: Voice) => void;
  visualizerVariant?: VisualizerVariant;
  analyserNode?: AnalyserNode | null;
}

const CompareView: React.FC<CompareViewProps> = ({
  allVoices,
  voiceAName,
  voiceBName,
  onChangeVoiceA,
  onChangeVoiceB,
  onSwapVoices,
  onRandomPair,
  playingVoice,
  sequencePhase,
  activeSingleSlot,
  onPlaySequential,
  onStopComparison,
  onPlaySingle,
  favorites,
  onToggleFavorite,
  onSharePair,
  visualizerVariant = 'wave',
  analyserNode = null,
}) => {
  const { t, language, translateGender, translatePitch } = useI18n();
  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const voiceA = allVoices.find((v) => v.name === voiceAName) || allVoices[0];
  const voiceB = allVoices.find((v) => v.name === voiceBName) || allVoices[1] || allVoices[0];

  const isSequencing = sequencePhase !== 'idle';
  const isSlotAPlaying =
    sequencePhase === 'playing-a' ||
    (sequencePhase === 'idle' &&
      playingVoice === voiceA?.name &&
      (activeSingleSlot === 'a' || activeSingleSlot === null));
  const isSlotBPlaying =
    sequencePhase === 'playing-b' ||
    (sequencePhase === 'idle' &&
      playingVoice === voiceB?.name &&
      (activeSingleSlot === 'b' || (activeSingleSlot === null && voiceA?.name !== voiceB?.name)));

  const statusText =
    sequencePhase === 'playing-a'
      ? t.playingVoiceA
      : sequencePhase === 'gap'
      ? t.upNextVoiceB
      : sequencePhase === 'playing-b'
      ? t.playingVoiceB
      : null;

  const sameGender = voiceA && voiceB && voiceA.analysis.gender === voiceB.analysis.gender;
  const samePitch = voiceA && voiceB && voiceA.pitch === voiceB.pitch;

  const renderSlotCard = (
    slot: 'a' | 'b',
    voice: Voice | undefined,
    selectedName: string,
    onSelectChange: (name: string) => void,
    isSlotPlaying: boolean,
    isSlotQueued: boolean
  ) => {
    if (!voice) return null;
    const isFavorite = favorites.includes(voice.name);
    const displayName = voice.characterName?.mm || voice.name;
    const subLabel =
      language === 'en' && voice.characterName
        ? `${voice.characterName.en} · ${voice.name}`
        : voice.name;
    const slotLabel = slot === 'a' ? t.voiceSlotA : t.voiceSlotB;
    const badgeLetter = slot === 'a' ? 'A' : 'B';

    return (
      <div
        className={`rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col bg-white/95 dark:bg-zinc-800/95 ${
          isSlotPlaying
            ? 'border-zinc-600 dark:border-indigo-500 ring-2 ring-zinc-400/50 dark:ring-indigo-500/30 shadow-xl'
            : isSlotQueued
            ? 'border-zinc-400 dark:border-indigo-700/70 shadow-md'
            : 'border-zinc-300/70 dark:border-zinc-700 shadow-sm'
        }`}
      >
        {/* Slot Top Header & Library Voice Picker */}
        <div className="p-4 sm:p-5 bg-[#FDF7EB]/90 dark:bg-zinc-900/60 border-b border-zinc-300/60 dark:border-zinc-700/80 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                  isSlotPlaying
                    ? 'bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white'
                    : 'bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200'
                }`}
              >
                {badgeLetter}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 truncate">
                {slotLabel}
              </span>
              {isSlotPlaying && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full animate-google-colors" />
                  {t.speakingNow}
                </span>
              )}
              {isSlotQueued && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium">
                  {t.upNextVoiceB}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onToggleFavorite(voice.name)}
              aria-label={`${isFavorite ? t.removeFromFavorites : t.saveToFavorites}: ${displayName}`}
              aria-pressed={isFavorite}
              title={isFavorite ? t.removeFromFavorites : t.saveToFavorites}
              className={`p-2 rounded-full border transition-all shrink-0 ${
                isFavorite
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-500'
                  : 'bg-white/85 dark:bg-zinc-800 border-zinc-300/70 dark:border-zinc-700 text-zinc-400 hover:text-rose-500'
              }`}
            >
              <Heart size={15} className={isFavorite ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Select Dropdown from Library */}
          <div className="relative">
            <select
              value={selectedName}
              onChange={(e) => onSelectChange(e.target.value)}
              aria-label={slotLabel}
              className="appearance-none w-full bg-white/90 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 py-2.5 pl-3.5 pr-9 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-300/60 dark:focus:ring-indigo-900 cursor-pointer transition-all hover:border-zinc-400 dark:hover:border-zinc-600"
            >
              {allVoices.map((v) => {
                const labelName = v.characterName?.mm
                  ? `${v.characterName.mm} (${v.name})`
                  : v.name;
                return (
                  <option key={v.name} value={v.name}>
                    {labelName} · {translateGender(v.analysis.gender)} · {translatePitch(v.pitch)}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-500">
              <ChevronDown size={15} />
            </div>
          </div>
        </div>

        {/* Visualizer / Play Surface */}
        <div
          onClick={() => onPlaySingle(voice.name, slot)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onPlaySingle(voice.name, slot);
            }
          }}
          aria-label={`${isSlotPlaying ? t.pauseSample : t.playSample}: ${displayName}`}
          className="relative h-36 sm:h-44 bg-[#F7F1E5] dark:bg-zinc-900 flex items-center justify-center overflow-hidden cursor-pointer group border-b border-zinc-200/80 dark:border-zinc-700/80"
        >
          <div
            className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]"
            style={{
              backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
              backgroundSize: '10px 10px',
            }}
          />

          <div
            className={`absolute inset-0 z-10 transition-opacity duration-300 ${
              isSlotPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <AudioVisualizer
              isPlaying={isSlotPlaying}
              variant={visualizerVariant}
              analyserNode={analyserNode}
              color={isDark ? '#a5b4fc' : '#27272a'}
            />
          </div>

          <div
            className={`relative z-20 flex flex-col items-center gap-2 transition-all duration-200 ${
              isSlotPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-zinc-800 dark:bg-zinc-100 text-[#FDF7EB] dark:text-zinc-900 flex items-center justify-center shadow-lg group-hover:scale-105 active:scale-95 transition-transform">
              {isSlotPlaying ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} className="ml-0.5" fill="currentColor" />
              )}
            </div>
            {!isSlotPlaying && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <Activity size={12} />
                <span>{t.playSample}</span>
              </span>
            )}
          </div>
        </div>

        {/* Voice Metadata & Traits */}
        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-serif font-semibold text-zinc-800 dark:text-white tracking-tight truncate">
              {displayName}
            </h3>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {subLabel}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#F7F1E5]/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-700/70">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                {t.genderLabel}
              </p>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
                {translateGender(voice.analysis.gender)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F7F1E5]/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-700/70">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                {t.pitchLabel}
              </p>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
                {translatePitch(voice.pitch)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-2">
              {t.characteristicsLabel}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {voice.analysis.characteristics.map((trait) => (
                <span
                  key={trait}
                  className="px-2.5 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-700/70 border border-zinc-300/60 dark:border-zinc-600 text-xs text-zinc-700 dark:text-zinc-200"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:py-10 space-y-6">
        {/* Header + Sequential Controls */}
        <div className="rounded-3xl bg-[#FDF7EB]/90 dark:bg-zinc-900/80 border border-zinc-300/70 dark:border-zinc-800 p-5 sm:p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-zinc-600 dark:text-indigo-400">
                <Columns2 size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">{t.compareView}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-zinc-800 dark:text-white tracking-tight">
                {t.compareTitle}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                {t.compareSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={isSequencing ? onStopComparison : onPlaySequential}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium shadow-md transition-all active:scale-95 ${
                  isSequencing
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-zinc-800 dark:bg-indigo-600 hover:bg-zinc-700 dark:hover:bg-indigo-500 text-[#FDF7EB] dark:text-white'
                }`}
              >
                {isSequencing ? (
                  <>
                    <Square size={15} className="fill-current" />
                    <span>{t.stopComparison}</span>
                  </>
                ) : (
                  <>
                    <Play size={15} className="fill-current" />
                    <span>{t.playSequential}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onSwapVoices}
                title={t.swapVoices}
                aria-label={t.swapVoices}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-medium bg-white/85 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors active:scale-95"
              >
                <ArrowLeftRight size={14} />
                <span className="hidden sm:inline">{t.swapVoices}</span>
              </button>

              <button
                type="button"
                onClick={onRandomPair}
                title={t.randomPair}
                aria-label={t.randomPair}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-medium bg-white/85 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors active:scale-95"
              >
                <Shuffle size={14} />
                <span className="hidden sm:inline">{t.randomPair}</span>
              </button>

              {onSharePair && voiceA && voiceB && (
                <button
                  type="button"
                  onClick={() => onSharePair(voiceA, voiceB)}
                  title={t.shareCompare}
                  aria-label={t.shareCompare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-medium bg-white/85 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors active:scale-95"
                >
                  <Share2 size={14} />
                  <span className="hidden sm:inline">{t.shareCompare}</span>
                </button>
              )}
            </div>
          </div>

          {/* Live Sequential Status Bar */}
          {statusText && (
            <div className="mt-4 pt-3 border-t border-zinc-300/60 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-200">
                <Volume2 size={14} className="text-zinc-700 dark:text-indigo-400 animate-pulse" />
                <span>{statusText}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-8 rounded-full transition-colors ${
                    sequencePhase === 'playing-a'
                      ? 'bg-zinc-800 dark:bg-indigo-500'
                      : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                />
                <span
                  className={`h-2 w-8 rounded-full transition-colors ${
                    sequencePhase === 'playing-b'
                      ? 'bg-zinc-800 dark:bg-indigo-500'
                      : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Side-by-Side Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {renderSlotCard(
            'a',
            voiceA,
            voiceAName,
            onChangeVoiceA,
            isSlotAPlaying,
            false
          )}
          {renderSlotCard(
            'b',
            voiceB,
            voiceBName,
            onChangeVoiceB,
            isSlotBPlaying,
            sequencePhase === 'gap'
          )}
        </div>

        {/* Quick Trait Summary Bar */}
        {voiceA && voiceB && (
          <div className="rounded-2xl bg-[#F7F1E5]/90 dark:bg-zinc-900/70 border border-zinc-300/70 dark:border-zinc-800 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t.traitComparison}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">{t.genderLabel}:</span>
                <span className="font-semibold">
                  {sameGender ? t.sameTrait : t.differentTrait}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                <span className="font-medium">{t.pitchLabel}:</span>
                <span className="font-semibold">
                  {samePitch ? t.sameTrait : t.differentTrait}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareView;
