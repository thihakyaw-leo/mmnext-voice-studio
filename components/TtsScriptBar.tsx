/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareText, X, Loader2, AlertCircle, Download, Trash2, Check } from 'lucide-react';
import { useI18n } from '../i18n';

interface TtsScriptBarProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  loadingVoiceDisplayName: string | null;
  error: string | null;
  onDismissError: () => void;
}

const TtsScriptBar: React.FC<TtsScriptBarProps> = ({
  isOpen,
  onToggleOpen,
  onClose,
  value,
  onChange,
  onClear,
  loadingVoiceDisplayName,
  error,
  onDismissError,
}) => {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 60);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Inline Error Toast above bottom-right button when TTS Box is closed */}
      <AnimatePresence>
        {!isOpen && error && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="fixed bottom-20 right-4 sm:bottom-24 sm:right-7 z-40 max-w-xs px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs flex items-center justify-between gap-2 shadow-lg backdrop-blur-md"
          >
            <span className="flex items-center gap-2 min-w-0">
              <AlertCircle size={14} className="shrink-0" />
              <span className="truncate">{error}</span>
            </span>
            <button
              type="button"
              onClick={onDismissError}
              className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/60 shrink-0"
              aria-label={t.close}
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pop-up TTS Text Box (Appears only when bottom-right Message button is clicked) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            role="dialog"
            aria-label={t.ttsBoxTitle}
            className="fixed bottom-20 right-4 left-4 sm:left-auto sm:w-[400px] sm:bottom-24 sm:right-7 z-40 rounded-2xl bg-[#FDF7EB]/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-300/80 dark:border-zinc-700/80 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-300/60 dark:border-zinc-800 flex items-center justify-between gap-2 bg-[#F5EFE2]/80 dark:bg-zinc-950/40">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white shrink-0">
                  <MessageSquareText size={14} />
                </div>
                <span className="text-sm font-bold text-zinc-800 dark:text-white truncate">
                  {t.ttsBoxTitle}
                </span>
                {hasText && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-800 dark:bg-indigo-600/90 text-[#FDF7EB] dark:text-white text-[10px] font-semibold shrink-0">
                    {t.ttsActiveBadge}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors shrink-0"
                aria-label={t.close}
              >
                <X size={16} />
              </button>
            </div>

            {/* Input Body */}
            <div className="p-4 space-y-3">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                placeholder={t.ttsPlaceholder}
                aria-label={t.ttsPlaceholder}
                className="w-full rounded-xl bg-white/90 dark:bg-zinc-800/90 border border-zinc-300/80 dark:border-zinc-700 p-3 text-sm sm:text-[15px] text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300/70 dark:focus:ring-indigo-900/50 focus:border-zinc-500 dark:focus:border-indigo-600 resize-none leading-relaxed transition-all"
              />

              {error && (
                <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <AlertCircle size={13} className="shrink-0" />
                    <span className="truncate">{error}</span>
                  </span>
                  <button
                    type="button"
                    onClick={onDismissError}
                    className="p-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/50 shrink-0"
                    aria-label={t.close}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Hint / Status Line */}
              <div className="flex items-center justify-between gap-2 text-[11px]">
                {loadingVoiceDisplayName ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700 dark:text-indigo-300">
                    <Loader2 size={12} className="animate-spin shrink-0" />
                    <span>{t.ttsGeneratingFor(loadingVoiceDisplayName)}</span>
                  </span>
                ) : hasText ? (
                  <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 min-w-0">
                    <Download size={12} className="shrink-0 text-zinc-700 dark:text-indigo-400" />
                    <span className="leading-snug">{t.ttsTapHint}</span>
                  </span>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-500 leading-snug">
                    {t.ttsDefaultHint}
                  </span>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {value.length > 0 ? (
                  <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>{t.ttsClearText}</span>
                  </button>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white hover:bg-zinc-700 dark:hover:bg-indigo-500 shadow-sm transition-all active:scale-95"
                >
                  <Check size={13} />
                  <span>{t.ttsDone}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom-Right Floating Message Logo Button */}
      <button
        type="button"
        onClick={onToggleOpen}
        aria-label={t.ttsOpenButton}
        aria-expanded={isOpen}
        title={t.ttsOpenButton}
        className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 h-13 w-13 sm:h-14 sm:w-14 rounded-full bg-zinc-800 dark:bg-indigo-600 hover:bg-zinc-700 dark:hover:bg-indigo-500 text-[#FDF7EB] dark:text-white shadow-xl border border-zinc-700/40 dark:border-indigo-400/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        {loadingVoiceDisplayName ? (
          <Loader2 size={22} className="animate-spin" />
        ) : isOpen ? (
          <X size={22} />
        ) : (
          <MessageSquareText size={22} />
        )}

        {hasText && !isOpen && (
          <span
            className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-[#FDF7EB] dark:ring-zinc-900"
            aria-hidden="true"
          />
        )}
      </button>
    </>
  );
};

export default TtsScriptBar;
