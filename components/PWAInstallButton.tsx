/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { useI18n } from '../i18n';

interface PWAInstallButtonProps {
  variant?: 'header' | 'compact' | 'sidebar';
  onAfterClick?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  onAfterClick,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language } = useI18n();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (!showIOSGuide) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowIOSGuide(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIOSGuide]);

  if (isInstalled) {
    return null;
  }

  const installLabel = language === 'mm' ? 'App ထည့်သွင်းမည်' : 'Install App';
  const installShortLabel = language === 'mm' ? 'ထည့်သွင်း' : 'Install';
  const iosTitle =
    language === 'mm' ? 'iPhone / iPad တွင် ထည့်သွင်းရန်' : 'Install on iPhone / iPad';
  const iosStep1 =
    language === 'mm'
      ? 'Safari ဘားရှိ Share ခလုတ်ကို နှိပ်ပါ။'
      : 'Tap the Share button in the Safari toolbar.';
  const iosStep2 =
    language === 'mm'
      ? 'အောက်သို့ဆွဲချပြီး Add to Home Screen ကို ရွေးချယ်ပါ။'
      : 'Scroll down and tap Add to Home Screen.';
  const closeLabel = language === 'mm' ? 'ပိတ်မည်' : 'Close';

  if (isInstallable) {
    const handleInstallClick = async () => {
      await install();
      onAfterClick?.();
    };

    if (variant === 'sidebar') {
      return (
        <button
          type="button"
          onClick={() => void handleInstallClick()}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#0D3A2E] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] hover:bg-[#145240] dark:hover:brightness-105 border border-[#B49049]/40 text-[#FAF6EC] dark:text-[#041813] transition-all text-xs font-semibold shadow-sm active:scale-[0.99]"
        >
          <span className="inline-flex items-center gap-2">
            <Download size={14} />
            <span>{installLabel}</span>
          </span>
          <Smartphone size={13} className="opacity-80" />
        </button>
      );
    }

    if (variant === 'compact') {
      return (
        <button
          type="button"
          onClick={() => void handleInstallClick()}
          className="inline-flex items-center justify-center p-2 rounded-lg bg-[#F4EDE0]/80 dark:bg-[#092E24] border border-[#D9CEB8]/80 dark:border-[#C6A259]/25 text-[#114637] dark:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors active:scale-95"
          title={installLabel}
          aria-label={installLabel}
        >
          <Download size={16} />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => void handleInstallClick()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF6EC]/90 dark:bg-[#092E24]/85 border border-[#B49049]/45 dark:border-[#C6A259]/35 text-[#0D3A2E] dark:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-all text-xs font-semibold whitespace-nowrap shadow-xs active:scale-95"
        title={installLabel}
        aria-label={installLabel}
      >
        <Download size={13} />
        <span className="hidden xl:inline">{installLabel}</span>
        <span className="xl:hidden">{installShortLabel}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        {variant === 'sidebar' ? (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FAF6EC] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#072920] dark:text-[#EAD7A4] hover:border-[#B49049]/60 dark:hover:border-[#C6A259]/45 transition-colors text-xs font-medium"
          >
            <span className="inline-flex items-center gap-2">
              <Download size={14} className="text-[#9C7A3C] dark:text-[#DFC589]" />
              <span>{installLabel}</span>
            </span>
            <Smartphone size={13} className="text-[#5B7469] dark:text-[#9EB5AC]" />
          </button>
        ) : variant === 'compact' ? (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className="inline-flex items-center justify-center p-2 rounded-lg bg-[#F4EDE0]/80 dark:bg-[#092E24] border border-[#D9CEB8]/80 dark:border-[#C6A259]/25 text-[#114637] dark:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors active:scale-95"
            title={installLabel}
            aria-label={installLabel}
          >
            <Download size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF6EC]/90 dark:bg-[#092E24]/85 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#2B463B] dark:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-all text-xs font-medium whitespace-nowrap shadow-xs active:scale-95"
            title={installLabel}
            aria-label={installLabel}
          >
            <Download size={13} />
            <span className="hidden xl:inline">{installLabel}</span>
          </button>
        )}

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-[#020E0B]/70 backdrop-blur-sm animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-pwa-guide-title"
          >
            <div className="absolute inset-0" onClick={() => setShowIOSGuide(false)} />
            <div className="relative w-full max-w-sm rounded-3xl bg-[#FAF6EC] dark:bg-[#06231B] border border-[#D9CEB8] dark:border-[#C6A259]/30 luminous-hairline p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EBE2CE] dark:bg-[#114637] border border-[#B49049]/40 dark:border-[#C6A259]/30 flex items-center justify-center text-[#7D602D] dark:text-[#DFC589] shrink-0">
                    <Smartphone size={18} />
                  </div>
                  <h3
                    id="ios-pwa-guide-title"
                    className="text-base font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC]"
                  >
                    {iosTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-full text-[#5B7469] dark:text-[#8DA399] hover:bg-[#EBE2CE] dark:hover:bg-[#114637]"
                  aria-label={closeLabel}
                >
                  <X size={16} />
                </button>
              </div>

              <ol className="space-y-3 text-xs text-[#2B463B] dark:text-[#C5D1CA]">
                <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F4EDE0]/85 dark:bg-[#041813]/80 border border-[#D9CEB8]/80 dark:border-[#C6A259]/20">
                  <Share size={15} className="text-[#7D602D] dark:text-[#DFC589] shrink-0 mt-0.5" />
                  <span>1. {iosStep1}</span>
                </li>
                <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F4EDE0]/85 dark:bg-[#041813]/80 border border-[#D9CEB8]/80 dark:border-[#C6A259]/20">
                  <PlusSquare size={15} className="text-[#7D602D] dark:text-[#DFC589] shrink-0 mt-0.5" />
                  <span>2. {iosStep2}</span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#0D3A2E] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] text-[#FAF6EC] dark:text-[#041813] text-xs font-semibold shadow-sm"
              >
                {closeLabel}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default PWAInstallButton;
