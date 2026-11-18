/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Play,
  Pause,
  X,
  Trash2,
  Filter,
  ArrowUpRight,
  Download,
  Loader2,
  FolderDown,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Voice } from '../types';
import { useI18n } from '../i18n';
import AudioVisualizer, { VisualizerVariant } from './AudioVisualizer';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteVoices: Voice[];
  playingVoice: string | null;
  loadingVoice?: string | null;
  downloadingVoice?: string | null;
  isCustomTtsMode?: boolean;
  onPlayToggle: (voiceName: string) => void;
  onDownloadTts?: (voiceName: string) => void;
  onRemoveFavorite: (voiceName: string) => void;
  onClearFavorites: () => void;
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  onSelectVoice: (voiceName: string) => void;
  visualizerVariant?: VisualizerVariant;
  analyserNode?: AnalyserNode | null;
  onResetBurmeseNames: () => void;
}

const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favoriteVoices,
  playingVoice,
  loadingVoice = null,
  downloadingVoice = null,
  isCustomTtsMode = false,
  onPlayToggle,
  onDownloadTts,
  onRemoveFavorite,
  onClearFavorites,
  favoritesOnly,
  onToggleFavoritesOnly,
  onSelectVoice,
  visualizerVariant = 'wave',
  analyserNode = null,
  onResetBurmeseNames,
}) => {
  const { t, language, translateGender, translatePitch } = useI18n();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [isDownloadingAllZip, setIsDownloadingAllZip] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setConfirmingClear(false);
      setZipError(null);
      return;
    }

    drawerRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const handleExportJson = () => {
    if (favoriteVoices.length === 0) return;

    const payload = {
      app: 'MMNext Voice Studio',
      exportedAt: new Date().toISOString(),
      count: favoriteVoices.length,
      favorites: favoriteVoices.map((voice) => ({
        id: voice.name,
        characterName: voice.characterName ?? null,
        gender: voice.analysis.gender,
        pitch: voice.pitch,
        analysisPitch: voice.analysis.pitch,
        characteristics: voice.analysis.characteristics,
      })),
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10);

    const link = document.createElement('a');
    link.href = url;
    link.download = `mmnext-voice-favorites-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    if (favoriteVoices.length === 0 || isDownloadingAllZip) return;

    setIsDownloadingAllZip(true);
    setZipError(null);

    try {
      const response = await fetch('/api/favorites-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceNames: favoriteVoices.map((v) => v.name),
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || t.downloadZipFailedError);
      }

      const zipBlob = await response.blob();
      const url = URL.createObjectURL(zipBlob);
      const dateStamp = new Date().toISOString().slice(0, 10);

      const link = document.createElement('a');
      link.href = url;
      link.download = `mmnext-favorites-audio-${dateStamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download favorites ZIP:', err);
      setZipError(
        typeof err?.message === 'string' && err.message.trim()
          ? err.message
          : t.downloadZipFailedError
      );
    } finally {
      setIsDownloadingAllZip(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="favorites-drawer-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Slide-over Panel */}
          <motion.div
            ref={drawerRef}
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative w-full max-w-md h-full bg-[#FDF7EB]/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-l border-zinc-300/70 dark:border-zinc-800 shadow-2xl flex flex-col outline-none"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-300/60 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/70 dark:border-rose-800/60 flex items-center justify-center text-rose-500 shrink-0">
                  <Heart size={18} className="fill-current" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2
                      id="favorites-drawer-title"
                      className="text-lg font-bold text-zinc-800 dark:text-white tracking-tight truncate"
                    >
                      {t.favorites}
                    </h2>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300/70 dark:border-zinc-700">
                      {favoriteVoices.length}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {t.favoritesDrawerSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors shrink-0"
                aria-label={t.close}
              >
                <X size={18} />
              </button>
            </div>

            {/* Action Bar */}
            {favoriteVoices.length > 0 && (
              <div className="px-6 py-3 bg-[#F5EFE2]/80 dark:bg-zinc-950/40 border-b border-zinc-300/60 dark:border-zinc-800 space-y-2 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={onToggleFavoritesOnly}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        favoritesOnly
                          ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300'
                          : 'bg-white/85 dark:bg-zinc-800 border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <Filter size={12} />
                      <span>{favoritesOnly ? t.showingFavoritesOnly : t.showInMainView}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadAllZip}
                      disabled={isDownloadingAllZip}
                      title={t.downloadAllFavoritesTooltip}
                      aria-label={t.downloadAllFavoritesTooltip}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white hover:bg-zinc-700 dark:hover:bg-indigo-500 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                    >
                      {isDownloadingAllZip ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <FolderDown size={12} />
                      )}
                      <span>
                        {isDownloadingAllZip ? t.downloadingAllZip : t.downloadAllFavorites}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportJson}
                      title={t.exportJsonTooltip}
                      aria-label={t.exportJsonTooltip}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white/85 dark:bg-zinc-800 border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-indigo-400 transition-all"
                    >
                      <Download size={12} />
                      <span>{t.exportJson}</span>
                    </button>
                  </div>

                  {!confirmingClear ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingClear(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 size={12} />
                      <span>{t.clearAll}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onClearFavorites();
                          setConfirmingClear(false);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                      >
                        {t.confirmClear}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingClear(false)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  )}
                </div>

                {zipError && (
                  <div className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <AlertCircle size={13} className="shrink-0" />
                      <span className="truncate">{zipError}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setZipError(null)}
                      className="p-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/50 shrink-0"
                      aria-label={t.close}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* List / Empty State */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
              {favoriteVoices.length > 0 ? (
                <div className="space-y-3">
                  {favoriteVoices.map((voice) => {
                    const isPlaying = playingVoice === voice.name;
                    const isLoading = loadingVoice === voice.name;
                    const isDownloading = downloadingVoice === voice.name;
                    const displayName = voice.characterName?.mm || voice.name;
                    const subLabel =
                      language === 'en' && voice.characterName
                        ? `${voice.characterName.en} · ${voice.name}`
                        : voice.name;
                    return (
                      <div
                        key={voice.name}
                        className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isPlaying || isLoading
                            ? 'bg-[#F7F1E5] dark:bg-indigo-950/20 border-zinc-500 dark:border-indigo-800 shadow-sm'
                            : 'bg-white/90 dark:bg-zinc-800/80 border-zinc-300/70 dark:border-zinc-700/80 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-sm'
                        }`}
                      >
                        <div className="p-3.5 flex items-center gap-3">
                          {/* Play / Pause Button */}
                          <button
                            type="button"
                            onClick={() => onPlayToggle(voice.name)}
                            aria-label={`${isPlaying ? t.pauseSample : t.playSample}: ${displayName}`}
                            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 ${
                              isPlaying || isLoading
                                ? 'bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white shadow-md shadow-zinc-900/15 dark:shadow-indigo-500/20'
                                : 'bg-zinc-700 dark:bg-zinc-100 text-[#FDF7EB] dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'
                            }`}
                          >
                            {isLoading ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : isPlaying ? (
                              <Pause size={15} fill="currentColor" />
                            ) : (
                              <Play size={15} className="ml-0.5" fill="currentColor" />
                            )}
                          </button>

                          {/* Voice Details (clickable to jump to library) */}
                          <button
                            type="button"
                            onClick={() => onSelectVoice(voice.name)}
                            className="flex-1 min-w-0 text-left group/item"
                            title={t.focusInLibrary}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-zinc-800 dark:text-white tracking-tight truncate group-hover/item:text-zinc-600 dark:group-hover/item:text-indigo-400 transition-colors">
                                {displayName}
                              </span>
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-500 truncate">
                                {subLabel}
                              </span>
                              <ArrowUpRight
                                size={13}
                                className="text-zinc-400 dark:text-zinc-600 group-hover/item:text-zinc-700 dark:group-hover/item:text-indigo-500 transition-colors shrink-0"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-900/70 text-[10px] font-medium text-zinc-700 dark:text-zinc-400">
                                {translateGender(voice.analysis.gender)}
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-900/70 text-[10px] font-medium text-zinc-700 dark:text-zinc-400">
                                {translatePitch(voice.pitch)}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-light">
                              {voice.analysis.characteristics.join(', ')}
                            </p>
                          </button>

                          {/* Conditional Download Button + Remove Button */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isCustomTtsMode && onDownloadTts && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isDownloading) onDownloadTts(voice.name);
                                }}
                                disabled={isDownloading}
                                aria-label={`${
                                  isDownloading ? t.downloadingSpeech : t.downloadSpeech
                                }: ${displayName}`}
                                title={isDownloading ? t.downloadingSpeech : t.downloadSpeech}
                                className="p-2 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-60"
                              >
                                {isDownloading ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Download size={16} />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onRemoveFavorite(voice.name)}
                              aria-label={`${t.removeFromFavorites}: ${displayName}`}
                              title={t.removeFromFavorites}
                              className="p-2 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            >
                              <Heart size={16} className="fill-current" />
                            </button>
                          </div>
                        </div>

                        {/* Live Visualizer Strip while playing */}
                        {isPlaying && (
                          <div className="h-7 w-full bg-[#F5EFE2]/70 dark:bg-zinc-900/60 border-t border-zinc-300/70 dark:border-indigo-900/40">
                            <AudioVisualizer
                              isPlaying={true}
                              variant={visualizerVariant}
                              analyserNode={analyserNode}
                              color={isDark ? '#a5b4fc' : '#27272a'}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/50 flex items-center justify-center text-rose-400 mb-5">
                    <Heart size={28} />
                  </div>
                  <h3 className="text-lg font-serif text-zinc-800 dark:text-white mb-2">
                    {t.noFavoritesTitle}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mb-6">
                    {t.emptyFavoritesDrawerDesc}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-full bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white text-sm font-medium hover:bg-zinc-700 dark:hover:bg-indigo-500 transition-colors"
                  >
                    {t.browseAllVoices}
                  </button>
                </div>
              )}
            </div>

            {/* Footer / Reset Burmese Names */}
            <div className="p-4 border-t border-zinc-300/60 dark:border-zinc-800 bg-[#F5EFE2]/60 dark:bg-zinc-950/30 shrink-0">
              <button
                type="button"
                onClick={onResetBurmeseNames}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/85 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-xs font-medium shadow-sm"
              >
                <RotateCcw size={13} />
                <span>{t.resetBurmeseNames}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FavoritesDrawer;
