/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, Check, AlertCircle, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { useFirebase } from './FirebaseProvider';
import { getFirebaseAuthHeaders, saveUserApiKeyInFirestore } from '../firebase';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  required?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, required = false }) => {
  const { language } = useI18n();
  const { user, cloudPreferences } = useFirebase();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const local = localStorage.getItem('mmnext_user_gemini_api_key') || '';
        setApiKeyInput(local || cloudPreferences?.apiKey || '');
      } catch {
        setApiKeyInput(cloudPreferences?.apiKey || '');
      }
      setSuccessMsg(false);
      setErrorMsg(null);
    }
  }, [isOpen, cloudPreferences?.apiKey]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setErrorMsg(language === 'mm' ? 'API Key ထည့်သွင်းပါ' : 'Please enter a valid API key.');
      return;
    }
    if (/\s/.test(trimmed)) {
      setErrorMsg(
        language === 'mm'
          ? 'API Key ထဲတွင် Space သို့မဟုတ် Line Break မပါဝင်ရပါ။ Key ကို ပြန်လည် Copy ကူးထည့်ပါ။'
          : 'API key cannot contain spaces or line breaks. Please copy and paste the key again.'
      );
      return;
    }
    if (!trimmed.startsWith('AQ.') && !trimmed.startsWith('AIza')) {
      setErrorMsg(
        language === 'mm'
          ? 'Google Gemini API Key သည် "AQ." သို့မဟုတ် "AIza" ဖြင့် စတင်ရပါမည်။ (Google AI Studio မှ ရယူနိုင်သည်)'
          : 'Google Gemini API keys must start with "AQ." or "AIza". Please get a valid key from Google AI Studio.'
      );
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      let verifyResp: Response | null = null;
      let verifyData: any = {};
      let forceRefresh = false;

      for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 90_000);
        try {
          const authHeaders = await getFirebaseAuthHeaders(forceRefresh);
          verifyResp = await fetch('/api/validate-api-key', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders,
            },
            body: JSON.stringify({ apiKey: trimmed }),
            signal: controller.signal,
          });
          verifyData = await verifyResp.json().catch(() => ({}));
          if (verifyResp.status === 401 && !forceRefresh && attempt === 0) {
            forceRefresh = true;
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
          if ((verifyResp.status >= 500 || verifyResp.status === 408) && attempt === 0) {
            await new Promise((r) => setTimeout(r, 900));
            continue;
          }
          break;
        } catch (fetchErr: any) {
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 900));
            continue;
          }
          if (fetchErr?.name === 'AbortError') {
            throw new Error(
              language === 'mm'
                ? 'API Key စစ်ဆေးမှု Timeout ဖြစ်သွားပါသည်။ ထပ်မံကြိုးစားပါ။'
                : 'API key validation timed out. Please try again.'
            );
          }
          throw fetchErr;
        } finally {
          window.clearTimeout(timer);
        }
      }

      if (!verifyResp || !verifyResp.ok) {
        throw new Error(
          verifyData?.error ||
            (language === 'mm'
              ? 'API Key စစ်ဆေးမှု မအောင်မြင်ပါ။ Google AI Studio မှ Key မှန်ကန်မှုကို စစ်ဆေးပါ။'
              : 'API key verification failed. Please check that your key is active in Google AI Studio.')
        );
      }

      if (user) {
        await saveUserApiKeyInFirestore(user.uid, trimmed);
      } else {
        localStorage.setItem('mmnext_user_gemini_api_key', trimmed);
      }
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err?.message || (language === 'mm' ? 'သိမ်းဆည်းမှု မအောင်မြင်ပါ' : 'Failed to save API key.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#020E0B]/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF6EC] dark:bg-[#06231B] border border-[#D9CEB8] dark:border-[#C6A259]/28 luminous-hairline shadow-2xl p-6 md:p-8 overflow-hidden animate-slide-up">
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#DFC589]/20 to-transparent dark:from-[#145240]/35 dark:to-transparent pointer-events-none" />
        {!required && (
          <button
            onClick={onClose}
            className="relative z-10 float-right text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC] p-2 rounded-full hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors"
            aria-label={language === 'mm' ? 'ပိတ်မည်' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="relative flex items-center gap-3.5 mb-5">
          <div className="p-3 rounded-xl bg-[#EBE2CE] dark:bg-[#114637] border border-[#B49049]/40 dark:border-[#C6A259]/30 text-[#7D602D] dark:text-[#DFC589] shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-medium tracking-tight text-[#06231B] dark:text-[#FAF6EC]">
              {language === 'mm' ? 'Gemini API Key နှင့် Credit' : 'Gemini API Key & Credit'}
            </h2>
            <p className="text-sm text-[#3D5F53] dark:text-[#9EB5AC] mt-0.5">
              {language === 'mm'
                ? 'AI အသံဖန်တီးမှုနှင့် ရွေးချယ်မှုများအတွက် သင့်ကိုယ်ပိုင် Gemini API Key ဖြင့် သုံးပါ'
                : 'Use your personal Gemini credit and API key for AI generation and speech.'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="relative mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-200 text-sm border border-rose-200 dark:border-rose-800/70">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="relative mb-4 flex items-center gap-2 p-3 rounded-xl bg-[#E6F1EC] dark:bg-[#0D3A2E]/80 text-[#114637] dark:text-[#EAD7A4] text-sm border border-[#236D56]/30 dark:border-[#C6A259]/35">
            <Check className="w-4 h-4 shrink-0" />
            <span>{language === 'mm' ? 'API Key အောင်မြင်စွာ စစ်ဆေးသိမ်းဆည်းပြီးပါပြီ!' : 'API key verified and saved!'}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="relative space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#143D32] dark:text-[#E5DEC9] mb-1.5">
              {language === 'mm'
                ? 'ကိုယ်ပိုင် Gemini API Key (AQ... သို့မဟုတ် AIza...)'
                : 'Personal Gemini API Key (AQ... or AIza...)'}
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AQ.Ab... or AIzaSy..."
              className="w-full px-4 py-3 rounded-xl bg-[#F4EDE0]/90 dark:bg-[#041813]/85 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#FAF6EC] placeholder-[#5B7469]/60 dark:placeholder-[#8DA399]/60 focus:outline-none focus:ring-2 focus:ring-[#B49049]/45 dark:focus:ring-[#DFC589]/40 font-mono text-sm transition-all"
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#5B7469] dark:text-[#8DA399] pt-1">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#7D602D] dark:text-[#DFC589] hover:underline font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {language === 'mm' ? 'Google AI Studio မှ အခမဲ့ API Key ရယူရန်' : 'Get a free API key from Google AI Studio'}
            </a>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D9CEB8] dark:border-[#C6A259]/20">
            {!required && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#3D5F53] dark:text-[#9EB5AC] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors"
              >
                {language === 'mm' ? 'မလုပ်တော့ပါ' : 'Cancel'}
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 font-semibold text-sm shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>{language === 'mm' ? 'သိမ်းဆည်းနေသည်...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === 'mm' ? 'API Key သိမ်းမည်' : 'Save API Key'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
