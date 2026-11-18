/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, Check, AlertCircle, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { useFirebase } from './FirebaseProvider';
import { saveUserApiKeyInFirestore } from '../firebase';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  required?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, required = false }) => {
  const { language } = useI18n();
  const { user } = useFirebase();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const local = localStorage.getItem('mmnext_user_gemini_api_key') || '';
        setApiKeyInput(local);
      } catch {
        setApiKeyInput('');
      }
      setSuccessMsg(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setErrorMsg(language === 'mm' ? 'API Key ထည့်သွင်းပါ' : 'Please enter a valid API key.');
      return;
    }
    if (!trimmed.startsWith('AIza')) {
      setErrorMsg(language === 'mm' ? 'မှန်ကန်သော Gemini API Key ပုံစံ (AIza...) ဖြစ်ရပါမည်။' : 'Invalid API key format. Google Gemini keys typically start with "AIza".');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      if (user) {
        await saveUserApiKeyInFirestore(user.uid, trimmed);
      } else {
        localStorage.setItem('mmnext_user_gemini_api_key', trimmed);
      }
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || (language === 'mm' ? 'သိမ်းဆည်းမှု မအောင်မြင်ပါ' : 'Failed to save API key.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 md:p-8 overflow-hidden">
        {!required && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {language === 'mm' ? 'Gemini API Key နှင့် Credit' : 'Gemini API Key & Credit'}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {language === 'mm'
                ? 'AI အသံဖန်တီးမှုနှင့် ရွေးချယ်မှုများအတွက် သင့်ကိုယ်ပိုင် Gemini API Key ဖြင့် သုံးပါ'
                : 'Use your personal Gemini credit and API key for AI generation and speech.'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-900/50">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-sm border border-emerald-200 dark:border-emerald-900/50">
            <Check className="w-4 h-4 shrink-0" />
            <span>{language === 'mm' ? 'API Key အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!' : 'API key saved successfully!'}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              {language === 'mm' ? 'ကိုယ်ပိုင် Gemini API Key (AIza...)' : 'Personal Gemini API Key (AIza...)'}
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono text-sm"
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 hover:underline font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {language === 'mm' ? 'Google AI Studio မှ အခမဲ့ API Key ရယူရန်' : 'Get a free API key from Google AI Studio'}
            </a>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            {!required && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {language === 'mm' ? 'မလုပ်တော့ပါ' : 'Cancel'}
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
