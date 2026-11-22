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
  Loader2,
  CloudOff,
  Lock,
  Sun,
  Moon,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  FileText,
  HardDrive,
  Volume2,
  Check,
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

type ActiveSubView = 'login' | 'privacy' | 'terms' | 'storage';

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  required = false,
  isDarkMode = false,
  onToggleTheme,
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

  // Render Policy Subview (Privacy Policy or Terms of Service)
  if (activeSubView === 'privacy' || activeSubView === 'terms') {
    const isPrivacy = activeSubView === 'privacy';
    return (
      <div className="policy-shell fixed inset-0 z-[115] overflow-y-auto">
        <header className="policy-header">
          <button
            type="button"
            onClick={() => setActiveSubView('login')}
            className="policy-back"
          >
            <ArrowLeft size={14} />
            <span>{language === 'mm' ? 'ဝင်ရောက်မှု စာမျက်နှာသို့ ပြန်သွားရန်' : 'Back to Studio Sign-In'}</span>
          </button>

          <div className="policy-brand">
            <span className="policy-brand-mark">V</span>
            <span>MMNext <b>Voice Studio</b></span>
          </div>
        </header>

        <main className="policy-content">
          <div className="policy-kicker">
            <ShieldCheck size={13} />
            <span>{isPrivacy ? (language === 'mm' ? 'ကိုယ်ရေးလုံခြုံမှု မူဝါဒ' : 'DATA PROTECTION & INTEGRITY') : (language === 'mm' ? 'ဝန်ဆောင်မှု စည်းကမ်းချက်များ' : 'WORKSPACE TERMS')}</span>
          </div>

          <h1>{isPrivacy ? (language === 'mm' ? 'ကိုယ်ရေးကိုယ်တာ လုံခြုံရေး' : 'Privacy & Security Policy') : (language === 'mm' ? 'ဝန်ဆောင်မှု စည်းမျဉ်းများ' : 'Studio Terms of Service')}</h1>

          <p className="policy-lead">
            {isPrivacy
              ? (language === 'mm'
                  ? 'MMNext Voice Studio သည် သုံးစွဲသူများ၏ ဒေတာလုံခြုံရေးနှင့် သီးသန့်ဖြစ်မှုကို အလေးထားဆောင်ရွက်ပါသည်။ Google Identity Services နှင့် Google Cloud Firebase Enterprise လုံခြုံရေးစည်းမျဉ်းများကို အသုံးပြုထားပါသည်။'
                  : 'MMNext Voice Studio enforces strict client-side data isolation, Google OAuth 2.0 verification, and Firebase Firestore Enterprise security rules to safeguard your sound workspace.')
              : (language === 'mm'
                  ? 'ဤစနစ်သည် မြန်မာဘာသာစကား အသံဖန်တီးမှုနှင့် AI အသံရွေးချယ်မှုများအတွက် တရားဝင် အသုံးပြုနိုင်ရန် ရည်ရွယ်ဖန်တီးထားခြင်း ဖြစ်ပါသည်။'
                  : 'Use of MMNext Voice Studio is governed by Google Gemini AI fair-use principles, high-fidelity speech synthesis quotas, and responsible audio production guidelines.')}
          </p>

          <div className="policy-updated">
            {language === 'mm' ? 'နောက်ဆုံး အတည်ပြုချက်: ၂၀၂၆ နိုဝင်ဘာ' : 'LAST REVISED: NOVEMBER 2026 • SECURITY AUDITED'}
          </div>

          <section>
            <h2>{language === 'mm' ? '၁။ ဒေတာ သိမ်းဆည်းမှု ပုံစံ (Cloud Data Isolation)' : '1. Cloud Data Isolation & Authentication'}</h2>
            <p>
              {language === 'mm'
                ? 'သင့် Google အကောင့် UID ကိုသာ အသုံးပြု၍ သီးသန့် cloud workspace ကို တည်ဆောက်ထားပါသည်။ အခြား မည်သည့် သုံးစွဲသူမျှ သင့်အနှစ်သက်ဆုံး အသံများနှင့် ဇာတ်ကောင်အမည်များကို ကြည့်ရှုခွင့် သို့မဟုတ် ပြင်ဆင်ခွင့် မရှိပါ။'
                : 'Authentication is executed exclusively through Google OAuth popup credentials. Each user profile, bookmarked voice list, and customized Burmese character naming map is locked under strict user-level authorization paths.'}
            </p>
          </section>

          <section>
            <h2>{language === 'mm' ? '၂။ အသံဖန်တီးမှုနှင့် Gemini AI စနစ်' : '2. Speech Synthesis & AI Quota Policy'}</h2>
            <p>
              {language === 'mm'
                ? 'မြန်မာဘာသာစကား အသံနမူနာများနှင့် စာသားမှ အသံပြောင်းလဲခြင်း (TTS) အတွက် Gemini 3.8 speech synthesis မော်ဒယ်များကို အသုံးပြုထားပြီး နေ့စဉ် သတ်မှတ်ချက်များနှင့်အညီ စနစ်တကျ ထိန်းသိမ်းထားပါသည်။'
                : 'All live text-to-speech requests and casting director recommendations run through authenticated server-side Gemini 3.8 pipelines with automated rate-limiting to prevent quota depletion and ensure 24/7 studio uptime.'}
            </p>
          </section>

          <section>
            <h2>{language === 'mm' ? '၃။ လုံခြုံရေး အကာအကွယ်များ' : '3. Granular Firestore Security Verification'}</h2>
            <p>
              {language === 'mm'
                ? 'စနစ်တွင်းရှိ အချက်အလက်အားလုံးကို Firestore Security Rules (The Eight Pillars) ဖြင့် စစ်ဆေးကာကွယ်ထားသဖြင့် သင့်ခွင့်ပြုချက်မရှိဘဲ မည်သည့်ဒေတာမျှ ပျက်စီးဆုံးရှုံးခြင်း မရှိနိုင်ပါ။'
                : 'Our cloud storage enforces structural payload constraints, strict field length limits, immutable timestamp validations, and prevents cross-tenant spoofing across every read and write.'}
            </p>
          </section>

          <div className="policy-note">
            <strong>{language === 'mm' ? 'မှတ်ချက်:' : 'Notice:'}</strong>{' '}
            {language === 'mm'
              ? 'သင့်အကောင့်ကို အချိန်မရွေး လုံခြုံစွာ ထွက်နိုင်ပြီး စက်ပစ္စည်းပြောင်းလဲသည့်အခါ အလွယ်တကူ ပြန်လည်ဝင်ရောက်နိုင်ပါသည်။'
              : 'You may sign out of your studio workspace at any time. Your preferences and saved voice personas will automatically restore upon your next Google sign-in.'}
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => setActiveSubView('login')}
              className="submit-button max-w-xs"
            >
              <span>{language === 'mm' ? 'ဝင်ရောက်မှုသို့ ပြန်သွားမည်' : 'Return to Login'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Render Storage / Library Info Subview
  if (activeSubView === 'storage') {
    return (
      <div className="storage-shell fixed inset-0 z-[115] overflow-y-auto">
        <header className="storage-header">
          <button
            type="button"
            onClick={() => setActiveSubView('login')}
            className="policy-back"
          >
            <ArrowLeft size={14} />
            <span>{language === 'mm' ? 'စတူဒီယိုသို့ ပြန်သွားရန်' : 'Back to Sign-In'}</span>
          </button>

          <div className="policy-brand">
            <span className="policy-brand-mark">V</span>
            <span>MMNext <b>Voice Library</b></span>
          </div>
        </header>

        <main className="storage-content">
          <div className="storage-kicker">
            <HardDrive size={13} />
            <span>{language === 'mm' ? 'အသံသိမ်းဆည်းမှု နည်းပညာ' : 'HIGH-FIDELITY AUDIO STORAGE'}</span>
          </div>

          <h1>{language === 'mm' ? 'အသံစာကြည့်တိုက်နှင့် Cloud စနစ်' : 'Studio Storage & Audio Pipeline'}</h1>
          <p className="storage-lead">
            {language === 'mm'
              ? 'MMNext Voice Studio တွင် အသံနမူနာများကို 24kHz Lossless WAV အရည်အသွေးဖြင့် စနစ်တကျ သိမ်းဆည်းထားပြီး စက်ပစ္စည်းပေါ်တွင် မြန်ဆန်စွာ ဖွင့်နိုင်ရန် စီစဉ်ထားပါသည်။'
              : 'Experience instant high-fidelity audio playback. Voice waveforms, Burmese character overrides, and casting history cache directly with enterprise-grade synchronization.'}
          </p>

          <div className="storage-grid">
            <div className="upload-card">
              <div className="upload-card__icon">
                <Volume2 size={20} />
              </div>
              <h2>{language === 'mm' ? 'အသံနမူနာများ စုစည်းမှု' : 'Voice Pipeline Capabilities'}</h2>
              <p>
                {language === 'mm'
                  ? 'အသံနမူနာများကို အချိန်မရွေး ကြိုတင်စမ်းသပ် နားဆင်နိုင်ပြီး အနှစ်သက်ဆုံး အသံများကို ZIP ဖိုင်အဖြစ် ဒေါင်းလုဒ်လုပ်နိုင်ပါသည်။'
                  : 'Synthesize custom text with native Burmese prosody, compare timbre side-by-side, and download batch favorites in lossless audio packages.'}
              </p>

              <div className="space-y-3 mt-4 text-xs text-[#527064]">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#2daa44]" />
                  <span>{language === 'mm' ? 'မြန်မာ အသံထွက် မှန်ကန်တိကျမှု' : 'Native Myanmar phonetic articulation'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#2daa44]" />
                  <span>{language === 'mm' ? 'အချိန်နှင့်တပြေးညီ အသံလှိုင်း စစ်ဆေးမှု (Pitch Hz Analysis)' : 'Real-time pitch detection & frequency spectrum'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#2daa44]" />
                  <span>{language === 'mm' ? 'Google Cloud Firebase ဖြင့် စင့်ခ်လုပ်ခြင်း' : 'Automatic cloud state backup via Firebase'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubView('login')}
                className="submit-button"
              >
                <span>{language === 'mm' ? 'စတူဒီယိုသို့ ဝင်ရောက်မည်' : 'Proceed to Sign-In'}</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="files-card">
              <div className="files-card__heading">
                <div>
                  <h2>{language === 'mm' ? 'လုံခြုံသော ဒေတာအပိုင်းများ' : 'Protected Workspace Partitions'}</h2>
                  <p className="text-xs text-[#718077] mt-1">
                    {language === 'mm' ? 'သင့် Google အကောင့်နှင့် ချိတ်ဆက်ထားသော ဒေတာများ:' : 'Allocated under your personal authenticated container:'}
                  </p>
                </div>
                <span className="file-count">4</span>
              </div>

              <div className="file-list">
                <div className="file-row">
                  <div className="file-row__icon">
                    <Heart size={16} />
                  </div>
                  <div className="file-row__meta">
                    <strong>{language === 'mm' ? 'အနှစ်သက်ဆုံး အသံစာရင်း (Favorites)' : 'Curated Favorites Collection'}</strong>
                    <small>{language === 'mm' ? 'Cloud တွင် အချိန်နှင့်တပြေးညီ သိမ်းဆည်းသည်' : 'Synchronized to /users/{uid}/favorites'}</small>
                  </div>
                </div>

                <div className="file-row">
                  <div className="file-row__icon">
                    <Users size={16} />
                  </div>
                  <div className="file-row__meta">
                    <strong>{language === 'mm' ? 'ဇာတ်ကောင် အမည်များ (Custom Names)' : 'Personalized Persona Names'}</strong>
                    <small>{language === 'mm' ? 'မြန်မာ/အင်္ဂလိပ် အမည်ပြောင်းလဲမှုများ' : 'Synchronized to /users/{uid}/customNames'}</small>
                  </div>
                </div>

                <div className="file-row">
                  <div className="file-row__icon">
                    <Sliders size={16} />
                  </div>
                  <div className="file-row__meta">
                    <strong>{language === 'mm' ? 'အလုပ်ခွင် စိတ်ကြိုက်ပြင်ဆင်မှု (Preferences)' : 'Studio Preferences & Visualizer Mode'}</strong>
                    <small>{language === 'mm' ? 'Wave, Bars, Mirror နှင့် Theme' : 'Synchronized to /users/{uid} workspace doc'}</small>
                  </div>
                </div>

                <div className="file-row">
                  <div className="file-row__icon">
                    <Sparkles size={16} />
                  </div>
                  <div className="file-row__meta">
                    <strong>{language === 'mm' ? 'AI Casting မှတ်တမ်းများ' : 'AI Casting Director Archive'}</strong>
                    <small>{language === 'mm' ? 'အကြံပြုချက်များနှင့် စနစ်ညွှန်ကြားချက်များ' : 'Synchronized to /users/{uid}/castingHistory'}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
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
              <span>{language === 'mm' ? 'မြန်မာ့ အသံနည်းပညာ စတူဒီယို' : 'BURMESE VOICE AI STUDIO'}</span>
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
            <span>MMNEXT VOICE STUDIO</span>
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
              <span>MMNext <b>Voice Studio</b></span>
            </div>

            <div className="form-panel__top-actions">
              {/* Language Switcher */}
              <div
                className="flex bg-[#eef1e8] p-0.5 rounded-lg border border-[#dfe2d8]"
                role="group"
                aria-label={t.switchLanguage}
              >
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide transition-all ${
                    language === 'en'
                      ? 'bg-[#1b4332] text-[#f8fff7] shadow-sm'
                      : 'text-[#607067] hover:text-[#1b4332]'
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
                      ? 'bg-[#1b4332] text-[#f8fff7] shadow-sm'
                      : 'text-[#607067] hover:text-[#1b4332]'
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
                  className="p-1.5 rounded-lg bg-[#eef1e8] border border-[#dfe2d8] text-[#527064] hover:text-[#1b4332] transition-colors"
                  title={isDarkMode ? t.switchToLight : t.switchToDark}
                  aria-label={isDarkMode ? t.switchToLight : t.switchToDark}
                >
                  {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
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

            {/* Benefit Cards in Green Ledger Tone */}
            <div className="grid gap-2.5 my-6">
              {benefits.map(({ icon: Icon, text, sub }) => (
                <div
                  key={text}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-[#dfe2d8] bg-[#f9faf6] transition-all hover:border-[#b6cbb9] hover:bg-[#f6fbf4]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#dff2e2] text-[#1b4332] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block text-xs font-semibold text-[#1f2e28]">{text}</strong>
                    <span className="block text-[11px] text-[#718077] leading-relaxed mt-0.5">{sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mb-5 rounded-xl bg-[#fff0f0] border border-[#f3c5c5] p-3 text-xs text-[#b7433e] flex items-start justify-between gap-2 animate-fade-in">
                <div className="flex items-start gap-2">
                  <CloudOff size={15} className="shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
                <button
                  type="button"
                  onClick={clearAuthError}
                  className="p-1 rounded hover:bg-[#fad8d8] text-[#b7433e] shrink-0"
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
              <button
                type="button"
                onClick={() => setActiveSubView('privacy')}
                className="footer-link"
              >
                Privacy Policy
              </button>
              <span className="footer-dot">•</span>
              <button
                type="button"
                onClick={() => setActiveSubView('terms')}
                className="footer-link"
              >
                Terms
              </button>
              <span className="footer-dot">•</span>
              <button
                type="button"
                onClick={() => setActiveSubView('storage')}
                className="footer-link"
              >
                Storage
              </button>
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
              className="flex items-center gap-3 p-2.5 rounded-xl border border-[#dfe2d8] bg-[#f8faf5]"
            >
              <span className="w-7 h-7 rounded-lg bg-[#dff2e2] text-[#1b4332] flex items-center justify-center shrink-0">
                <Icon size={14} />
              </span>
              <span className="text-xs font-medium text-[#2d3a33]">{text}</span>
            </div>
          ))}
        </div>

        {authError && (
          <div className="mb-4 rounded-xl bg-[#fff0f0] border border-[#f3c5c5] p-3 text-xs text-[#b7433e] flex items-start justify-between gap-2 animate-fade-in">
            <span className="inline-flex items-start gap-2">
              <CloudOff size={14} className="shrink-0 mt-0.5" />
              <span>{authError}</span>
            </span>
            <button
              type="button"
              onClick={clearAuthError}
              className="p-0.5 rounded hover:bg-[#fad8d8]"
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
