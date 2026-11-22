/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AiRecommendation, Voice } from '../types';
import { Sparkles, Copy, Check, Quote, X } from 'lucide-react';
import AiTtsPreview from './AiTtsPreview';
import { VisualizerVariant } from './AudioVisualizer';
import ReactMarkdown from 'react-markdown';
import { useI18n } from '../i18n';

interface AiResultCardProps {
  result: AiRecommendation;
  voices: Voice[];
  onClose: () => void;
  favorites?: string[];
  onToggleFavorite?: (voiceName: string) => void;
  visualizerVariant?: VisualizerVariant;
}

const AiResultCard: React.FC<AiResultCardProps> = ({
  result,
  voices,
  onClose,
  favorites,
  onToggleFavorite,
  visualizerVariant = 'wave',
}) => {
  const { t } = useI18n();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Focus trap implementation
  useEffect(() => {
    cardRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      if (!cardRef.current) return;

      const focusableElements = cardRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Ensure markdown is properly formatted even if the model returns compact text
  const formattedInstruction = useMemo(() => {
    if (!result.systemInstruction) return '';
    let text = result.systemInstruction;
    text = text.replace(/([^\n])\s*(##)/g, '$1\n\n$2');
    return text;
  }, [result.systemInstruction]);

  return (
    <div
      ref={cardRef}
      tabIndex={-1}
      className="w-full bg-[#FAF6EC]/96 dark:bg-[#06231B]/95 backdrop-blur-xl border border-[#D9CEB8] dark:border-[#C6A259]/28 luminous-hairline shadow-2xl overflow-hidden relative group outline-none h-full flex flex-col"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-2 text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC] rounded-full hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors z-50"
        aria-label={t.close}
      >
        <X size={18} />
      </button>

      {/* Subtle Atmospheric Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EBE2CE]/55 via-[#F4EDE0]/35 to-transparent dark:from-[#114637]/30 dark:via-[#092E24]/20 dark:to-transparent -z-10"></div>

      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 overflow-y-auto max-h-[85vh] md:max-h-[600px] md:h-auto">
        {/* Left: Persona Info */}
        <div className="flex-1 space-y-4 min-w-0 flex flex-col">
          <div className="flex items-center gap-3 mb-2 flex-shrink-0">
            <div className="p-2.5 bg-[#EBE2CE] dark:bg-[#114637] border border-[#B49049]/40 dark:border-[#C6A259]/30 rounded-xl text-[#7D602D] dark:text-[#DFC589] shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h2
                id="ai-result-title"
                className="text-lg font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] tracking-tight leading-tight"
              >
                {t.aiSuggestedPersona}
              </h2>
              <p className="text-xs text-[#5B7469] dark:text-[#8DA399] font-medium">
                {t.basedOnDescription}
              </p>
            </div>
          </div>

          <div className="bg-[#FAF6EC]/90 dark:bg-[#041813]/85 rounded-xl border border-[#D9CEB8] dark:border-[#C6A259]/22 shadow-sm relative group/code flex-1 flex flex-col min-h-[300px] md:min-h-0 overflow-hidden">
            <div className="flex justify-between items-center p-4 pb-2.5 border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/18 flex-shrink-0">
              <span className="text-[10px] font-bold text-[#7D602D] dark:text-[#C6A259] uppercase tracking-[0.16em] flex items-center gap-1">
                {t.systemPrompt}
              </span>
              <button
                onClick={() => handleCopy(result.systemInstruction, 'sys')}
                className="p-1.5 rounded-md bg-[#FAF6EC] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#DFC589] transition-all opacity-0 group-hover/code:opacity-100 focus:opacity-100"
                title={t.copySystemPrompt}
              >
                {copiedSection === 'sys' ? (
                  <Check size={14} className="text-[#2E8267] dark:text-[#DFC589]" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>

            {/* Markdown Scroll Container */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#F4EDE0]/60 dark:bg-[#041813]/60">
              <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none prose-headings:text-[#06231B] dark:prose-headings:text-[#EAD7A4] prose-headings:font-serif prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-4 prose-p:text-[#2B463B] dark:prose-p:text-[#C5D1CA] prose-p:leading-relaxed prose-strong:text-[#06231B] dark:prose-strong:text-[#FAF6EC] text-sm">
                <ReactMarkdown>{formattedInstruction}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Audio Preview */}
        <div className="flex-1 flex flex-col justify-center space-y-5 pt-2">
          <div className="relative pl-8">
            <Quote size={24} className="absolute -top-1 left-0 text-[#B49049]/60 dark:text-[#C6A259]/50" />
            <p className="text-lg text-[#06231B] dark:text-[#FAF6EC] italic font-serif leading-relaxed">
              "{result.sampleText}"
            </p>
          </div>

          <div className="bg-[#FAF6EC]/90 dark:bg-[#092E24]/85 p-1 rounded-2xl shadow-sm border border-[#D9CEB8] dark:border-[#C6A259]/22">
            <AiTtsPreview
              text={result.sampleText}
              voices={voices}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              visualizerVariant={visualizerVariant}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiResultCard;