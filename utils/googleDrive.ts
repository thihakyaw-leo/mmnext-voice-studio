/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
] as const;

export const STUDIO_DRIVE_FOLDER_NAME = 'MMNext Studio';

export interface DriveFileRecord {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface PickedDriveFile {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
  iconUrl?: string;
  sizeBytes?: number;
  lastEditedUtc?: number;
}

export type DrivePickedContent =
  | { kind: 'text'; text: string; exportedFromGoogleDoc: boolean }
  | { kind: 'audio'; blob: Blob; mimeType: string }
  | { kind: 'binary'; sizeBytes: number; mimeType: string };

export class DriveAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'DriveAuthError';
    this.status = status;
  }
}

async function parseDriveError(res: Response, fallback: string): Promise<Error> {
  let msg = fallback;
  try {
    const data = await res.json();
    if (typeof data?.error?.message === 'string' && data.error.message.trim()) {
      msg = data.error.message.trim();
    }
  } catch {
    // Ignore non-JSON error responses
  }
  if (res.status === 401 || res.status === 403) {
    return new DriveAuthError(msg, res.status);
  }
  return new Error(msg);
}

export async function ensureStudioDriveFolder(accessToken: string): Promise<string> {
  const query = `name='${STUDIO_DRIVE_FOLDER_NAME.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive&pageSize=1`;

  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    throw await parseDriveError(searchRes, 'Failed to access Google Drive folder.');
  }

  const searchData = (await searchRes.json()) as { files?: { id?: string; name?: string }[] };
  const existingId = searchData.files?.[0]?.id;
  if (existingId) {
    return existingId;
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: STUDIO_DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    throw await parseDriveError(createRes, 'Failed to create Google Drive folder.');
  }

  const created = (await createRes.json()) as { id?: string };
  if (!created.id) {
    throw new Error('Google Drive did not return a folder ID.');
  }
  return created.id;
}

export async function uploadFileToGoogleDrive(
  accessToken: string,
  options: {
    fileName: string;
    mimeType: string;
    blob: Blob;
    description?: string;
    folderId?: string;
  }
): Promise<DriveFileRecord> {
  const folderId = options.folderId ?? (await ensureStudioDriveFolder(accessToken));

  const metadata: Record<string, unknown> = {
    name: options.fileName,
    mimeType: options.mimeType,
    parents: [folderId],
  };
  if (options.description) {
    metadata.description = options.description;
  }

  const boundary = `mmnext_drive_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const metadataPart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n`;
  const mediaPartHeader =
    `--${boundary}\r\n` +
    `Content-Type: ${options.mimeType}\r\n\r\n`;
  const closingBoundary = `\r\n--${boundary}--`;

  const body = new Blob([metadataPart, mediaPartHeader, options.blob, closingBoundary], {
    type: `multipart/related; boundary=${boundary}`,
  });

  const uploadUrl =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink';

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body,
  });

  if (!res.ok) {
    throw await parseDriveError(res, 'Failed to upload file to Google Drive.');
  }

  return (await res.json()) as DriveFileRecord;
}

export async function listGoogleDriveStudioFiles(
  accessToken: string
): Promise<DriveFileRecord[]> {
  const query = "trashed=false and mimeType!='application/vnd.google-apps.folder'";
  const url =
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}` +
    `&orderBy=modifiedTime desc&pageSize=30&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw await parseDriveError(res, 'Failed to list files from Google Drive.');
  }

  const data = (await res.json()) as { files?: DriveFileRecord[] };
  return Array.isArray(data.files) ? data.files : [];
}

export async function downloadGoogleDriveFile(
  accessToken: string,
  fileId: string,
  fileName: string
): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw await parseDriveError(res, 'Failed to download file from Google Drive.');
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export async function deleteGoogleDriveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw await parseDriveError(res, 'Failed to delete file from Google Drive.');
  }
}

export function isAudioDriveFile(file: Pick<PickedDriveFile, 'name' | 'mimeType'>): boolean {
  const lowerName = file.name.toLowerCase();
  return (
    file.mimeType.startsWith('audio/') ||
    /\.(wav|mp3|ogg|m4a|aac|flac|webm)$/i.test(lowerName)
  );
}

