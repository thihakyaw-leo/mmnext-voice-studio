/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let earlyDeferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(event: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    earlyDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((listener) => listener(earlyDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    earlyDeferredPrompt = null;
    promptListeners.forEach((listener) => listener(null));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => earlyDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
    };

    checkStandalone();

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPadOS =
      navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || isIPadOS;
    setIsIOS(isIOSDevice);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = () => checkStandalone();
    mediaQuery.addEventListener?.('change', handleDisplayChange);

    const handlePromptUpdate = (evt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(evt);
    };
    promptListeners.add(handlePromptUpdate);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      earlyDeferredPrompt = null;
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener?.('change', handleDisplayChange);
      promptListeners.delete(handlePromptUpdate);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const activePrompt = deferredPrompt || earlyDeferredPrompt;
    if (!activePrompt) return false;
    await activePrompt.prompt();
    const { outcome } = await activePrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      earlyDeferredPrompt = null;
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    install,
  };
}
