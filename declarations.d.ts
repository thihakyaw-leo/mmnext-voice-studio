/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

declare module '*.jpg' {
  const value: string;
  export default value;
}

interface GooglePickerDoc {
  id: string;
  name?: string;
  mimeType?: string;
  url?: string;
  iconUrl?: string;
  sizeBytes?: number;
  lastEditedUtc?: number;
}

interface GooglePickerCallbackData {
  action: string;
  docs?: GooglePickerDoc[];
}

interface GooglePickerInstance {
  setVisible: (visible: boolean) => void;
}

interface GooglePickerDocsViewInstance {
  setMimeTypes: (mimeTypes: string) => GooglePickerDocsViewInstance;
  setIncludeFolders?: (include: boolean) => GooglePickerDocsViewInstance;
}

interface GooglePickerBuilderInstance {
  addView: (view: string | GooglePickerDocsViewInstance) => GooglePickerBuilderInstance;
  setOAuthToken: (token: string) => GooglePickerBuilderInstance;
  setCallback: (cb: (data: GooglePickerCallbackData) => void) => GooglePickerBuilderInstance;
  setOrigin: (origin: string) => GooglePickerBuilderInstance;
  setTitle?: (title: string) => GooglePickerBuilderInstance;
  build: () => GooglePickerInstance;
}

interface Window {
  gapi?: {
    load: (
      apiName: string,
      options: {
        callback: () => void;
        onerror?: () => void;
        timeout?: number;
        ontimeout?: () => void;
      }
    ) => void;
  };
  google?: {
    picker?: {
      ViewId: {
        DOCS: string;
      };
      Action: {
        PICKED: string;
        CANCEL: string;
      };
      DocsView?: new (viewId?: string) => GooglePickerDocsViewInstance;
      PickerBuilder: new () => GooglePickerBuilderInstance;
    };
  };
}