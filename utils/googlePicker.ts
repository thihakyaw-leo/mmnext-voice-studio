/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PickedDriveFile } from './googleDrive';

const GAPI_SCRIPT_SRC = 'https://apis.google.com/js/api.js';
const PICKER_LOAD_TIMEOUT_MS = 15_000;

let pickerLoadPromise: Promise<void> | null = null;

function isSafeHttpsUrl(rawUrl: unknown): string | undefined {
  if (typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function getGooglePickerOrigin(): string {
  if (typeof window === 'undefined') return '';
  const ancestors = window.location.ancestorOrigins;
  if (ancestors && ancestors.length > 0) {
    return ancestors[ancestors.length - 1];
  }
  return window.location.origin;
}

export async function loadGooglePickerApi(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Google Picker can only be used in a browser.');
  }

  if (window.google?.picker?.PickerBuilder) {
    return;
  }

  if (!pickerLoadPromise) {
    pickerLoadPromise = new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        pickerLoadPromise = null;
        reject(new Error('Timed out while loading Google Picker. Please check your connection.'));
      }, PICKER_LOAD_TIMEOUT_MS);

      const loadPickerModule = () => {
        if (!window.gapi?.load) {
          window.clearTimeout(timeoutId);
          pickerLoadPromise = null;
          reject(new Error('Google API loader is unavailable.'));
          return;
        }
        window.gapi.load('picker', {
          callback: () => {
            window.clearTimeout(timeoutId);
            if (window.google?.picker?.PickerBuilder) {
              resolve();
            } else {
              pickerLoadPromise = null;
              reject(new Error('Google Picker module failed to initialize.'));
            }
          },
          onerror: () => {
            window.clearTimeout(timeoutId);
            pickerLoadPromise = null;
            reject(new Error('Failed to load Google Picker library.'));
          },
          timeout: PICKER_LOAD_TIMEOUT_MS,
          ontimeout: () => {
            window.clearTimeout(timeoutId);
            pickerLoadPromise = null;
            reject(new Error('Timed out while initializing Google Picker.'));
          },
        });
      };

      if (window.gapi?.load) {
        loadPickerModule();
        return;
      }

      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${GAPI_SCRIPT_SRC}"]`
      );
      if (existingScript) {
        existingScript.addEventListener('load', loadPickerModule, { once: true });
        existingScript.addEventListener(
          'error',
          () => {
            window.clearTimeout(timeoutId);
            pickerLoadPromise = null;
            reject(new Error('Failed to load Google API script.'));
          },
          { once: true }
        );
        return;
      }

      const script = document.createElement('script');
      script.src = GAPI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = loadPickerModule;
      script.onerror = () => {
        window.clearTimeout(timeoutId);
        pickerLoadPromise = null;
        reject(new Error('Failed to load Google API script.'));
      };
      document.head.appendChild(script);
    });
  }

  return pickerLoadPromise;
}

export interface OpenGooglePickerOptions {
  mimeTypes?: string[];
  title?: string;
}

export async function openGoogleDrivePicker(
  accessToken: string,
  options: OpenGooglePickerOptions = {}
): Promise<PickedDriveFile | null> {
  await loadGooglePickerApi();

  const googlePicker = window.google?.picker;
  if (!googlePicker?.PickerBuilder) {
    throw new Error('Google Picker is unavailable.');
  }

  const pickerOrigin = getGooglePickerOrigin();

  return new Promise<PickedDriveFile | null>((resolve) => {
    let settled = false;
    const finish = (file: PickedDriveFile | null) => {
      if (settled) return;
      settled = true;
      resolve(file);
    };

    const builder = new googlePicker.PickerBuilder();

    if (options.mimeTypes && options.mimeTypes.length > 0 && googlePicker.DocsView) {
      const docsView = new googlePicker.DocsView(googlePicker.ViewId.DOCS);
      docsView.setMimeTypes(options.mimeTypes.join(','));
      builder.addView(docsView);
    } else {
      builder.addView(googlePicker.ViewId.DOCS);
    }

    if (options.title && typeof builder.setTitle === 'function') {
      builder.setTitle(options.title);
    }

    const picker = builder
      .setOAuthToken(accessToken)
      .setOrigin(pickerOrigin)
      .setCallback((data) => {
        if (data.action === googlePicker.Action.PICKED) {
          const doc = data.docs?.[0];
          if (!doc?.id) {
            finish(null);
            return;
          }
          finish({
            id: String(doc.id),
            name: typeof doc.name === 'string' && doc.name.trim() ? doc.name.trim() : 'Untitled',
            mimeType:
              typeof doc.mimeType === 'string' && doc.mimeType.trim()
                ? doc.mimeType.trim()
                : 'application/octet-stream',
            url: isSafeHttpsUrl(doc.url),
            iconUrl: isSafeHttpsUrl(doc.iconUrl),
            sizeBytes: typeof doc.sizeBytes === 'number' ? doc.sizeBytes : undefined,
            lastEditedUtc: typeof doc.lastEditedUtc === 'number' ? doc.lastEditedUtc : undefined,
          });
        } else if (data.action === googlePicker.Action.CANCEL) {
          finish(null);
        }
      })
      .build();

    picker.setVisible(true);
  });
}
