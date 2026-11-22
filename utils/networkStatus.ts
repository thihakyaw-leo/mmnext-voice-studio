/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

export interface NetworkStatusSnapshot {
  isOnline: boolean;
  highLatency: boolean;
  lastLatencyMs: number | null;
  checking: boolean;
}

const HEALTH_HIGH_LATENCY_MS = 2200;
const API_HIGH_LATENCY_MS = 4500;
const IN_FLIGHT_SLOW_THRESHOLD_MS = 4500;
const PROBE_INTERVAL_MS = 45_000;

type Listener = (snapshot: NetworkStatusSnapshot) => void;

const listeners = new Set<Listener>();
const inFlightTimers = new Map<number, number>();
let nextRequestId = 1;
let probeIntervalId: number | null = null;
let listenersAttached = false;

let state: NetworkStatusSnapshot = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  highLatency: false,
  lastLatencyMs: null,
  checking: false,
};

function emit() {
  for (const listener of listeners) {
    listener({ ...state });
  }
}

export function beginTrackedApiRequest(): number {
  const id = nextRequestId++;
  if (typeof window !== 'undefined') {
    const timer = window.setTimeout(() => {
      if (inFlightTimers.has(id) && state.isOnline && !state.highLatency) {
        state = {
          ...state,
          highLatency: true,
        };
        emit();
      }
    }, IN_FLIGHT_SLOW_THRESHOLD_MS);
    inFlightTimers.set(id, timer);
  }
  return id;
}

export function endTrackedApiRequest(
  id: number,
  durationMs: number,
  succeeded: boolean,
  isHealthProbe = false
): void {
  const timer = inFlightTimers.get(id);
  if (timer !== undefined && typeof window !== 'undefined') {
    window.clearTimeout(timer);
  }
  inFlightTimers.delete(id);

  const threshold = isHealthProbe ? HEALTH_HIGH_LATENCY_MS : API_HIGH_LATENCY_MS;
  const roundedMs = Math.max(0, Math.round(durationMs));

  if (!succeeded && typeof navigator !== 'undefined' && !navigator.onLine) {
    state = {
      ...state,
      isOnline: false,
      highLatency: false,
      lastLatencyMs: roundedMs,
    };
    emit();
    return;
  }

  const hasOtherSlowInFlight = inFlightTimers.size > 0 && state.highLatency;
  state = {
    ...state,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : state.isOnline,
    lastLatencyMs: roundedMs,
    highLatency: roundedMs >= threshold || hasOtherSlowInFlight,
  };
  emit();
}

export async function probeServerHealth(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    if (state.isOnline) {
      state = { ...state, isOnline: false, highLatency: false, checking: false };
      emit();
    }
    return;
  }

  state = { ...state, checking: true };
  emit();

  const reqId = beginTrackedApiRequest();
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

  try {
    const resp = await fetch('/api/health', {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    const elapsed = performance.now() - startedAt;
    endTrackedApiRequest(reqId, elapsed, resp.ok, true);
  } catch {
    const elapsed = performance.now() - startedAt;
    endTrackedApiRequest(reqId, elapsed, false, true);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      state = { ...state, isOnline: false, highLatency: false };
    } else {
      state = { ...state, highLatency: true, lastLatencyMs: Math.round(elapsed) };
    }
  } finally {
    window.clearTimeout(timeoutId);
    state = { ...state, checking: false };
    emit();
  }
}

function attachGlobalListeners() {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;

  const handleOnline = () => {
    state = { ...state, isOnline: true };
    emit();
    void probeServerHealth();
  };

  const handleOffline = () => {
    state = { ...state, isOnline: false, highLatency: false };
    emit();
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      void probeServerHealth();
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  document.addEventListener('visibilitychange', handleVisibility);

  // Also check Network Information API changes if supported
  const navWithConn = navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      addEventListener?: (type: string, fn: () => void) => void;
    };
  };
  navWithConn.connection?.addEventListener?.('change', () => {
    const eff = navWithConn.connection?.effectiveType;
    if (eff === '2g' || eff === 'slow-2g') {
      state = { ...state, highLatency: true };
      emit();
    } else if (navigator.onLine) {
      void probeServerHealth();
    }
  });

  probeIntervalId = window.setInterval(() => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      void probeServerHealth();
    }
  }, PROBE_INTERVAL_MS);

  void probeServerHealth();
}

export function useNetworkStatus(): NetworkStatusSnapshot & { recheck: () => Promise<void> } {
  const [snapshot, setSnapshot] = useState<NetworkStatusSnapshot>(() => ({ ...state }));

  useEffect(() => {
    attachGlobalListeners();
    setSnapshot({ ...state });
    const listener: Listener = (next) => setSnapshot(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && probeIntervalId !== null && typeof window !== 'undefined') {
        window.clearInterval(probeIntervalId);
        probeIntervalId = null;
        listenersAttached = false;
      }
    };
  }, []);

  return {
    ...snapshot,
    recheck: probeServerHealth,
  };
}
