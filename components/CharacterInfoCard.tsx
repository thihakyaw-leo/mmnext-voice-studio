/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useI18n } from '../i18n';

interface CharacterInfoCardProps {
  currentPage: number;
  totalPages: number;
  viewMode: 'carousel' | 'grid' | 'compare';
}

export const CharacterInfoCard: React.FC<CharacterInfoCardProps> = ({
  currentPage,
  totalPages,
  viewMode,
}) => {
  const { t, language } = useI18n();

  return (
    <div
      className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-wider bg-[#FDF7EB]/85 dark:bg-zinc-900/75 backdrop-blur-sm inline-flex items-center gap-3 px-3.5 py-1 rounded-full border border-zinc-300/60 dark:border-zinc-800 shadow-sm"
    >
      <span className="tracking-widest uppercase">
        {currentPage} / {totalPages}
      </span>
      <span className="hidden lg:inline text-zinc-300 dark:text-zinc-700">|</span>
      <span className="hidden lg:inline-flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>
          {viewMode === 'carousel' ? '← →' : '↑ ↓ ← →'}{' '}
          {viewMode === 'carousel' ? t.shortcutNavArrows : t.shortcutNavGrid}
        </span>
        {viewMode === 'carousel' && (
          <>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{t.shortcutWheel}</span>
          </>
        )}
        <span className="text-zinc-300 dark:text-zinc-700">·</span>
        <span>Space {t.shortcutPlayPause}</span>
      </span>
    </div>
  );
};

CharacterInfoCard.displayName = 'CharacterInfoCard';
