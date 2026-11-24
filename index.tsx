/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { I18nProvider, useI18n } from './i18n';
import FirebaseErrorBoundary from './components/FirebaseErrorBoundary';
import { FirebaseProvider } from './components/FirebaseProvider';
import type { UserWorkspacePrefs } from './firebase';
import { registerSW } from 'virtual:pwa-register';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

const FirebaseAppRoot: React.FC = () => {
  const { language } = useI18n();

  const defaultPrefs = useMemo<UserWorkspacePrefs>(() => {
    let visualizerVariant: 'wave' | 'bars' | 'mirror' = 'wave';
    let isDarkMode = true;
    try {
      const savedVariant = localStorage.getItem('gemini-voice-library:visualizer-variant');
      if (savedVariant === 'wave' || savedVariant === 'bars' || savedVariant === 'mirror') {
        visualizerVariant = savedVariant;
      }
      isDarkMode = document.documentElement.classList.contains('dark');
    } catch {
      // Ignore storage access errors
    }
    return { language, isDarkMode, visualizerVariant };
  }, [language]);

  return (
    <FirebaseProvider defaultPrefs={defaultPrefs}>
      <App />
    </FirebaseProvider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <FirebaseErrorBoundary>
      <I18nProvider>
        <FirebaseAppRoot />
      </I18nProvider>
    </FirebaseErrorBoundary>
  </React.StrictMode>
);