export function isTextReadableDriveFile(file: Pick<PickedDriveFile, 'name' | 'mimeType'>): boolean {
  const lowerName = file.name.toLowerCase();
  return (
    file.mimeType === 'application/vnd.google-apps.document' ||
    file.mimeType === 'application/vnd.google-apps.spreadsheet' ||
    file.mimeType.startsWith('text/') ||
    file.mimeType.includes('json') ||
    file.mimeType.includes('xml') ||
    /\.(txt|md|json|csv|srt|vtt|log)$/i.test(lowerName)
  );
}

export async function readPickedDriveFileContent(
  accessToken: string,
  file: PickedDriveFile
): Promise<DrivePickedContent> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  if (file.mimeType === 'application/vnd.google-apps.document') {
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      file.id
    )}/export?mimeType=text%2Fplain`;
    const res = await fetch(exportUrl, { headers });
    if (!res.ok) {
      throw await parseDriveError(res, 'Failed to read Google Doc content from Google Drive.');
    }
    const text = await res.text();
    return { kind: 'text', text, exportedFromGoogleDoc: true };
  }

  if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      file.id
    )}/export?mimeType=text%2Fcsv`;
    const res = await fetch(exportUrl, { headers });
    if (!res.ok) {
      throw await parseDriveError(res, 'Failed to read Google Sheet content from Google Drive.');
    }
    const text = await res.text();
    return { kind: 'text', text, exportedFromGoogleDoc: true };
  }

  const mediaUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`;
  const res = await fetch(mediaUrl, { headers });
  if (!res.ok) {
    throw await parseDriveError(res, 'Failed to read selected file from Google Drive.');
  }

  if (isAudioDriveFile(file)) {
    const blob = await res.blob();
    return { kind: 'audio', blob, mimeType: blob.type || file.mimeType || 'audio/wav' };
  }

  if (isTextReadableDriveFile(file)) {
    const text = await res.text();
    return { kind: 'text', text, exportedFromGoogleDoc: false };
  }

  const blob = await res.blob();
  return { kind: 'binary', sizeBytes: blob.size, mimeType: file.mimeType };
}

export interface ParsedStudioDriveImport {
  kind: 'character-profile' | 'favorites-backup' | 'plain-text';
  transcriptText?: string;
  voiceId?: string;
  characterName?: { mm: string; en: string } | null;
  favoriteVoiceIds?: string[];
  rawText: string;
}

export function parseStudioDriveImport(rawText: string, fileName: string): ParsedStudioDriveImport {
  const trimmed = rawText.trim();
  if (
    fileName.toLowerCase().endsWith('.json') ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  ) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.favorites)) {
          const ids = parsed.favorites
            .map((item) => {
              if (typeof item === 'string') return item.trim();
              if (item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string') {
                return String((item as { id: string }).id).trim();
              }
              return '';
            })
            .filter(Boolean);
          if (ids.length > 0) {
            return {
              kind: 'favorites-backup',
              favoriteVoiceIds: ids,
              rawText,
            };
          }
        }

        if (typeof parsed.voiceId === 'string' && parsed.voiceId.trim()) {
          const charObj =
            parsed.characterName && typeof parsed.characterName === 'object'
              ? (parsed.characterName as { mm?: unknown; en?: unknown })
              : null;
          const mm = charObj && typeof charObj.mm === 'string' ? charObj.mm.trim() : '';
          const en = charObj && typeof charObj.en === 'string' ? charObj.en.trim() : '';
          const transcript = typeof parsed.transcript === 'string' ? parsed.transcript.trim() : undefined;
          return {
            kind: 'character-profile',
            voiceId: parsed.voiceId.trim(),
            characterName: mm || en ? { mm: mm || en, en: en || mm } : null,
            transcriptText: transcript,
            rawText,
          };
        }
      }
    } catch {
      // Fall through as plain text
    }
  }

  return {
    kind: 'plain-text',
    transcriptText: trimmed,
    rawText,
  };
}

