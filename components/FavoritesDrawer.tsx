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
  Cloud,
  LogIn,
  Share2,
  Pencil,
} from 'lucide-react';
import { Voice } from '../types';
import { useI18n } from '../i18n';
import AudioVisualizer, { VisualizerVariant } from './AudioVisualizer';
import { useFirebase } from './FirebaseProvider';
import { getGeminiApiKeyHeaders, notifyGeminiQuotaUpdated } from '../firebase';
import { beginTrackedApiRequest, endTrackedApiRequest } from '../utils/networkStatus';

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
  hasCustomCharacterProfiles?: boolean;
  onEditCharacter?: (voice: Voice) => void;
  onOpenLogin: () => void;
  onShare?: (voice: Voice) => void;
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
  hasCustomCharacterProfiles = false,
  onEditCharacter,
  onOpenLogin,
  onShare,
}) => {
  const { t, language, translateGender, translatePitch } = useI18n();
  const { user, cloudSynced } = useFirebase();
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

    const reqId = beginTrackedApiRequest();
    const startedAt = performance.now();
    try {
      const authHeaders = await getGeminiApiKeyHeaders();
      const response = await fetch('/api/favorites-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          voiceNames: favoriteVoices.map((v) => v.name),
        }),
      });
      endTrackedApiRequest(reqId, performance.now() - startedAt, response.ok);
      notifyGeminiQuotaUpdated();

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
      endTrackedApiRequest(reqId, performance.now() - startedAt, false);
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
            className="absolute inset-0 bg-[#020E0B]/65 backdrop-blur-sm"
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
            className="relative w-full max-w-md h-full bg-[#FAF6EC]/96 dark:bg-[#06231B]/96 backdrop-blur-2xl border-l border-[#D9CEB8] dark:border-[#C6A259]/25 shadow-2xl flex flex-col outline-none"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#EBE2CE] dark:bg-[#114637] border border-[#B49049]/45 dark:border-[#C6A259]/30 flex items-center justify-center text-[#7D602D] dark:text-[#DFC589] shrink-0">
                  <Heart size={18} className="fill-current" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2
                      id="favorites-drawer-title"
                      className="text-lg font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] tracking-tight truncate"
                    >
                      {t.favorites}
                    </h2>
                    <span className="text-xs font-mono tabular-nums text-[#7D602D] dark:text-[#DFC589]">
                      ({favoriteVoices.length})
                    </span>
                  </div>
                  <p className="text-xs text-[#5B7469] dark:text-[#8DA399] truncate">
                    {user && cloudSynced ? t.favoritesDrawerSyncedSubtitle : t.favoritesDrawerSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors shrink-0"
                aria-label={t.close}
              >
                <X size={18} />
              </button>
            </div>

            {!user && (
              <div className="px-6 py-2.5 bg-[#F4EDE0]/90 dark:bg-[#041813]/85 border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/20 flex items-center justify-between gap-3 shrink-0">
                <span className="inline-flex items-center gap-2 text-xs text-[#2B463B] dark:text-[#C5D1CA] min-w-0">
                  <Cloud size={14} className="text-[#7D602D] dark:text-[#DFC589] shrink-0" />
                  <span className="truncate">{t.favoritesSyncPrompt}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 text-xs font-semibold shrink-0 transition-all"
                >
                  <LogIn size={12} />
                  <span>{t.signInWithGoogle}</span>
                </button>
              </div>
            )}

            {/* Action Bar */}
            {favoriteVoices.length > 0 && (
              <div className="px-6 py-3 bg-[#F4EDE0]/85 dark:bg-[#041813]/65 border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/18 space-y-2 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={onToggleFavoritesOnly}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        favoritesOnly
                          ? 'bg-[#EBE2CE] dark:bg-[#114637] border-[#B49049] dark:border-[#DFC589]/60 text-[#7D602D] dark:text-[#DFC589]'
                          : 'bg-[#FAF6EC]/90 dark:bg-[#092E24] border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637]'
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-[#FAF6EC]/90 dark:bg-[#092E24] border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:text-[#7D602D] dark:hover:text-[#DFC589] transition-all"
                    >
                      <Download size={12} />
                      <span>{t.exportJson}</span>
                    </button>
                  </div>

                  {!confirmingClear ? (
                    <button
                      type="button"
                      onClick={() => setConfirmingClear(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#5B7469] dark:text-[#8DA399] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/30 transition-colors"
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
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-700 hover:bg-rose-600 text-white transition-colors"
                      >
                        {t.confirmClear}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingClear(false)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#EBE2CE] dark:bg-[#114637] text-[#06231B] dark:text-[#FAF6EC] hover:bg-[#DFD3BA] dark:hover:bg-[#195E4A] transition-colors"
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
                    const subLabel = voice.characterName
                      ? language === 'en' && voice.characterName.en && voice.characterName.en !== voice.name
                        ? `${voice.characterName.en} · ${voice.name}`
                        : voice.name
                      : null;
                    return (
                      <div
                        key={voice.name}
                        className={`group relative rounded-2xl border luminous-hairline transition-all duration-200 overflow-hidden ${
                          isPlaying || isLoading
                            ? 'bg-[#F4EDE0] dark:bg-[#092E24] border-[#B49049] dark:border-[#DFC589]/65 shadow-sm'
                            : 'bg-[#FAF6EC]/90 dark:bg-[#092E24]/75 border-[#D9CEB8]/90 dark:border-[#C6A259]/20 hover:border-[#B49049]/70 dark:hover:border-[#DFC589]/45 shadow-sm'
                        }`}
                      >
                        <div className="p-3.5 flex items-center gap-3">
                          {/* 3D Realistic Character Portrait with Play / Pause Overlay */}
                          <div className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-[#B49049]/40 dark:border-[#C6A259]/35 bg-[#020E0B]">
                            {voice.imageUrl && (
                              <img
                                src={voice.imageUrl}
                                alt={displayName}
                                className="w-full h-full object-cover object-top"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/40" />
                            <button
                              type="button"
                              onClick={() => onPlayToggle(voice.name)}
                              aria-label={`${isPlaying ? t.pauseSample : t.playSample}: ${displayName}`}
                              className={`absolute inset-0 m-auto h-7 w-7 rounded-full flex items-center justify-center transition-all active:scale-90 border shadow-md ${
                                isPlaying || isLoading
                                  ? 'bg-[#0D3A2E] dark:bg-[#DFC589] border-[#B49049]/40 text-[#FAF6EC] dark:text-[#041813]'
                                  : 'bg-black/60 hover:bg-black/85 border-[#DFC589]/50 text-[#DFC589]'
                              }`}
                            >
                              {isLoading ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : isPlaying ? (
                                <Pause size={12} fill="currentColor" />
                              ) : (
                                <Play size={12} className="ml-0.5" fill="currentColor" />
                              )}
                            </button>
                          </div>

                          {/* Voice Details (clickable to jump to library) */}
                          <button
                            type="button"
                            onClick={() => onSelectVoice(voice.name)}
                            className="flex-1 min-w-0 text-left group/item"
                            title={t.focusInLibrary}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] tracking-tight truncate group-hover/item:text-[#7D602D] dark:group-hover/item:text-[#DFC589] transition-colors">
                                {displayName}
                              </span>
                              {subLabel && (
                                <span className="text-[11px] text-[#5B7469] dark:text-[#8DA399] truncate">
                                  {subLabel}
                                </span>
                              )}
                              <ArrowUpRight
                                size={13}
                                className="text-[#5B7469] dark:text-[#8DA399] group-hover/item:text-[#7D602D] dark:group-hover/item:text-[#DFC589] transition-colors shrink-0"
                              />
                            </div>
                            {voice.characterProfile?.title && (
                              <p className="text-[10px] text-[#7D602D] dark:text-[#DFC589] font-medium truncate mb-0.5">
                                {voice.characterProfile.title[language] || voice.characterProfile.title.mm}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5 text-[11px] text-[#7D602D] dark:text-[#C6A259]">
                              <span>{translateGender(voice.analysis.gender)}</span>
                              <span aria-hidden="true">·</span>
                              <span>{translatePitch(voice.pitch)}</span>
                              {voice.transcript?.trim() && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-medium text-[#114637] dark:text-[#DFC589]">
                                    {t.transcriptSavedBadge}
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-[#2B463B] dark:text-[#9EB5AC] truncate font-light">
                              {voice.transcript?.trim() || voice.analysis.characteristics.join(', ')}
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
                                className="p-2 rounded-full text-[#5B7469] dark:text-[#8DA399] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:text-[#06231B] dark:hover:text-[#DFC589] transition-colors disabled:opacity-60"
                              >
                                {isDownloading ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Download size={16} />
                                )}
                              </button>
                            )}

                            {onEditCharacter && (
                              <button
                                type="button"
                                onClick={() => onEditCharacter(voice)}
                                aria-label={`${t.editCharacterProfile}: ${displayName}`}
                                title={t.editCharacterProfile}
                                className={`p-2 rounded-full transition-colors ${
                                  voice.transcript?.trim()
                                    ? 'text-[#7D602D] dark:text-[#DFC589] bg-[#EBE2CE]/90 dark:bg-[#114637]/70 hover:bg-[#DFD3BA] dark:hover:bg-[#195E4A]'
                                    : 'text-[#5B7469] dark:text-[#8DA399] hover:text-[#7D602D] dark:hover:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637]'
                                }`}
                              >
                                <Pencil size={14} />
                              </button>
                            )}

                            {onShare && (
                              <button
                                type="button"
                                onClick={() => onShare(voice)}
                                aria-label={`${t.shareVoice}: ${displayName}`}
                                title={t.shareVoice}
                                className="p-2 rounded-full text-[#5B7469] dark:text-[#8DA399] hover:text-[#7D602D] dark:hover:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors"
                              >
                                <Share2 size={15} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onRemoveFavorite(voice.name)}
                              aria-label={`${t.removeFromFavorites}: ${displayName}`}
                              title={t.removeFromFavorites}
                              className="p-2 rounded-full text-[#9C7A3C] dark:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors"
                            >
                              <Heart size={16} className="fill-current" />
                            </button>
                          </div>
                        </div>

                        {/* Live Visualizer Strip while playing */}
                        {isPlaying && (
                          <div className="h-7 w-full bg-[#F4EDE0]/90 dark:bg-[#041813]/85 border-t border-[#D9CEB8]/80 dark:border-[#C6A259]/20">
                            <AudioVisualizer
                              isPlaying={true}
                              variant={visualizerVariant}
                              analyserNode={analyserNode}
                              color={isDark ? '#DFC589' : '#114637'}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-[#EBE2CE] dark:bg-[#114637] border border-[#B49049]/40 dark:border-[#C6A259]/30 flex items-center justify-center text-[#7D602D] dark:text-[#DFC589] mb-5">
                    <Heart size={28} />
                  </div>
                  <h3 className="text-lg font-serif text-[#06231B] dark:text-[#FAF6EC] mb-2">
                    {t.noFavoritesTitle}
                  </h3>
                  <p className="text-sm text-[#5B7469] dark:text-[#8DA399] leading-relaxed max-w-xs mb-6">
                    {t.emptyFavoritesDrawerDesc}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 text-sm font-medium transition-all"
                  >
                    {t.browseAllVoices}
                  </button>
                </div>
              )}
            </div>

            {/* Footer / Clear Custom Profiles (only when custom profiles exist) */}
            {hasCustomCharacterProfiles && (
              <div className="p-4 border-t border-[#D9CEB8]/80 dark:border-[#C6A259]/20 bg-[#F4EDE0]/75 dark:bg-[#041813]/65 shrink-0">
                <button
                  type="button"
                  onClick={onResetBurmeseNames}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#FAF6EC]/90 dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors text-xs font-medium shadow-sm"
                >
                  <RotateCcw size={13} />
                  <span>{t.resetBurmeseNames}</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FavoritesDrawer;
