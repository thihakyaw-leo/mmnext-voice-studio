/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WifiOff, Activity, Loader2 } from 'lucide-react';
import { useNetworkStatus } from '../utils/networkStatus';
import { useI18n } from '../i18n';

interface NetworkStatusIndicatorProps {
  compact?: boolean;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ compact = false }) => {
  const { isOnline, highLatency, lastLatencyMs, checking, recheck } = useNetworkStatus();
  const { t } = useI18n();

  if (isOnline && !highLatency) {
    return null;
  }

  const isOffline = !isOnline;
  const formattedLatency =
    lastLatencyMs !== null && lastLatencyMs >= 1000
      ? `${(lastLatencyMs / 1000).toFixed(1)}s`
      : lastLatencyMs !== null
      ? `${lastLatencyMs}ms`
      : null;

  const tooltip = isOffline
    ? t.networkOfflineTooltip
    : t.highLatencyTooltip(lastLatencyMs);

  return (
    <button
      type="button"
      onClick={() => void recheck()}
      role="status"
      aria-live="polite"
      title={tooltip}
      aria-label={`${isOffline ? t.networkOfflineLabel : t.highLatencyLabel} — ${t.recheckConnection}`}
      className={`inline-flex items-center gap-1.5 rounded-full border text-[11px] font-medium whitespace-nowrap transition-all active:scale-95 ${
        compact ? 'px-2.5 py-1' : 'px-3 py-1.5'
      } ${
        isOffline
          ? 'bg-rose-50/95 dark:bg-[#2A1014]/90 border-rose-300/80 dark:border-rose-700/60 text-rose-800 dark:text-rose-200'
          : 'bg-[#FAF6EC]/95 dark:bg-[#0D3126]/90 border-[#B49049]/50 dark:border-[#C6A259]/40 text-[#7D602D] dark:text-[#EAD7A4]'
      }`}
    >
      {checking ? (
        <Loader2 size={12} className="animate-spin shrink-0" />
      ) : isOffline ? (
        <WifiOff size={12} className="shrink-0" />
      ) : (
        <Activity size={12} className="shrink-0 animate-pulse" />
      )}

      {!compact && (
        <span>
          {isOffline ? t.networkOfflineLabel : t.highLatencyLabel}
        </span>
      )}

      {!isOffline && formattedLatency && (
        <span className="font-mono tabular-nums opacity-80">{formattedLatency}</span>
      )}
    </button>
  );
};

export default NetworkStatusIndicator;
