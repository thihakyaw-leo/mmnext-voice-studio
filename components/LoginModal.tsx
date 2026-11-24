/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Heart,
  Sparkles,
  Sliders,
  Users,
  CloudOff,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useFirebase } from './FirebaseProvider';
import LegalPages, { PublicInfoPage } from './LegalPages';
import PWAInstallButton from './PWAInstallButton';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  required?: boolean;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onNavigatePath?: (path: string) => void;
}

type ActiveSubView = 'login' | PublicInfoPage;

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  required = false,
  isDarkMode = false,
  onToggleTheme,
  onNavigatePath,
}) => {
  const { t, language, setLanguage } = useI18n();
  const { user, authBusy, authError, signInWithGoogle, clearAuthError } = useFirebase();
  const [activeSubView, setActiveSubView] = useState<ActiveSubView>('login');
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
      if (e.key === 'Escape') {
        if (activeSubView !== 'login') {
          setActiveSubView('login');
          return;
        }
        if (!required) {
          onClose();
        }
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
  }, [isOpen, required, activeSubView, onClose]);

  if (!isOpen) return null;

  const benefits = [
    { icon: Heart, text: t.loginBenefitFavorites, sub: language === 'mm' ? 'အသံစာရင်းများကို cloud ပေါ်တွင် စင့်ခ်လုပ်ထားနိုင်သည်' : 'Keep your bookmarked voices synchronized across all devices.' },
    { icon: Users, text: t.loginBenefitNames, sub: language === 'mm' ? 'မြန်မာဇာတ်ကောင်အမည်များကို သိမ်းဆည်းနိုင်သည်' : 'Preserve bespoke Myanmar personas and character renames.' },
    { icon: Sliders, text: t.loginBenefitPrefs, sub: language === 'mm' ? 'Theme နှင့် Visualizer ကို အလိုအလျောက် သတိရသည်' : 'Maintain your pitch frequency settings and theme preference.' },
    { icon: Sparkles, text: t.loginBenefitHistory, sub: language === 'mm' ? 'Gemini အသံရွေးချယ်မှု မှတ်တမ်းများကို ပြန်ကြည့်နိုင်သည်' : 'Review recent AI director recommendations anytime.' },
  ];

  const openPublicSubPage = (e: React.MouseEvent, page: PublicInfoPage, path: string) => {
    e.preventDefault();
    if (onNavigatePath) {
      onNavigatePath(path);
    } else {
      setActiveSubView(page);
    }
  };

  if (activeSubView !== 'login') {
    return (
      <LegalPages
        page={activeSubView}
        isDarkMode={isDarkMode}
        onToggleTheme={onToggleTheme || (() => {})}
        onBack={() => setActiveSubView('login')}
        onNavigatePage={(target) => setActiveSubView(target)}
        isAuthenticated={Boolean(user)}
      />
    );
  }

  // When required is true, render the full split Green Ledger login shell
  if (required) {
    return (
      <div className="login-shell" role="dialog" aria-modal="true" aria-labelledby="login-brand-title">
        {/* Left Side: Green Ledger Brand Panel */}
        <aside className="brand-panel">
          <div className="brand-panel__texture" aria-hidden="true" />

          {/* Top of brand panel */}
          <div className="flex items-center justify-between z-10">
            <div className="brand-chip">
              <span className="brand-chip__dot" />
              <span>MMNext AI Voice Studio</span>
            </div>
          </div>

          {/* Center Content */}
          <div className="brand-panel__content">
            <div className="brand-mark-wrap">
              <img
                src="/assets/aistudio/1Artboard_1_2x_180530e3.png"
                alt={t.appTitle}
                className="brand-mark"
              />
            </div>

            <div className="brand-kicker">
              {language === 'mm' ? 'Google Gemini ဖြင့် စွမ်းဆောင်ထားသည်' : 'AUTHENTIC BURMESE SPEECH'}
            </div>

            <h1 id="login-brand-title">
              {language === 'mm' ? (
                <>
                  မြန်မာ့ <em>အသံစတူဒီယို</em>
                </>
              ) : (
                <>
                  Voice of <em>Myanmar</em>
                </>
              )}
            </h1>

            <p className="brand-copy">
              {language === 'mm'
                ? 'Google Gemini စနစ်ဖြင့် မြန်မာဘာသာစကား အသံအရည်အသွေးမြင့် ဖန်တီးမှု၊ ဇာတ်ကောင် အသံရွေးချယ်မှုနှင့် Pitch Frequency စစ်ဆေးမှုများကို စတူဒီယိုအဆင့် အသုံးပြုနိုင်ပါသည်။'
                : 'Studio-grade Burmese voice synthesis and intelligent character casting powered by Google Gemini. Explore authentic regional timbres, emotional styles, and custom personas with precision pitch analysis.'}
            </p>

            <div className="brand-rule" aria-hidden="true">
              <span />
              <img src="/assets/aistudio/1Artboard_1_2x_180530e3.png" alt="" />
              <span />
            </div>
          </div>

          {/* Brand Footer */}
          <footer className="brand-panel__footer">
            <span>MMNEXT STUDIO</span>
            <span className="footer-divider" />
            <span>GEMINI 3.8 SPEECH</span>
          </footer>
        </aside>

        {/* Right Side: Form Panel */}
        <section className="form-panel">
          {/* Top Bar */}
          <header className="form-panel__topbar">
            <div className="compact-brand">
              <img src="/assets/aistudio/1Artboard_1_2x_180530e3.png" alt="Logo" />
              <span>MMNext <b>Studio</b></span>
            </div>

            <div className="form-panel__top-actions">
              <PWAInstallButton variant="header" />
              {/* Language Switcher */}
              <div
                className="flex bg-[#eef1e8] dark:bg-[#092E24] p-0.5 rounded-lg border border-[#dfe2d8] dark:border-[#C6A259]/25"
                role="group"
                aria-label={t.switchLanguage}
              >
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide transition-all ${
                    language === 'en'
                      ? 'bg-[#1b4332] dark:bg-[#C6A259] text-[#f8fff7] dark:text-[#041813] shadow-sm'
                      : 'text-[#607067] dark:text-[#9EB5AC] hover:text-[#1b4332] dark:hover:text-[#FAF6EC]'
                  }`}
                  aria-pressed={language === 'en'}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('mm')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide transition-all ${
                    language === 'mm'
                      ? 'bg-[#1b4332] dark:bg-[#C6A259] text-[#f8fff7] dark:text-[#041813] shadow-sm'
                      : 'text-[#607067] dark:text-[#9EB5AC] hover:text-[#1b4332] dark:hover:text-[#FAF6EC]'
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#eef1e8] dark:bg-[#092E24] border border-[#dfe2d8] dark:border-[#C6A259]/25 text-[#527064] dark:text-[#DFC589] hover:text-[#1b4332] dark:hover:text-[#FAF6EC] text-[11px] font-semibold transition-colors"
                  title={isDarkMode ? t.switchToLight : t.switchToDark}
                  aria-label={isDarkMode ? t.switchToLight : t.switchToDark}
                >
                  {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                  <span className="hidden sm:inline">{isDarkMode ? t.lightMode : t.darkMode}</span>
                </button>
              )}
            </div>
          </header>

          {/* Form Content Column */}
          <div className="form-column" ref={modalRef}>
            <div className="form-intro">
              <div className="form-eyebrow">
                <Sparkles size={13} />
                <span>{language === 'mm' ? 'လုံခြုံသော စတူဒီယို ဝင်ရောက်မှု' : 'SECURE STUDIO ACCESS'}</span>
              </div>
              <h2>{t.loginTitle}</h2>
              <p>{t.signInRequiredNotice}</p>
            </div>

            {/* Benefit Cards in Green Ledger / Emerald Gold Tone */}
            <div className="grid gap-2.5 my-6">
              {benefits.map(({ icon: Icon, text, sub }) => (
                <div
                  key={text}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-[#dfe2d8] dark:border-[#C6A259]/20 bg-[#f9faf6] dark:bg-[#092E24]/85 transition-all hover:border-[#b6cbb9] dark:hover:border-[#C6A259]/45 hover:bg-[#f6fbf4] dark:hover:bg-[#0D3A2E]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#dff2e2] dark:bg-[#114637] text-[#1b4332] dark:text-[#EAD7A4] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block text-xs font-semibold text-[#1f2e28] dark:text-[#FAF6EC]">{text}</strong>
                    <span className="block text-[11px] text-[#718077] dark:text-[#9EB5AC] leading-relaxed mt-0.5">{sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mb-5 rounded-xl bg-[#fff0f0] dark:bg-[#2B1011] border border-[#f3c5c5] dark:border-[#7F2929] p-3 text-xs text-[#b7433e] dark:text-[#FCA5A5] flex items-start justify-between gap-2 animate-fade-in">
                <div className="flex items-start gap-2">
                  <CloudOff size={15} className="shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
                <button
                  type="button"
                  onClick={clearAuthError}
                  className="p-1 rounded hover:bg-[#fad8d8] dark:hover:bg-[#451718] text-[#b7433e] dark:text-[#FCA5A5] shrink-0"
                  aria-label={t.close}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Primary Google Login Button */}
            <div className="login-form">
              <button
                ref={googleButtonRef}
                type="button"
                disabled={authBusy}
                onClick={() => void signInWithGoogle()}
                className="submit-button"
              >
                <div className="flex items-center gap-3">
                  {authBusy ? (
                    <div className="button-spinner" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0 bg-white p-0.5 rounded-full" viewBox="0 0 24 24" aria-hidden="true">
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
                </div>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="form-divider">
              <span>{language === 'mm' ? 'လုံခြုံရေး အဆင့်အတန်း' : 'ENTERPRISE IDENTITY'}</span>
            </div>

            <p className="help-copy">
              {language === 'mm'
                ? 'Google OAuth 2.0 နှင့် Firebase Firestore Rules ဖြင့် သင့်အချက်အလက်များကို ကာကွယ်ထားပါသည်။'
                : 'Protected by Google OAuth 2.0 & Firebase Firestore Eight Pillars Security Rules.'}
            </p>
          </div>

          {/* Form Bottom Links */}
          <footer className="form-panel__bottom">
            <div>
              <span>© 2026 MMNEXT STUDIO</span>
            </div>

            <div className="flex items-center gap-1">
              <a
                href="/privacy-policy"
                onClick={(e) => openPublicSubPage(e, 'privacy', '/privacy-policy')}
                className="footer-link"
              >
                Privacy Policy
              </a>
              <span className="footer-dot">•</span>
              <a
                href="/terms"
                onClick={(e) => openPublicSubPage(e, 'terms', '/terms')}
                className="footer-link"
              >
                Terms
              </a>
              <span className="footer-dot">•</span>
              <a
                href="/storage"
                onClick={(e) => openPublicSubPage(e, 'storage', '/storage')}
                className="footer-link"
              >
                Storage
              </a>
            </div>
          </footer>
        </section>
      </div>
    );
  }

  // When required is false, render the Green Ledger Dialog modal
  return (
    <div
      className="reset-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
    >
      <div className="reset-dialog" ref={modalRef}>
        <button
          type="button"
          onClick={onClose}
          className="reset-close"
          aria-label={t.close}
        >
          <X size={16} />
        </button>

        <div className="form-eyebrow">
          <Sparkles size={13} />
          <span>{t.cloudAccountSection}</span>
        </div>

        <h2 id="reset-dialog-title">{t.loginTitle}</h2>
        <p>{t.loginSubtitle}</p>

        {/* Benefits List */}
        <div className="space-y-2.5 my-6">
          {benefits.map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-[#dfe2d8] dark:border-[#C6A259]/20 bg-[#f8faf5] dark:bg-[#092E24]/85"
            >
              <span className="w-7 h-7 rounded-lg bg-[#dff2e2] dark:bg-[#114637] text-[#1b4332] dark:text-[#EAD7A4] flex items-center justify-center shrink-0">
                <Icon size={14} />
              </span>
              <span className="text-xs font-medium text-[#2d3a33] dark:text-[#FAF6EC]">{text}</span>
            </div>
          ))}
        </div>

        {authError && (
          <div className="mb-4 rounded-xl bg-[#fff0f0] dark:bg-[#2B1011] border border-[#f3c5c5] dark:border-[#7F2929] p-3 text-xs text-[#b7433e] dark:text-[#FCA5A5] flex items-start justify-between gap-2 animate-fade-in">
            <span className="inline-flex items-start gap-2">
              <CloudOff size={14} className="shrink-0 mt-0.5" />
              <span>{authError}</span>
            </span>
            <button
              type="button"
              onClick={clearAuthError}
              className="p-0.5 rounded hover:bg-[#fad8d8] dark:hover:bg-[#451718]"
              aria-label={t.close}
            >
              <X size={12} />
            </button>
          </div>
        )}

        <button
          ref={googleButtonRef}
          type="button"
          disabled={authBusy}
          onClick={() => void signInWithGoogle()}
          className="submit-button"
        >
          <div className="flex items-center gap-3">
            {authBusy ? (
              <div className="button-spinner" />
            ) : (
              <svg className="w-4 h-4 shrink-0 bg-white p-0.5 rounded-full" viewBox="0 0 24 24" aria-hidden="true">
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
          </div>
          <ArrowRight size={16} />
        </button>

        <p className="reset-note">
          {language === 'mm'
            ? 'သင့်အကောင့်ကို လုံခြုံစွာ စင့်ခ်လုပ်ထားပြီး အချိန်မရွေး ပြန်လည်ဝင်ရောက်နိုင်ပါသည်။'
            : 'Your favorited voices and personal workspace settings sync securely to your Google Cloud Firebase account.'}
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
