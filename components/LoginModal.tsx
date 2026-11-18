/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import {
  X,
  Cloud,
  Heart,
  Sparkles,
  Sliders,
  Users,
  Loader2,
  CloudOff,
  Lock,
  Sun,
  Moon,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useFirebase } from './FirebaseProvider';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  required?: boolean;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  required = false,
  isDarkMode = false,
  onToggleTheme,
}) => {
  const { t, language, setLanguage } = useI18n();
  const { user, authBusy, authError, signInWithGoogle, clearAuthError } = useFirebase();
  const modalRef = useRef<HTMLDivElement>(null);
  const googleButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && user && !required) {
      onClose();
    }
  }, [isOpen, user, required, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    googleButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !required) {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusable = modalRef.current.querySelectorAll(
        'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, required, onClose]);

  if (!isOpen) return null;

  const benefits = [
    { icon: Heart, text: t.loginBenefitFavorites },
    { icon: Users, text: t.loginBenefitNames },
    { icon: Sliders, text: t.loginBenefitPrefs },
    { icon: Sparkles, text: t.loginBenefitHistory },
  ];

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div
        className={`absolute inset-0 animate-fade-in ${
          required ? 'bg-[#FDF7EB]/90 dark:bg-[#09090b]/90 backdrop-blur-md' : 'bg-zinc-900/60 backdrop-blur-sm'
        }`}
        onClick={required ? undefined : onClose}
      />

      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-[#FDF7EB] dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden animate-slide-up ring-1 ring-zinc-300/80 dark:ring-zinc-800"
      >
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-zinc-200/60 to-transparent dark:from-indigo-900/25 dark:to-transparent pointer-events-none" />

        <div className="relative p-7 sm:p-8">
          {/* Top-right controls: Language & Theme when required gate, or Close when optional */}
          <div className="flex items-center justify-end gap-1.5 mb-2">
            {required && (
              <>
                <div
                  className="flex bg-zinc-200/70 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-300/70 dark:border-zinc-700"
                  role="group"
                  aria-label={t.switchLanguage}
                >
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide transition-all ${
                      language === 'en'
                        ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                    aria-pressed={language === 'en'}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('mm')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide transition-all ${
                      language === 'mm'
                        ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                    aria-pressed={language === 'mm'}
                  >
                    MM
                  </button>
                </div>

                {onToggleTheme && (
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="p-2 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    title={isDarkMode ? t.switchToLight : t.switchToDark}
                    aria-label={isDarkMode ? t.switchToLight : t.switchToDark}
                  >
                    {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                  </button>
                )}
              </>
            )}

            {!required && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-300/70 dark:hover:bg-zinc-700 transition-colors"
                aria-label={t.close}
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-zinc-900/10 ring-1 ring-zinc-300/70 dark:ring-zinc-700 mb-4">
              <img
                src="/assets/aistudio/1Artboard_1_2x_180530e3.png"
                alt={t.appTitle}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/70 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 mb-2">
              {required ? <Lock size={11} /> : <Cloud size={12} />}
              <span>{t.cloudAccountSection}</span>
            </div>

            <h2
              id="login-modal-title"
              className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-zinc-900 dark:text-white"
            >
              {t.loginTitle}
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {required ? t.signInRequiredNotice : t.loginSubtitle}
            </p>
          </div>

          <div className="space-y-2.5 mb-6 bg-white/70 dark:bg-zinc-800/50 border border-zinc-300/60 dark:border-zinc-800 rounded-2xl p-4">
            {benefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                <span className="w-7 h-7 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-300/60 dark:border-zinc-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Icon size={14} />
                </span>
                <span className="leading-snug">{text}</span>
              </div>
            ))}
          </div>

          {authError && (
            <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-700 dark:text-rose-200 flex items-start justify-between gap-2">
              <span className="inline-flex items-start gap-2 leading-relaxed">
                <CloudOff size={15} className="shrink-0 mt-0.5" />
                <span>{authError}</span>
              </span>
              <button
                type="button"
                onClick={clearAuthError}
                className="p-0.5 rounded hover:bg-rose-200/60 dark:hover:bg-rose-900/60 shrink-0"
                aria-label={t.close}
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div>
            <button
              ref={googleButtonRef}
              type="button"
              disabled={authBusy}
              onClick={() => void signInWithGoogle()}
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-semibold shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {authBusy ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
              )}
              <span>{authBusy ? t.signingIn : t.continueWithGoogle}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
