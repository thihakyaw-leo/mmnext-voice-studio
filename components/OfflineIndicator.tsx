/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useI18n } from '../i18n';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { language } = useI18n();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-5 left-4 z-[85] flex items-center gap-2 rounded-full bg-[#2A1014]/95 border border-rose-400/40 px-3.5 py-2 text-xs font-medium text-rose-100 shadow-xl backdrop-blur-md"
    >
      <WifiOff size={13} className="text-rose-300 shrink-0" />
      <span>
        {language === 'mm'
          ? 'အင်တာနက် ပြတ်တောက်နေပါသည် — သိမ်းဆည်းထားသော အချက်အလက်များကို သုံးနေပါသည်'
          : 'Offline Mode — Cached data is being used.'}
      </span>
    </div>
  );
};

export default OfflineIndicator;
