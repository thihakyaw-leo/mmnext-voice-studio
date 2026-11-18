/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Share2,
  Link2,
  Copy,
  Check,
  MessageSquareText,
  Gauge,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Voice } from '../types';
import { useI18n } from '../i18n';
import { getVoicePitchHzRange, getVoiceEmotionalTone } from '../utils/pitchDetection';

interface ShareVoiceModalProps {
  isOpen: boolean;
  voices: Voice[];
  onClose: () => void;
}

type SnippetStyle = 'short' | 'detailed';

async function copyTextSafe(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to execCommand fallback
    }
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

const ShareVoiceModal: React.FC<ShareVoiceModalProps> = ({ isOpen, voices, onClose }) => {
  const { t, language, translateGender, translatePitch, translateTone } = useI18n();
  const [snippetStyle, setSnippetStyle] = useState<SnippetStyle>('short');
  const [customSnippet, setCustomSnippet] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const isCompareShare = voices.length >= 2;
  const primaryVoice = voices[0];
  const secondaryVoice = voices[1];

  const supportsWebShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined' || voices.length === 0) return '';
    const base = `${window.location.origin}${window.location.pathname}`;
    if (voices.length >= 2) {
      return `${base}?compare=${encodeURIComponent(voices[0].name)},${encodeURIComponent(voices[1].name)}`;
    }
    return `${base}?voice=${encodeURIComponent(voices[0].name)}`;
  }, [voices]);

  const generatedSnippet = useMemo(() => {
    if (!primaryVoice) return '';

    if (isCompareShare && secondaryVoice) {
      const nameA = primaryVoice.characterName?.mm
        ? `${primaryVoice.characterName.mm} (${primaryVoice.name})`
        : primaryVoice.name;
      const nameB = secondaryVoice.characterName?.mm
        ? `${secondaryVoice.characterName.mm} (${secondaryVoice.name})`
        : secondaryVoice.name;
      const hzA = getVoicePitchHzRange(primaryVoice).label;
      const hzB = getVoicePitchHzRange(secondaryVoice).label;
      const toneA = translateTone(getVoiceEmotionalTone(primaryVoice));
      const toneB = translateTone(getVoiceEmotionalTone(secondaryVoice));

      if (language === 'mm') {
        if (snippetStyle === 'short') {
          return `🎙️ MMNext Voice Studio တွင် ${nameA} (${hzA}) နှင့် ${nameB} (${hzB}) အသံနှစ်ခုကို ယှဉ်တွဲနားထောင်ကြည့်ပါ!\n${shareUrl}\n#MMNextVoiceStudio #BurmeseTTS #VoiceCasting`;
        }
        return [
          `🎙️ MMNext Voice Studio — အသံနှိုင်းယှဉ်မှု`,
          `• Voice A: ${nameA} · ${translateGender(primaryVoice.analysis.gender)} · ${hzA} · ${toneA}`,
          `• Voice B: ${nameB} · ${translateGender(secondaryVoice.analysis.gender)} · ${hzB} · ${toneB}`,
          `👉 တိုက်ရိုက်နားထောင်ရန်: ${shareUrl}`,
          `#MMNextVoiceStudio #VoiceCasting #BurmeseTTS`,
        ].join('\n');
      }

      if (snippetStyle === 'short') {
        return `🎙️ Compare ${nameA} (${hzA}, ${toneA}) vs ${nameB} (${hzB}, ${toneB}) on MMNext Voice Studio!\n${shareUrl}\n#MMNextVoiceStudio #VoiceCasting #TTS`;
      }
      return [
        `🎙️ Side-by-Side Voice Comparison on MMNext Voice Studio`,
        `• Voice A: ${nameA} — ${translateGender(primaryVoice.analysis.gender)} · ${hzA} · ${toneA}`,
        `• Voice B: ${nameB} — ${translateGender(secondaryVoice.analysis.gender)} · ${hzB} · ${toneB}`,
        `Listen live: ${shareUrl}`,
        `#MMNextVoiceStudio #VoiceCasting #TTS`,
      ].join('\n');
    }

    const displayName = primaryVoice.characterName?.mm
      ? `${primaryVoice.characterName.mm} (${primaryVoice.name})`
      : primaryVoice.name;
    const hzLabel = getVoicePitchHzRange(primaryVoice).label;
    const toneLabel = translateTone(getVoiceEmotionalTone(primaryVoice));
    const genderLabel = translateGender(primaryVoice.analysis.gender);
    const pitchLabel = translatePitch(primaryVoice.pitch);
    const traits = primaryVoice.analysis.characteristics.slice(0, 3).join(', ');

    if (language === 'mm') {
      if (snippetStyle === 'short') {
        return `🎙️ ${displayName} — ${genderLabel} · ${hzLabel} · ${toneLabel} အသံကို MMNext Voice Studio တွင် နားထောင်ကြည့်ပါ!\n${shareUrl}\n#MMNextVoiceStudio #BurmeseTTS #VoiceCasting`;
      }
      return [
        `🎙️ ${displayName} — MMNext Voice Studio`,
        `• အမျိုးအစား: ${genderLabel} · ${pitchLabel} (${hzLabel})`,
        `• ခံစားချက်လေသံ: ${toneLabel}`,
        `• အသံစရိုက်: ${traits}`,
        `👉 တိုက်ရိုက်နားထောင်ရန်: ${shareUrl}`,
        `#MMNextVoiceStudio #BurmeseTTS #VoiceCasting`,
      ].join('\n');
    }

    if (snippetStyle === 'short') {
      return `🎙️ Meet "${displayName}" (${genderLabel}, ${hzLabel}, ${toneLabel}) on MMNext Voice Studio!\n${shareUrl}\n#MMNextVoiceStudio #VoiceCasting #TTS`;
    }
    return [
      `🎙️ ${displayName} — MMNext Voice Studio`,
      `• Profile: ${genderLabel} · ${pitchLabel} (${hzLabel})`,
      `• Emotional Tone: ${toneLabel}`,
      `• Traits: ${traits}`,
      `Listen live: ${shareUrl}`,
      `#MMNextVoiceStudio #VoiceCasting #TTS`,
    ].join('\n');
  }, [
    primaryVoice,
    secondaryVoice,
    isCompareShare,
    language,
    snippetStyle,
    shareUrl,
    translateGender,
    translatePitch,
    translateTone,
  ]);

  useEffect(() => {
    setCustomSnippet(generatedSnippet);
  }, [generatedSnippet]);

  useEffect(() => {
    if (!isOpen) {
      setCopiedLink(false);
      setCopiedSnippet(false);
      setShareError(null);
      return;
    }

    modalRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll(
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

  if (!isOpen || !primaryVoice) return null;

  const handleCopyLink = async () => {
    const ok = await copyTextSafe(shareUrl);
    if (ok) {
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopySnippet = async () => {
    const ok = await copyTextSafe(customSnippet);
    if (ok) {
      setCopiedSnippet(true);
      window.setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const handleWebShare = async () => {
    if (!supportsWebShare) return;
    setShareError(null);

    const shareTitle = isCompareShare && secondaryVoice
      ? `${primaryVoice.characterName?.mm || primaryVoice.name} vs ${secondaryVoice.characterName?.mm || secondaryVoice.name} — MMNext Voice Studio`
      : `${primaryVoice.characterName?.mm || primaryVoice.name} (${primaryVoice.name}) — MMNext Voice Studio`;

    try {
      await navigator.share({
        title: shareTitle,
        text: customSnippet,
        url: shareUrl,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setShareError(t.webShareFailed);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-voice-modal-title"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-3xl bg-[#FDF7EB] dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800 shadow-2xl overflow-hidden outline-none animate-slide-up"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-300/60 dark:border-zinc-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white flex items-center justify-center shrink-0">
              <Share2 size={18} />
            </div>
            <div className="min-w-0">
              <h2
                id="share-voice-modal-title"
                className="text-lg font-bold text-zinc-800 dark:text-white tracking-tight truncate"
              >
                {isCompareShare ? t.shareCompareModalTitle : t.shareModalTitle}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">
                {t.shareModalSubtitle}
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

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Selected Voice Preview Summary */}
          <div className="space-y-2">
            {voices.slice(0, 2).map((voice, idx) => {
              const displayName = voice.characterName?.mm || voice.name;
              const pitchRange = getVoicePitchHzRange(voice);
              const tone = translateTone(getVoiceEmotionalTone(voice));
              return (
                <div
                  key={`${voice.name}-${idx}`}
                  className="p-3 rounded-2xl bg-white/85 dark:bg-zinc-800/80 border border-zinc-300/70 dark:border-zinc-700/80 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isCompareShare && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white text-[10px] font-bold shrink-0">
                          {idx === 0 ? 'A' : 'B'}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-zinc-800 dark:text-white truncate">
                        {displayName}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {voice.name}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {translateGender(voice.analysis.gender)} · {translatePitch(voice.pitch)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-zinc-600 dark:text-zinc-300">
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums text-indigo-700 dark:text-indigo-300">
                      <Gauge size={11} />
                      <span>{pitchRange.label}</span>
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300">
                      <Sparkles size={11} />
                      <span>{tone}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unique Share Link */}
          <div className="space-y-1.5">
            <label
              htmlFor="share-unique-link-input"
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              <Link2 size={13} />
              <span>{t.uniqueShareLink}</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="share-unique-link-input"
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/90 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-600 text-[#FDF7EB] dark:text-white'
                }`}
              >
                {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedLink ? t.linkCopied : t.copyLink}</span>
              </button>
            </div>
          </div>

          {/* Social Media Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="share-social-snippet-textarea"
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                <MessageSquareText size={13} />
                <span>{t.socialMediaSnippet}</span>
              </label>

              <div className="flex bg-zinc-200/70 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-300/70 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setSnippetStyle('short')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    snippetStyle === 'short'
                      ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {t.snippetStyleShort}
                </button>
                <button
                  type="button"
                  onClick={() => setSnippetStyle('detailed')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    snippetStyle === 'detailed'
                      ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {t.snippetStyleDetailed}
                </button>
              </div>
            </div>

            <textarea
              id="share-social-snippet-textarea"
              rows={snippetStyle === 'detailed' ? 5 : 3}
              value={customSnippet}
              onChange={(e) => setCustomSnippet(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopySnippet}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  copiedSnippet
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white/90 dark:bg-zinc-800 border-zinc-300/80 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                }`}
              >
                {copiedSnippet ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedSnippet ? t.snippetCopied : t.copySnippet}</span>
              </button>

              {supportsWebShare && (
                <button
                  type="button"
                  onClick={() => void handleWebShare()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 dark:bg-indigo-600 hover:bg-zinc-700 dark:hover:bg-indigo-500 text-[#FDF7EB] dark:text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  <Share2 size={14} />
                  <span>{t.shareViaWebShare}</span>
                </button>
              )}
            </div>

            {!supportsWebShare && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                {t.webShareUnsupportedHint}
              </p>
            )}

            {shareError && (
              <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{shareError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareVoiceModal;
