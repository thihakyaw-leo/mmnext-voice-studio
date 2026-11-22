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
    const subLabel = voice.characterName
      ? language === 'en' && voice.characterName.en && voice.characterName.en !== voice.name
        ? `${voice.characterName.en} · ${voice.name}`
        : voice.name
      : null;
    const slotLabel = slot === 'a' ? t.voiceSlotA : t.voiceSlotB;
    const badgeLetter = slot === 'a' ? 'A' : 'B';

    return (
      <div
        className={`rounded-3xl border luminous-hairline transition-all duration-300 overflow-hidden flex flex-col bg-[#FAF6EC]/95 dark:bg-[#092E24]/92 ${
          isSlotPlaying
            ? 'luxury-active-bloom border-[#B49049] dark:border-[#DFC589]/70 ring-1 ring-[#C6A259]/35 shadow-xl'
            : isSlotQueued
            ? 'border-[#B49049]/60 dark:border-[#C6A259]/45 shadow-md'
            : 'border-[#D9CEB8]/90 dark:border-[#C6A259]/20 shadow-sm'
        }`}
      >
        {/* Slot Top Header & Library Voice Picker */}
        <div className="p-4 sm:p-5 bg-[#F4EDE0]/90 dark:bg-[#06231B]/90 border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/20 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                  isSlotPlaying
                    ? 'bg-[#0D3A2E] dark:bg-[#DFC589] text-[#FAF6EC] dark:text-[#041813]'
                    : 'bg-[#EBE2CE] dark:bg-[#114637] text-[#06231B] dark:text-[#DFC589]'
                }`}
              >
                {badgeLetter}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7D602D] dark:text-[#C6A259] truncate">
                {slotLabel}
              </span>
              {isSlotPlaying && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#114637] dark:text-[#DFC589] whitespace-nowrap">
                  <Volume2 size={12} className="shrink-0" />
                  <span>{t.speakingNow}</span>
                </span>
              )}
              {isSlotQueued && (
                <span className="text-[11px] font-medium text-[#5B7469] dark:text-[#8DA399] whitespace-nowrap">
                  · {t.upNextVoiceB}
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
                  ? 'bg-[#EBE2CE] dark:bg-[#114637] border-[#B49049] dark:border-[#DFC589]/60 text-[#7D602D] dark:text-[#DFC589]'
                  : 'bg-[#FAF6EC]/85 dark:bg-[#041813]/70 border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#5B7469] dark:text-[#8DA399] hover:text-[#7D602D] dark:hover:text-[#DFC589]'
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
              className="appearance-none w-full bg-[#FAF6EC] dark:bg-[#041813]/85 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#FAF6EC] py-2.5 pl-3.5 pr-9 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#B49049]/40 dark:focus:ring-[#DFC589]/40 cursor-pointer transition-all hover:border-[#B49049] dark:hover:border-[#DFC589]/50"
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
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#7D602D] dark:text-[#C6A259]">
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
          className="relative h-36 sm:h-44 bg-[#041813] flex items-center justify-center overflow-hidden cursor-pointer group border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/20"
        >
          {/* 3D Realistic Character Portrait in Myanmar Traditional Attire */}
          {voice.imageUrl && (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={voice.imageUrl}
                alt={`${displayName} Myanmar traditional attire`}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/30 pointer-events-none" />
              <div className="absolute bottom-2 left-3 z-20 flex items-center gap-1.5 pointer-events-none">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-xs text-[#DFC589] border border-[#DFC589]/30">
                  3D Realistic
                </span>
                {voice.characterProfile?.title && (
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#041913]/70 backdrop-blur-xs text-[#FAF6EC] border border-white/10 truncate max-w-[170px]">
                    {voice.characterProfile.title[language] || voice.characterProfile.title.mm}
                  </span>
                )}
              </div>
            </div>
          )}

          <div
            className={`absolute inset-0 z-10 transition-opacity duration-300 ${
              isSlotPlaying ? 'opacity-90 bg-black/45 backdrop-blur-xs' : 'opacity-0 pointer-events-none'
            }`}
          >
            <AudioVisualizer
              isPlaying={isSlotPlaying}
              variant={visualizerVariant}
              analyserNode={analyserNode}
              color={isDark ? '#DFC589' : '#F3E2B8'}
            />
          </div>

          <div
            className={`relative z-20 flex flex-col items-center gap-2 transition-all duration-200 ${
              isSlotPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-[#0D3A2E] dark:bg-[#DFC589] text-[#FAF6EC] dark:text-[#041813] border border-[#C6A259]/40 flex items-center justify-center shadow-lg group-hover:scale-105 active:scale-95 transition-transform">
              {isSlotPlaying ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} className="ml-0.5" fill="currentColor" />
              )}
            </div>
            {!isSlotPlaying && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5B7469] dark:text-[#9EB5AC]">
                <Activity size={12} />
                <span>{t.playSample}</span>
              </span>
            )}
          </div>
        </div>

        {/* Voice Metadata & Traits */}
        <div className="p-6 flex-1 flex flex-col justify-between gap-5">
          <div>
            <h3 className="text-xl sm:text-2xl font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] tracking-tight truncate">
              {displayName}
            </h3>
            {subLabel && (
              <p className="text-xs font-medium text-[#5B7469] dark:text-[#8DA399] truncate mt-0.5">
                {subLabel}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#D9CEB8]/70 dark:border-[#C6A259]/18">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7D602D] dark:text-[#C6A259]">
                {t.genderLabel}
              </p>
              <p className="text-sm font-medium text-[#06231B] dark:text-[#FAF6EC] mt-1">
                {translateGender(voice.analysis.gender)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7D602D] dark:text-[#C6A259]">
                {t.pitchLabel}
              </p>
              <p className="text-sm font-medium text-[#06231B] dark:text-[#FAF6EC] mt-1">
                {translatePitch(voice.pitch)}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D9CEB8]/70 dark:border-[#C6A259]/18">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7D602D] dark:text-[#C6A259] mb-1.5">
              {t.characteristicsLabel}
            </p>
            <p className="text-xs sm:text-sm text-[#2B463B] dark:text-[#C5D1CA] font-light leading-relaxed">
              {voice.analysis.characteristics.join(' · ')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 pt-24 pb-16 lg:py-12 space-y-6">
        {/* Header + Sequential Controls */}
        <div className="rounded-3xl bg-[#FAF6EC]/92 dark:bg-[#06231B]/90 border border-[#D9CEB8] dark:border-[#C6A259]/25 luminous-hairline p-5 sm:p-6 shadow-sm backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-[#7D602D] dark:text-[#DFC589]">
                <Columns2 size={15} />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em]">{t.compareView}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] tracking-tight">
                {t.compareTitle}
              </h2>
              <p className="text-xs sm:text-sm text-[#5B7469] dark:text-[#8DA399]">
                {t.compareSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={isSequencing ? onStopComparison : onPlaySequential}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium shadow-md transition-all active:scale-95 border ${
                  isSequencing
                    ? 'bg-rose-700 hover:bg-rose-600 border-rose-500/40 text-white'
                    : 'bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 border-[#B49049]/40 text-[#FAF6EC] dark:text-[#041813]'
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-medium bg-[#FAF6EC]/90 dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors active:scale-95"
              >
                <ArrowLeftRight size={14} />
                <span className="hidden sm:inline">{t.swapVoices}</span>
              </button>

              <button
                type="button"
                onClick={onRandomPair}
                title={t.randomPair}
                aria-label={t.randomPair}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-medium bg-[#FAF6EC]/90 dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors active:scale-95"
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-medium bg-[#FAF6EC]/90 dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:text-[#7D602D] dark:hover:text-[#DFC589] transition-colors active:scale-95"
                >
                  <Share2 size={14} />
                  <span className="hidden sm:inline">{t.shareCompare}</span>
                </button>
              )}
            </div>
          </div>

          {/* Live Sequential Status Bar */}
          {statusText && (
            <div className="mt-4 pt-3 border-t border-[#D9CEB8]/70 dark:border-[#C6A259]/20 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-medium text-[#06231B] dark:text-[#FAF6EC]">
                <Volume2 size={14} className="text-[#7D602D] dark:text-[#DFC589]" />
                <span>{statusText}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    sequencePhase === 'playing-a'
                      ? 'bg-[#0D3A2E] dark:bg-[#DFC589]'
                      : 'bg-[#D9CEB8] dark:bg-[#114637]'
                  }`}
                />
                <span
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    sequencePhase === 'playing-b'
                      ? 'bg-[#0D3A2E] dark:bg-[#DFC589]'
                      : 'bg-[#D9CEB8] dark:bg-[#114637]'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Side-by-Side Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7">
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
          <div className="rounded-2xl bg-[#F4EDE0]/90 dark:bg-[#06231B]/85 border border-[#D9CEB8] dark:border-[#C6A259]/20 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7D602D] dark:text-[#C6A259]">
              {t.traitComparison}
            </span>
            <div className="flex flex-wrap items-center gap-3 text-[#2B463B] dark:text-[#C5D1CA]">
              <span>
                <span className="font-medium text-[#5B7469] dark:text-[#8DA399]">{t.genderLabel}:</span>{' '}
                <span className="font-semibold text-[#06231B] dark:text-[#FAF6EC]">
                  {sameGender ? t.sameTrait : t.differentTrait}
                </span>
              </span>
              <span className="text-[#B49049]/60 dark:text-[#C6A259]/40" aria-hidden="true">·</span>
              <span>
                <span className="font-medium text-[#5B7469] dark:text-[#8DA399]">{t.pitchLabel}:</span>{' '}
                <span className="font-semibold text-[#06231B] dark:text-[#FAF6EC]">
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
