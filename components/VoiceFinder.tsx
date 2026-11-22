/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '../genaiProxy';
import { Sparkles, Loader2, X, ArrowRight, Wand2, History, Trash2, Key, FolderSearch } from 'lucide-react';
import { Voice, AiRecommendation } from '../types';
import { useI18n } from '../i18n';
import { useFirebase } from './FirebaseProvider';
import {
  deleteCastingHistoryInFirestore,
  getGoogleDriveAccessToken,
  MAX_PROMPT_LENGTH,
} from '../firebase';
import { DriveAuthError, readPickedDriveFileContent } from '../utils/googleDrive';
import { openGoogleDrivePicker } from '../utils/googlePicker';

interface VoiceFinderProps {
  voices: Voice[];
  onRecommendation: (rec: AiRecommendation | null, promptText?: string) => void;
  onClose: () => void;
  onOpenApiKeySettings?: () => void;
}

const VoiceFinder: React.FC<VoiceFinderProps> = ({
  voices,
  onRecommendation,
  onClose,
  onOpenApiKeySettings,
}) => {
  const { t, language } = useI18n();
  const { user, cloudCastingHistory, connectGoogleDrive, disconnectGoogleDrive } = useFirebase();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPickingBrief, setIsPickingBrief] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyError, setIsApiKeyError] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap implementation
  useEffect(() => {
    textAreaRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPickingBrief) return;
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
  }, [onClose, isPickingBrief]);

  const examples = [
    { label: t.exampleIrishLabel, text: t.exampleIrishText },
    { label: t.exampleSgLabel, text: t.exampleSgText },
    ...(language === 'mm' ? [{ label: t.exampleMmLabel, text: t.exampleMmText }] : []),
  ];

  const handlePickBriefFromDrive = async () => {
    if (isPickingBrief || loading) return;
    setError(null);
    setIsApiKeyError(false);

    let token = getGoogleDriveAccessToken();
    if (!token) {
      token = await connectGoogleDrive();
    }
    if (!token) return;

    setIsPickingBrief(true);
    try {
      const picked = await openGoogleDrivePicker(token, {
        title: t.pickerLoadBriefBtn,
      });
      if (!picked) return;

      const content = await readPickedDriveFileContent(token, picked);
      if (content.kind !== 'text') {
        setError(t.pickerUnsupportedFileNotice);
        return;
      }
      const nextBrief = content.text.trim().slice(0, MAX_PROMPT_LENGTH);
      if (!nextBrief) {
        setError(t.pickerEmptyTextNotice);
        return;
      }
      setQuery(nextBrief);
      textAreaRef.current?.focus();
    } catch (err) {
      if (err instanceof DriveAuthError) {
        disconnectGoogleDrive();
        setError(t.driveTokenExpiredNotice);
      } else {
        setError(err instanceof Error ? err.message : t.driveSaveFailedError);
      }
    } finally {
      setIsPickingBrief(false);
    }
  };

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setIsApiKeyError(false);

    try {
      const ai = new GoogleGenAI({ apiKey: 'server-side' });

      const simplifiedVoices = voices.map((v) => ({
        name: v.name,
        ...(v.characterName?.mm ? { characterName: v.characterName.mm } : {}),
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

      const rawText = (response.text || '{}')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const result = JSON.parse(rawText || '{}');

      const voiceByLower = new Map(voices.map((v) => [v.name.toLowerCase(), v.name]));
      const normalizedVoices: string[] = Array.isArray(result.recommendedVoices)
        ? Array.from(
            new Set(
              result.recommendedVoices
                .map((v: unknown) =>
                  typeof v === 'string' ? voiceByLower.get(v.trim().toLowerCase()) : undefined
                )
                .filter((v: string | undefined): v is string => Boolean(v))
            )
          )
        : [];

      if (normalizedVoices.length > 0) {
        onRecommendation(
          {
            voiceNames: normalizedVoices,
            systemInstruction:
              typeof result.systemInstruction === 'string' && result.systemInstruction.trim()
                ? result.systemInstruction
                : 'Speak naturally with clear diction.',
            sampleText:
              typeof result.sampleText === 'string' && result.sampleText.trim()
                ? result.sampleText
                : 'မင်္ဂလာပါ။ ယနေ့အတွက် အသံစမ်းသပ်နားထောင်နေပါသည်။',
          },
          query.trim()
        );
      } else {
        setError(t.noMatchingVoicesError);
      }
    } catch (err: any) {
      console.error('AI Error:', err);
      const rawMsg = typeof err?.message === 'string' ? err.message.trim() : '';
      const keyRelated =
        /api key|API_KEY|AQ\.|AIza|UNAUTHENTICATED|Authentication required|PERMISSION_DENIED/i.test(
          rawMsg
        );
      setIsApiKeyError(keyRelated);

      if (keyRelated) {
        setError(
          language === 'mm'
            ? 'Gemini API Key မရှိသေးပါ သို့မဟုတ် Key မှားယွင်းနေပါသည်။ API Key ကို ပြန်လည်စစ်ဆေးထည့်သွင်းပါ။'
            : rawMsg || 'Valid Gemini API key required. Please check your API key settings.'
        );
      } else if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(rawMsg)) {
        setError(
          language === 'mm'
            ? 'API Key ၏ Quota သို့မဟုတ် Rate Limit ပြည့်သွားပါသည်။ ခေတ္တစောင့်ပြီး ထပ်မံကြိုးစားပါ။'
            : rawMsg
        );
      } else if (/503|UNAVAILABLE|high demand|temporarily/i.test(rawMsg)) {
        setError(
          language === 'mm'
            ? 'Google AI မော်ဒယ် ယာယီအသုံးများနေပါသည်။ စက္ကန့်အနည်းငယ်စောင့်ပြီး ထပ်မံနှိပ်ကြည့်ပါ။'
            : rawMsg
        );
      } else if (/timed out|timeout|504|408/i.test(rawMsg)) {
        setError(
          language === 'mm'
            ? 'ချိတ်ဆက်မှု Timeout ဖြစ်သွားပါသည်။ ထပ်မံကြိုးစားကြည့်ပါ။'
            : rawMsg
        );
      } else if (rawMsg && !rawMsg.startsWith('{')) {
        setError(rawMsg);
      } else {
        setError(t.analysisFailedError);
      }
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
        className="absolute inset-0 bg-[#020E0B]/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-[#FAF6EC] dark:bg-[#06231B] border border-[#D9CEB8] dark:border-[#C6A259]/28 luminous-hairline rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Subtle Atmospheric Header Diffusion */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-[#EBE2CE]/70 via-[#FAF6EC]/20 to-transparent dark:from-[#114637]/45 dark:via-[#06231B]/10 dark:to-transparent pointer-events-none"></div>

        <div className="relative p-8 sm:p-10">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#7D602D] dark:text-[#DFC589] mb-2">
                <Wand2 size={18} />
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase">
                  {t.aiCastingDirector}
                </span>
              </div>
              <h2
                id="casting-title"
                className="text-3xl sm:text-4xl font-serif font-medium tracking-tight text-[#06231B] dark:text-[#FAF6EC] leading-tight"
              >
                {t.castingTitle}
              </h2>
              <p className="text-base sm:text-lg text-[#5B7469] dark:text-[#9EB5AC] font-light">
                {t.castingSubtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#EBE2CE]/80 dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/20 text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC] hover:bg-[#DFD3BA] dark:hover:bg-[#114637] transition-colors"
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
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && query.trim() && !loading) {
                  e.preventDefault();
                  void handleAnalyze();
                }
              }}
              placeholder={t.castingPlaceholder}
              className="w-full h-32 bg-[#FAF6EC] dark:bg-[#041813]/90 rounded-xl p-4 text-lg sm:text-xl font-sans text-[#06231B] dark:text-[#FAF6EC] placeholder-[#5B7469]/65 dark:placeholder-[#8DA399]/55 border border-[#D9CEB8] dark:border-[#C6A259]/25 focus:outline-none focus:ring-2 focus:ring-[#B49049]/40 dark:focus:ring-[#DFC589]/40 focus:border-[#B49049] dark:focus:border-[#DFC589]/60 resize-none transition-all leading-relaxed"
              disabled={loading}
              autoFocus
            />

            {/* Examples */}
            <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
              <span className="text-[11px] font-bold text-[#7D602D] dark:text-[#C6A259] uppercase tracking-[0.12em]">
                {t.tryLabel}
              </span>
              {examples.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => {
                    setQuery(ex.text);
                    textAreaRef.current?.focus();
                  }}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-[#EBE2CE]/80 dark:bg-[#092E24] text-[#06231B] dark:text-[#EAD7A4] border border-[#D9CEB8] dark:border-[#C6A259]/25 hover:bg-[#DFD3BA] dark:hover:bg-[#114637] hover:border-[#B49049] dark:hover:border-[#DFC589]/50 transition-all"
                >
                  {ex.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void handlePickBriefFromDrive()}
                disabled={loading || isPickingBrief}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-[#FAF6EC] dark:bg-[#041813] text-[#7D602D] dark:text-[#DFC589] border border-[#B49049]/40 dark:border-[#C6A259]/35 hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-all disabled:opacity-50"
              >
                {isPickingBrief ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <FolderSearch size={12} />
                )}
                <span>{isPickingBrief ? t.openingGooglePicker : t.pickerLoadBriefBtn}</span>
              </button>
            </div>

            {user && cloudCastingHistory.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#D9CEB8]/80 dark:border-[#C6A259]/20 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#7D602D] dark:text-[#C6A259]">
                  <History size={12} />
                  <span>{t.recentCloudCastings}</span>
                </div>
                <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                  {cloudCastingHistory.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#F4EDE0]/90 dark:bg-[#041813]/85 border border-[#D9CEB8]/90 dark:border-[#C6A259]/20 text-xs"
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
                        className="flex-1 min-w-0 text-left truncate text-[#06231B] dark:text-[#FAF6EC] hover:text-[#7D602D] dark:hover:text-[#DFC589] transition-colors"
                        title={item.prompt}
                      >
                        <span className="font-medium">{item.prompt}</span>
                        <span className="ml-2 text-[10px] text-[#5B7469] dark:text-[#8DA399]">
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
                        className="p-1 rounded-md text-[#5B7469] dark:text-[#8DA399] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
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

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-6 gap-4">
              <div className="text-[#5B7469] dark:text-[#8DA399] text-sm font-medium flex flex-wrap items-center gap-2 min-w-0">
                {error ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-rose-600 dark:text-rose-400 flex items-start gap-1.5 leading-snug">
                      <X size={14} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </span>
                    {isApiKeyError && onOpenApiKeySettings && (
                      <button
                        type="button"
                        onClick={onOpenApiKeySettings}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EBE2CE] dark:bg-[#114637] text-[#7D602D] dark:text-[#DFC589] border border-[#B49049]/40 dark:border-[#C6A259]/35 text-xs font-semibold hover:bg-[#DFD3BA] dark:hover:bg-[#195E4A] transition-colors"
                      >
                        <Key size={12} />
                        <span>
                          {language === 'mm' ? 'API Key စစ်ဆေး/ထည့်ရန်' : 'Set API Key'}
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {t.poweredBy}{' '}
                    <span className="text-[#7D602D] dark:text-[#DFC589] font-semibold">
                      Gemini 4
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading || !query.trim()}
                className="flex items-center gap-2 pl-6 pr-6 py-3 bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 font-medium rounded-full transition-all duration-300 transform active:scale-95 shadow-lg shrink-0"
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
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#EBE2CE] dark:bg-[#041813]">
            <div className="h-full animate-google-colors"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceFinder;