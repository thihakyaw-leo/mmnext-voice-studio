/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  HardDrive,
  Heart,
  Moon,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Users,
  Volume2,
} from 'lucide-react';
import { useI18n } from '../i18n';

export type PublicInfoPage = 'privacy' | 'terms' | 'storage';

interface LegalPagesProps {
  page: PublicInfoPage;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  onNavigatePage: (page: PublicInfoPage) => void;
  isAuthenticated?: boolean;
}

const LegalPages: React.FC<LegalPagesProps> = ({
  page,
  isDarkMode,
  onToggleTheme,
  onBack,
  onNavigatePage,
  isAuthenticated = false,
}) => {
  const { t, language, setLanguage } = useI18n();

  const handleLinkClick = (e: React.MouseEvent, target: PublicInfoPage) => {
    e.preventDefault();
    onNavigatePage(target);
  };

  const headerControls = (
    <div className="flex items-center gap-2.5 flex-wrap justify-end">
      <div
        className="flex bg-[#eef1e8] dark:bg-[#092E24] p-0.5 rounded-lg border border-[#dfe2d8] dark:border-[#C6A259]/25"
        role="group"
        aria-label={t.switchLanguage}
      >
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide transition-all ${
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
          className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide transition-all ${
            language === 'mm'
              ? 'bg-[#1b4332] dark:bg-[#C6A259] text-[#f8fff7] dark:text-[#041813] shadow-sm'
              : 'text-[#607067] dark:text-[#9EB5AC] hover:text-[#1b4332] dark:hover:text-[#FAF6EC]'
          }`}
          aria-pressed={language === 'mm'}
        >
          MM
        </button>
      </div>

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

      <div className="policy-brand hidden sm:inline-flex">
        <span className="policy-brand-mark">M</span>
        <span>
          MMNext <b>Studio</b>
        </span>
      </div>
    </div>
  );

  const backLabel = isAuthenticated
    ? language === 'mm'
      ? 'စတူဒီယိုသို့ ပြန်သွားရန်'
      : 'Back to Studio'
    : language === 'mm'
      ? 'ဝင်ရောက်မှု စာမျက်နှာသို့ ပြန်သွားရန်'
      : 'Back to Studio Sign-In';

  const returnButtonLabel = isAuthenticated
    ? language === 'mm'
      ? 'စတူဒီယိုသို့ ပြန်သွားမည်'
      : 'Return to Studio'
    : language === 'mm'
      ? 'ဝင်ရောက်မှုသို့ ပြန်သွားမည်'
      : 'Return to Login';

  if (page === 'storage') {
    return (
      <div className="storage-shell fixed inset-0 z-[115] overflow-y-auto custom-scrollbar">
        <header className="storage-header">
          <button type="button" onClick={onBack} className="policy-back">
            <ArrowLeft size={14} />
            <span>{backLabel}</span>
          </button>

          {headerControls}
        </header>

        <main className="storage-content">
          <div className="storage-kicker">
            <HardDrive size={13} />
            <span>{language === 'mm' ? 'အသံသိမ်းဆည်းမှု နည်းပညာ' : 'HIGH-FIDELITY AUDIO STORAGE'}</span>
          </div>

          <h1>{language === 'mm' ? 'အသံစာကြည့်တိုက်နှင့် Cloud စနစ်' : 'Studio Storage & Audio Pipeline'}</h1>
          <p className="storage-lead">
            {language === 'mm'
              ? 'MMNext Studio တွင် အသံနမူနာများကို 24kHz Lossless WAV အရည်အသွေးဖြင့် စနစ်တကျ သိမ်းဆည်းထားပြီး စက်ပစ္စည်းပေါ်တွင် မြန်ဆန်စွာ ဖွင့်နိုင်ရန် စီစဉ်ထားပါသည်။'
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

              <div className="space-y-3 mt-4 text-xs text-[#527064] dark:text-[#9EB5AC]">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#2daa44] dark:text-[#DFC589]" />
                  <span>{language === 'mm' ? 'မြန်မာ အသံထွက် မှန်ကန်တိကျမှု' : 'Native Myanmar phonetic articulation'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#2daa44] dark:text-[#DFC589]" />
                  <span>{language === 'mm' ? 'အချိန်နှင့်တပြေးညီ အသံလှိုင်း စစ်ဆေးမှု (Pitch Hz Analysis)' : 'Real-time pitch detection & frequency spectrum'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-[#2daa44] dark:text-[#DFC589]" />
                  <span>{language === 'mm' ? 'Google Cloud Firebase ဖြင့် စင့်ခ်လုပ်ခြင်း' : 'Automatic cloud state backup via Firebase'}</span>
                </div>
              </div>

              <button type="button" onClick={onBack} className="submit-button mt-5">
                <span>{returnButtonLabel}</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="files-card">
              <div className="files-card__heading">
                <div>
                  <h2>{language === 'mm' ? 'လုံခြုံသော ဒေတာအပိုင်းများ' : 'Protected Workspace Partitions'}</h2>
                  <p className="text-xs text-[#718077] dark:text-[#9EB5AC] mt-1">
                    {language === 'mm'
                      ? 'သင့် Google အကောင့်နှင့် ချိတ်ဆက်ထားသော ဒေတာများ:'
                      : 'Allocated under your personal authenticated container:'}
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

          <div className="mt-10 pt-6 border-t border-[#dfe2d8] dark:border-[#C6A259]/20 flex flex-wrap items-center gap-4 text-xs text-[#718077] dark:text-[#9EB5AC]">
            <a
              href="/privacy-policy"
              onClick={(e) => handleLinkClick(e, 'privacy')}
              className="footer-link"
            >
              Privacy Policy
            </a>
            <span className="footer-dot">•</span>
            <a
              href="/terms"
              onClick={(e) => handleLinkClick(e, 'terms')}
              className="footer-link"
            >
              Terms of Service
            </a>
          </div>
        </main>
      </div>
    );
  }

  const isPrivacy = page === 'privacy';

  return (
    <div className="policy-shell fixed inset-0 z-[115] overflow-y-auto custom-scrollbar">
      <header className="policy-header">
        <button type="button" onClick={onBack} className="policy-back">
          <ArrowLeft size={14} />
          <span>{backLabel}</span>
        </button>

        {headerControls}
      </header>

      <main className="policy-content">
        <div className="policy-kicker">
          <ShieldCheck size={13} />
          <span>
            {isPrivacy
              ? language === 'mm'
                ? 'ကိုယ်ရေးလုံခြုံမှု မူဝါဒ'
                : 'DATA PROTECTION & INTEGRITY'
              : language === 'mm'
                ? 'ဝန်ဆောင်မှု စည်းကမ်းချက်များ'
                : 'WORKSPACE TERMS'}
          </span>
        </div>

        <h1>
          {isPrivacy
            ? language === 'mm'
              ? 'ကိုယ်ရေးကိုယ်တာ လုံခြုံရေး'
              : 'Privacy & Security Policy'
            : language === 'mm'
              ? 'ဝန်ဆောင်မှု စည်းမျဉ်းများ'
              : 'Studio Terms of Service'}
        </h1>

        <p className="policy-lead">
          {isPrivacy
            ? language === 'mm'
              ? 'MMNext Studio သည် သုံးစွဲသူများ၏ ဒေတာလုံခြုံရေးနှင့် သီးသန့်ဖြစ်မှုကို အလေးထားဆောင်ရွက်ပါသည်။ Google Identity Services နှင့် Google Cloud Firebase Enterprise လုံခြုံရေးစည်းမျဉ်းများကို အသုံးပြုထားပါသည်။'
              : 'MMNext Studio enforces strict client-side data isolation, Google OAuth 2.0 verification, and Firebase Firestore Enterprise security rules to safeguard your sound workspace.'
            : language === 'mm'
              ? 'ဤစနစ်သည် မြန်မာဘာသာစကား အသံဖန်တီးမှုနှင့် AI အသံရွေးချယ်မှုများအတွက် တရားဝင် အသုံးပြုနိုင်ရန် ရည်ရွယ်ဖန်တီးထားခြင်း ဖြစ်ပါသည်။'
              : 'Use of MMNext Studio is governed by Google Gemini AI fair-use principles, high-fidelity speech synthesis quotas, and responsible audio production guidelines.'}
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

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={onBack} className="submit-button max-w-xs">
            <span>{returnButtonLabel}</span>
            <ArrowRight size={16} />
          </button>

          <div className="flex items-center gap-2 text-xs text-[#718077] dark:text-[#9EB5AC]">
            {isPrivacy ? (
              <a href="/terms" onClick={(e) => handleLinkClick(e, 'terms')} className="footer-link">
                Terms of Service
              </a>
            ) : (
              <a
                href="/privacy-policy"
                onClick={(e) => handleLinkClick(e, 'privacy')}
                className="footer-link"
              >
                Privacy Policy
              </a>
            )}
            <span className="footer-dot">•</span>
            <a href="/storage" onClick={(e) => handleLinkClick(e, 'storage')} className="footer-link">
              Storage
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LegalPages;
