/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Voice } from '../types';
import VoiceCard from './VoiceCard';
import { VisualizerVariant } from './AudioVisualizer';

interface GridViewProps {
  voices: Voice[];
  playingVoice: string | null;
  onPlayToggle: (voiceName: string) => void;
  favorites: string[];
  onToggleFavorite: (voiceName: string) => void;
  compareVoices?: string[];
  onToggleCompare?: (voiceName: string) => void;
  visualizerVariant?: VisualizerVariant;
  analyserNode?: AnalyserNode | null;
}

const GridView: React.FC<GridViewProps> = ({
  voices,
  playingVoice,
  onPlayToggle,
  favorites,
  onToggleFavorite,
  compareVoices = [],
  onToggleCompare,
  visualizerVariant = 'wave',
  analyserNode = null,
}) => {
  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {voices.map((voice) => {
            const compareIdx = compareVoices.indexOf(voice.name);
            const compareSlot = compareIdx === 0 ? 'A' : compareIdx === 1 ? 'B' : null;
            return (
              <VoiceCard
                key={voice.name}
                voice={voice}
                isPlaying={playingVoice === voice.name}
                onPlayToggle={onPlayToggle}
                isFavorite={favorites.includes(voice.name)}
                onToggleFavorite={onToggleFavorite}
                compareSlot={compareSlot}
                onToggleCompare={onToggleCompare}
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