/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '../genaiProxy';
import { Sparkles, Loader2, X, ArrowRight, Wand2, History, Trash2 } from 'lucide-react';
import { Voice, AiRecommendation } from '../types';
import { useI18n } from '../i18n';
import { useFirebase } from './FirebaseProvider';
import { deleteCastingHistoryInFirestore } from '../firebase';

interface VoiceFinderProps {
  voices: Voice[];
  onRecommendation: (rec: AiRecommendation | null, promptText?: string) => void;
  onClose: () => void;
}

const VoiceFinder: React.FC<VoiceFinderProps> = ({ voices, onRecommendation, onClose }) => {
  const { t, language } = useI18n();
  const { user, cloudCastingHistory } = useFirebase();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap implementation
  useEffect(() => {
    textAreaRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      if (!modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
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

  const examples = [
    { label: t.exampleIrishLabel, text: t.exampleIrishText },
    { label: t.exampleSgLabel, text: t.exampleSgText },
    ...(language === 'mm' ? [{ label: t.exampleMmLabel, text: t.exampleMmText }] : []),
  ];

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: 'server-side' });

      const simplifiedVoices = voices.map((v) => ({
        name: v.name,
        characterName: v.characterName?.mm || v.name,
        gender: v.analysis.gender,
        pitch: v.analysis.pitch,
        characteristics: v.analysis.characteristics,
      }));

      const prompt = `
        You are an expert voice casting director.
        
        Available Voices Data:
        ${JSON.stringify(simplifiedVoices)}

        User Request: "${query}"

        IMPORTANT: any voice can do any accent by simply prompting for it in the director's note.

        Task:
        1. Select the top 3 voices from the available list that best match the user's request. Return their exact "name" field values (e.g., "Zephyr", "Algenib") in recommendedVoices.
        2. Create a detailed System Instruction that defines the persona/character (specifying native Myanmar/Burmese pronunciation when appropriate).
        3. Write a brief sample text paragraph (2-3 sentences) in natural Myanmar (Burmese) language so the voice preview speaks in Burmese.

        PROMPT STRUCTURE (Markdown):
        Ensure you use double newlines (\\n\\n) between sections so it renders correctly as markdown headers.

        ## Audio Profile
        Establishes a persona for the voice, defining a character identity, archetype and any other characteristics like age, background etc.
        
        ## Scene
        Sets the stage. Describes both the physical environment and the "vibe".
        
        ## Director's Notes
        Performance guidance where you can break down which instructions are important for your virtual talent to take note of. Examples are style, breathing, pacing, articulation and accent.
        
        ## Sample context
        Gives the model a contextual starting point, so your virtual actor enters the scene you set up naturally.
        
        ## Transcript
        The text that the model will speak out.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedVoices: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Array of exactly 3 voice names',
              },
              systemInstruction: {
                type: Type.STRING,
                description: 'System prompt. Formatted as Markdown with newlines.',
              },
              sampleText: {
                type: Type.STRING,
                description: 'Sample text',
              },
            },
          },
        },
      });

      const result = JSON.parse(response.text || '{}');

      if (result.recommendedVoices && result.recommendedVoices.length > 0) {
        onRecommendation(
          {
            voiceNames: result.recommendedVoices,
            systemInstruction: result.systemInstruction,
            sampleText: result.sampleText,
          },
          query.trim()
        );
      } else {
        setError(t.noMatchingVoicesError);
      }
    } catch (err) {
      console.error('AI Error:', err);
      setError(t.analysisFailedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="casting-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-[#FDF7EB] dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden animate-slide-up ring-1 ring-zinc-300/70 dark:ring-zinc-900/5"
      >
        {/* Decorative Header Background */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-zinc-200/50 to-[#FDF7EB]/0 dark:from-indigo-900/30 dark:to-zinc-900/0 pointer-events-none"></div>

        <div className="relative p-8 sm:p-10">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-indigo-400 mb-2">
                <Wand2 size={20} />
                <span className="text-sm font-bold tracking-wider uppercase">
                  {t.aiCastingDirector}
                </span>
              </div>
              <h2
                id="casting-title"
                className="text-3xl sm:text-4xl font-serif font-medium tracking-tight text-zinc-800 dark:text-white leading-tight"
              >
                {t.castingTitle}
              </h2>
              <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 font-light">
                {t.castingSubtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-300/70 dark:hover:bg-zinc-700 transition-colors"
              aria-label={t.close}
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative group">
            <textarea
              ref={textAreaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.castingPlaceholder}
              className="w-full h-32 bg-white/85 dark:bg-zinc-800 rounded-xl p-4 text-lg sm:text-xl font-sans text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 border border-zinc-300/80 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-300/60 dark:focus:ring-indigo-900 focus:border-zinc-500 dark:focus:border-indigo-600 focus:bg-white dark:focus:bg-zinc-900 resize-none transition-all leading-relaxed"
              disabled={loading}
              autoFocus
            />

            {/* Examples */}
            <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">
                {t.tryLabel}
              </span>
              {examples.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => {
                    setQuery(ex.text);
                    textAreaRef.current?.focus();
                  }}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300/80 dark:border-zinc-700 hover:bg-zinc-300/80 dark:hover:bg-indigo-900/30 hover:text-zinc-900 dark:hover:text-indigo-300 hover:border-zinc-400 dark:hover:border-indigo-800 transition-all"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {user && cloudCastingHistory.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-300/60 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <History size={12} />
                  <span>{t.recentCloudCastings}</span>
                </div>
                <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                  {cloudCastingHistory.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-zinc-300/70 dark:border-zinc-700/80 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onRecommendation({
                            voiceNames: item.voiceNames,
                            systemInstruction: item.systemInstruction,
                            sampleText: item.sampleText,
                          })
                        }
                        className="flex-1 min-w-0 text-left truncate text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title={item.prompt}
                      >
                        <span className="font-medium">{item.prompt}</span>
                        <span className="ml-2 text-[10px] text-zinc-400 dark:text-zinc-500">
                          ({item.voiceNames.join(', ')})
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void deleteCastingHistoryInFirestore(user.uid, item.id).catch((err) =>
                            console.error('Failed to delete casting history item:', err)
                          );
                        }}
                        className="p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                        aria-label={t.deleteCasting}
                        title={t.deleteCasting}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-6 gap-4">
              <span className="text-zinc-500 dark:text-zinc-500 text-sm font-medium flex items-center gap-2">
                {error ? (
                  <span className="text-red-500 dark:text-red-400 flex items-center gap-1">
                    <X size={14} /> {error}
                  </span>
                ) : (
                  <>
                    {t.poweredBy}{' '}
                    <span className="text-zinc-700 dark:text-indigo-400 font-semibold">
                      Gemini 4
                    </span>
                  </>
                )}
              </span>

              <button
                onClick={handleAnalyze}
                disabled={loading || !query.trim()}
                className="flex items-center gap-2 pl-6 pr-6 py-3 bg-zinc-800 dark:bg-indigo-600 hover:bg-zinc-700 dark:hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-[#FDF7EB] dark:text-white font-medium rounded-full transition-all duration-300 transform active:scale-95 shadow-lg hover:shadow-zinc-900/20 dark:hover:shadow-indigo-500/25 dark:shadow-indigo-900/25 shrink-0"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                <span>{t.findVoices}</span>
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full bg-zinc-700 dark:bg-indigo-500 animate-google-colors"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceFinder;