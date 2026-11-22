/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Voice } from '../types';
import VoiceCard from './VoiceCard';
import { VisualizerVariant } from './AudioVisualizer';

interface GridViewProps {
  voices: Voice[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
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
}

const GridView: React.FC<GridViewProps> = ({
  voices,
  activeIndex,
  onSelectIndex,
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
}) => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevIndexRef = useRef<number>(activeIndex);

  useEffect(() => {
    if (prevIndexRef.current !== activeIndex) {
      prevIndexRef.current = activeIndex;
      const el = cardRefs.current[activeIndex];
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-10 pt-24 pb-16 lg:py-16">
        <div
          data-voice-grid="true"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-7"
        >
          {voices.map((voice, index) => {
            const compareIdx = compareVoices.indexOf(voice.name);
            const compareSlot = compareIdx === 0 ? 'A' : compareIdx === 1 ? 'B' : null;
            return (
              <VoiceCard
                key={voice.name}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                voice={voice}
                isPlaying={playingVoice === voice.name}
                isSelected={index === activeIndex}
                onSelect={() => onSelectIndex(index)}
                onPlayToggle={onPlayToggle}
                isFavorite={favorites.includes(voice.name)}
                onToggleFavorite={onToggleFavorite}
                compareSlot={compareSlot}
                onToggleCompare={onToggleCompare}
                onShare={onShare}
                onEditCharacter={onEditCharacter}
                visualizerVariant={visualizerVariant}
                analyserNode={analyserNode}
              />
            );
          })}
        </div>

        {/* Spacer for bottom padding */}
        <div className="h-24"></div>
      </div>
    </div>
  );
};

export default GridView;