/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  HardDrive,
  FolderOpen,
  FolderSearch,
  RefreshCw,
  FileJson,
  FileText,
  FileAudio,
  FileArchive,
  ExternalLink,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  FolderDown,
  Unplug,
  Sparkles,
  UserCheck,
  Heart,
} from 'lucide-react';
import { Voice } from '../types';
import type { BurmeseCharacterName } from '../burmeseNames';
import { useI18n } from '../i18n';
import { useFirebase } from './FirebaseProvider';
import {
  getGoogleDriveAccessToken,
  getGeminiApiKeyHeaders,
  notifyGeminiQuotaUpdated,
  MAX_CHARACTER_TRANSCRIPT_LENGTH,
} from '../firebase';
import {
  DriveAuthError,
  DriveFileRecord,
  DrivePickedContent,
  ParsedStudioDriveImport,
  PickedDriveFile,
  deleteGoogleDriveFile,
  downloadGoogleDriveFile,
  listGoogleDriveStudioFiles,
  parseStudioDriveImport,
  readPickedDriveFileContent,
  uploadFileToGoogleDrive,
} from '../utils/googleDrive';
import { openGoogleDrivePicker } from '../utils/googlePicker';
import { beginTrackedApiRequest, endTrackedApiRequest } from '../utils/networkStatus';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteVoices: Voice[];
  activeVoice: Voice | null;
  onApplyScriptToVoice?: (voiceName: string, transcriptText: string) => void;
  onImportFavorites?: (voiceNames: string[]) => number;
  onApplyCharacterProfile?: (
    voiceName: string,
    name: BurmeseCharacterName | null,
    transcript: string | null
  ) => void;
}

function formatBytes(sizeStr?: string | number): string {
  const bytes = typeof sizeStr === 'number' ? sizeStr : Number(sizeStr);
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatModifiedDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function getFileIcon(file: { name: string; mimeType: string }) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.wav') || file.mimeType.startsWith('audio/')) {
    return <FileAudio size={16} className="text-[#7D602D] dark:text-[#DFC589]" />;
  }
  if (name.endsWith('.zip') || file.mimeType.includes('zip')) {
    return <FileArchive size={16} className="text-[#7D602D] dark:text-[#DFC589]" />;
  }
  if (name.endsWith('.json') || file.mimeType.includes('json')) {
    return <FileJson size={16} className="text-[#114637] dark:text-[#5FA88E]" />;
  }
  return <FileText size={16} className="text-[#5B7469] dark:text-[#9EB5AC]" />;
}

const GoogleGMark: React.FC = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  favoriteVoices,
  activeVoice,
  onApplyScriptToVoice,
  onImportFavorites,
  onApplyCharacterProfile,
}) => {
  const { t } = useI18n();
  const {
    user,
    driveConnected,
    driveBusy,
    driveError,
    connectGoogleDrive,
    disconnectGoogleDrive,
    clearDriveError,
  } = useFirebase();

  const [files, setFiles] = useState<DriveFileRecord[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isSavingAction, setIsSavingAction] = useState<'json' | 'zip' | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<DriveFileRecord | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [savedRecord, setSavedRecord] = useState<DriveFileRecord | null>(null);

  // Google Picker state
  const [isOpeningPicker, setIsOpeningPicker] = useState(false);
  const [isLoadingPickedContent, setIsLoadingPickedContent] = useState(false);
  const [pickedFile, setPickedFile] = useState<PickedDriveFile | null>(null);
  const [pickedContent, setPickedContent] = useState<DrivePickedContent | null>(null);
  const [parsedImport, setParsedImport] = useState<ParsedStudioDriveImport | null>(null);
  const [pickedAudioUrl, setPickedAudioUrl] = useState<string | null>(null);
  const [pickerActionNotice, setPickerActionNotice] = useState<string | null>(null);
  const pickedAudioUrlRef = useRef<string | null>(null);

  const clearPickedPreview = useCallback(() => {
    if (pickedAudioUrlRef.current) {
      URL.revokeObjectURL(pickedAudioUrlRef.current);
      pickedAudioUrlRef.current = null;
    }
    setPickedAudioUrl(null);
    setPickedFile(null);
    setPickedContent(null);
    setParsedImport(null);
    setPickerActionNotice(null);
  }, []);

  useEffect(() => {
    return () => {
      if (pickedAudioUrlRef.current) {
        URL.revokeObjectURL(pickedAudioUrlRef.current);
        pickedAudioUrlRef.current = null;
      }
    };
  }, []);

  const loadFiles = useCallback(
    async (explicitToken?: string) => {
      const token = explicitToken ?? getGoogleDriveAccessToken();
      if (!token) return;
      setIsLoadingFiles(true);
      setLocalError(null);
      try {
        const list = await listGoogleDriveStudioFiles(token);
        setFiles(list);
      } catch (err) {
        if (err instanceof DriveAuthError) {
          disconnectGoogleDrive();
          setLocalError(t.driveTokenExpiredNotice);
        } else {
          setLocalError(err instanceof Error ? err.message : t.driveSaveFailedError);
        }
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [disconnectGoogleDrive, t.driveSaveFailedError, t.driveTokenExpiredNotice]
  );

  useEffect(() => {
    if (!isOpen) {
      setPendingDeleteFile(null);
      setSavedRecord(null);
      setLocalError(null);
      clearPickedPreview();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpeningPicker) return;
      if (e.key === 'Escape') {
        if (pendingDeleteFile) {
          setPendingDeleteFile(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, pendingDeleteFile, isOpeningPicker, clearPickedPreview]);

  useEffect(() => {
    if (isOpen && driveConnected) {
      void loadFiles();
    } else if (!driveConnected) {
      setFiles([]);
      clearPickedPreview();
    }
  }, [isOpen, driveConnected, loadFiles, clearPickedPreview]);

  if (!isOpen) return null;

  const ensureDriveToken = async (): Promise<string | null> => {
    const existing = getGoogleDriveAccessToken();
    if (existing) return existing;
    return connectGoogleDrive();
  };

  const handleConnect = async () => {
    clearDriveError();
    setLocalError(null);
    const token = await connectGoogleDrive();
    if (token) {
      await loadFiles(token);
    }
  };

  const handleOpenPicker = async () => {
    if (isOpeningPicker) return;
    clearDriveError();
    setLocalError(null);
    setPickerActionNotice(null);

    const token = await ensureDriveToken();
    if (!token) return;

    setIsOpeningPicker(true);
    try {
      const selected = await openGoogleDrivePicker(token, {
        title: t.pickFromGoogleDrive,
      });
      if (!selected) return;

      clearPickedPreview();
      setPickedFile(selected);
      setIsLoadingPickedContent(true);

      try {
        const content = await readPickedDriveFileContent(token, selected);
        setPickedContent(content);
        if (content.kind === 'text') {
          setParsedImport(parseStudioDriveImport(content.text, selected.name));
        } else if (content.kind === 'audio') {
          const objectUrl = URL.createObjectURL(content.blob);
          pickedAudioUrlRef.current = objectUrl;
          setPickedAudioUrl(objectUrl);
        }
      } catch (readErr) {
        if (readErr instanceof DriveAuthError) {
          disconnectGoogleDrive();
          setLocalError(t.driveTokenExpiredNotice);
        } else {
          setLocalError(readErr instanceof Error ? readErr.message : t.driveSaveFailedError);
        }
      } finally {
        setIsLoadingPickedContent(false);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t.driveSaveFailedError);
    } finally {
      setIsOpeningPicker(false);
    }
  };

  const handleSaveFavoritesJsonToDrive = async () => {
    if (favoriteVoices.length === 0 || isSavingAction) return;
    setLocalError(null);
    setSavedRecord(null);

    const token = await ensureDriveToken();
    if (!token) return;

    setIsSavingAction('json');
    try {
      const exportedAt = new Date().toISOString();
      const dateStamp = exportedAt.slice(0, 10);
      const payload = {
        app: 'MMNext Studio',
        exportedAt,
        count: favoriteVoices.length,
        favorites: favoriteVoices.map((voice) => ({
          id: voice.name,
          characterName: voice.characterName ?? null,
          transcript: voice.transcript ?? null,
          gender: voice.analysis.gender,
          pitch: voice.pitch,
          analysisPitch: voice.analysis.pitch,
          characteristics: voice.analysis.characteristics,
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const record = await uploadFileToGoogleDrive(token, {
        fileName: `mmnext-voice-favorites-${dateStamp}.json`,
        mimeType: 'application/json',
        blob,
        description: `MMNext Studio favorites backup (${favoriteVoices.length} voices)`,
      });
      setSavedRecord(record);
      await loadFiles(token);
    } catch (err) {
      if (err instanceof DriveAuthError) {
        disconnectGoogleDrive();
        setLocalError(t.driveTokenExpiredNotice);
      } else {
        setLocalError(err instanceof Error ? err.message : t.driveSaveFailedError);
      }
    } finally {
      setIsSavingAction(null);
    }
  };

  const handleSaveFavoritesZipToDrive = async () => {
    if (favoriteVoices.length === 0 || isSavingAction) return;
    setLocalError(null);
    setSavedRecord(null);

    const token = await ensureDriveToken();
    if (!token) return;

    setIsSavingAction('zip');
    const reqId = beginTrackedApiRequest();
    const startedAt = performance.now();
    try {
      const authHeaders = await getGeminiApiKeyHeaders();
      const response = await fetch('/api/favorites-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          voiceNames: favoriteVoices.map((v) => v.name),
        }),
      });
      endTrackedApiRequest(reqId, performance.now() - startedAt, response.ok);
      notifyGeminiQuotaUpdated();

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || t.downloadZipFailedError);
      }

      const zipBlob = await response.blob();
      const dateStamp = new Date().toISOString().slice(0, 10);
      const record = await uploadFileToGoogleDrive(token, {
        fileName: `mmnext-favorites-audio-${dateStamp}.zip`,
        mimeType: 'application/zip',
        blob: zipBlob,
        description: `MMNext Studio favorite WAV samples (${favoriteVoices.length} voices)`,
      });
      setSavedRecord(record);
      await loadFiles(token);
    } catch (err) {
      endTrackedApiRequest(reqId, performance.now() - startedAt, false);
      if (err instanceof DriveAuthError) {
        disconnectGoogleDrive();
        setLocalError(t.driveTokenExpiredNotice);
      } else {
        setLocalError(err instanceof Error ? err.message : t.driveSaveFailedError);
      }
    } finally {
      setIsSavingAction(null);
    }
  };

  const handleDownloadFile = async (file: { id: string; name: string }) => {
    const token = getGoogleDriveAccessToken();
    if (!token || downloadingId) return;
    setDownloadingId(file.id);
    setLocalError(null);
    try {
      await downloadGoogleDriveFile(token, file.id, file.name);
    } catch (err) {
      if (err instanceof DriveAuthError) {
        disconnectGoogleDrive();
        setLocalError(t.driveTokenExpiredNotice);
      } else {
        setLocalError(err instanceof Error ? err.message : t.driveSaveFailedError);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteFile) return;
    const token = getGoogleDriveAccessToken();
    if (!token) return;
    const target = pendingDeleteFile;
    setDeletingId(target.id);
    setLocalError(null);
    try {
      await deleteGoogleDriveFile(token, target.id);
      setFiles((prev) => prev.filter((f) => f.id !== target.id));
      if (savedRecord?.id === target.id) {
        setSavedRecord(null);
      }
      if (pickedFile?.id === target.id) {
        clearPickedPreview();
      }
      setPendingDeleteFile(null);
    } catch (err) {
      if (err instanceof DriveAuthError) {
        disconnectGoogleDrive();
        setLocalError(t.driveTokenExpiredNotice);
      } else {
        setLocalError(err instanceof Error ? err.message : t.driveSaveFailedError);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const activeVoiceLabel = activeVoice
    ? activeVoice.characterName?.mm || activeVoice.name
    : '';
  const combinedError = localError || driveError;

  return (
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-[#020E0B]/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-drive-modal-title"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl bg-[#FAF6EC] dark:bg-[#06231B] border border-[#D9CEB8] dark:border-[#C6A259]/30 luminous-hairline shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/20 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EBE2CE] dark:bg-[#114637] border border-[#B49049]/40 dark:border-[#C6A259]/30 text-[#7D602D] dark:text-[#DFC589] flex items-center justify-center shrink-0">
              <HardDrive size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="google-drive-modal-title"
                  className="text-lg font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] tracking-tight"
                >
                  {t.driveVaultTitle}
                </h2>
                {driveConnected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E9F3EE] dark:bg-[#0D3A2E] text-[#114637] dark:text-[#5FA88E] border border-[#236D56]/30 dark:border-[#2E8267]/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E8267]" />
                    <span>{t.driveConnected}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5B7469] dark:text-[#9EB5AC] leading-relaxed mt-0.5">
                {t.driveVaultSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors shrink-0"
            aria-label={t.close}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {combinedError && (
            <div
              role="alert"
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-[#2A1014]/85 border border-rose-200 dark:border-rose-800/70 text-rose-700 dark:text-rose-200 text-xs flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2 min-w-0">
                <AlertCircle size={14} className="shrink-0" />
                <span className="leading-snug">{combinedError}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  clearDriveError();
                }}
                className="p-1 rounded hover:bg-rose-200/60 dark:hover:bg-rose-900/50 shrink-0"
                aria-label={t.close}
              >
                <X size={13} />
              </button>
            </div>
          )}

          {savedRecord && (
            <div className="px-3.5 py-2.5 rounded-xl bg-[#E9F3EE] dark:bg-[#0D3A2E]/85 border border-[#236D56]/30 dark:border-[#C6A259]/35 text-[#114637] dark:text-[#EAD7A4] text-xs flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 min-w-0">
                <Check size={14} className="text-[#2E8267] dark:text-[#DFC589] shrink-0" />
                <span className="truncate font-medium">
                  {t.savedToDriveNotice}: {savedRecord.name}
                </span>
              </span>
              {savedRecord.webViewLink && (
                <a
                  href={savedRecord.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold underline decoration-[#B49049]/60 hover:text-[#06231B] dark:hover:text-[#FAF6EC] shrink-0"
                >
                  <span>{t.openInDrive}</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}

          {pickerActionNotice && (
            <div className="px-3.5 py-2.5 rounded-xl bg-[#E9F3EE] dark:bg-[#0D3A2E]/85 border border-[#236D56]/30 dark:border-[#C6A259]/35 text-[#114637] dark:text-[#EAD7A4] text-xs flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 min-w-0">
                <Check size={14} className="text-[#2E8267] dark:text-[#DFC589] shrink-0" />
                <span className="leading-snug font-medium">{pickerActionNotice}</span>
              </span>
              <button
                type="button"
                onClick={() => setPickerActionNotice(null)}
                className="p-0.5 rounded shrink-0"
                aria-label={t.close}
              >
                <X size={13} />
              </button>
            </div>
          )}

          {!driveConnected ? (
            <div className="rounded-2xl bg-[#F4EDE0]/90 dark:bg-[#041813]/85 border border-[#D9CEB8] dark:border-[#C6A259]/25 p-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF6EC] dark:bg-[#0D3A2E] border border-[#B49049]/40 dark:border-[#C6A259]/35 flex items-center justify-center text-[#7D602D] dark:text-[#DFC589] shadow-sm">
                <FolderOpen size={24} />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC]">
                  {t.connectGoogleDrive}
                </h3>
                <p className="text-xs text-[#5B7469] dark:text-[#9EB5AC] leading-relaxed">
                  {t.driveConnectPrompt}
                </p>
              </div>
              <div className="pt-1 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => void handleConnect()}
                  disabled={driveBusy}
                  className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-full bg-white hover:bg-[#F7F7F7] dark:bg-[#FAF6EC] dark:hover:bg-[#EFE6D2] text-[#1F1F1F] border border-[#747775]/40 text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-60"
                >
                  {driveBusy ? (
                    <Loader2 size={15} className="animate-spin text-[#0D3A2E]" />
                  ) : (
                    <GoogleGMark />
                  )}
                  <span>{driveBusy ? t.connectingGoogleDrive : t.connectGoogleDrive}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleOpenPicker()}
                  disabled={driveBusy || isOpeningPicker}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-60"
                >
                  {isOpeningPicker ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FolderSearch size={14} />
                  )}
                  <span>{isOpeningPicker ? t.openingGooglePicker : t.pickFromGoogleDrive}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Account & Folder Status Bar + Google Picker Trigger */}
              <div className="p-3.5 rounded-2xl bg-[#F4EDE0]/90 dark:bg-[#041813]/85 border border-[#D9CEB8] dark:border-[#C6A259]/25 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6EC] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-xs font-medium text-[#06231B] dark:text-[#EAD7A4]">
                    <FolderOpen size={13} className="text-[#7D602D] dark:text-[#DFC589]" />
                    <span>{t.driveFolderBadge}</span>
                  </span>
                  {user?.email && (
                    <span className="text-xs text-[#5B7469] dark:text-[#9EB5AC] truncate">
                      {user.email}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleOpenPicker()}
                    disabled={isOpeningPicker}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isOpeningPicker ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <FolderSearch size={13} />
                    )}
                    <span>{isOpeningPicker ? t.openingGooglePicker : t.pickFromGoogleDrive}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void loadFiles()}
                    disabled={isLoadingFiles}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF6EC] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] text-xs font-medium transition-colors disabled:opacity-50"
                    title={t.driveRefresh}
                  >
                    <RefreshCw size={12} className={isLoadingFiles ? 'animate-spin' : ''} />
                    <span>{t.driveRefresh}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => disconnectGoogleDrive()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF6EC] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#5B7469] dark:text-[#9EB5AC] hover:text-rose-600 dark:hover:text-rose-300 text-xs font-medium transition-colors"
                    title={t.disconnectGoogleDrive}
                  >
                    <Unplug size={12} />
                    <span>{t.disconnectGoogleDrive}</span>
                  </button>
                </div>
              </div>

              {/* Selected File from Google Picker */}
              {pickedFile && (
                <div className="p-4 rounded-2xl bg-[#E9F3EE]/70 dark:bg-[#092E24]/90 border border-[#236D56]/35 dark:border-[#DFC589]/40 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#FAF6EC] dark:bg-[#041813] border border-[#D9CEB8] dark:border-[#C6A259]/25 flex items-center justify-center shrink-0">
                        {getFileIcon(pickedFile)}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#114637] dark:text-[#DFC589]">
                          {t.pickerSelectedTitle}
                        </span>
                        <p className="text-sm font-semibold text-[#06231B] dark:text-[#FAF6EC] truncate">
                          {pickedFile.name}
                        </p>
                        <p className="text-[11px] text-[#5B7469] dark:text-[#9EB5AC] truncate">
                          {[pickedFile.mimeType, formatBytes(pickedFile.sizeBytes)]
                            .filter((part) => part && part !== '—')
                            .join(' · ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {pickedFile.url && (
                        <a
                          href={pickedFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t.openInDrive}
                          aria-label={`${t.openInDrive}: ${pickedFile.name}`}
                          className="p-1.5 rounded-lg text-[#5B7469] dark:text-[#9EB5AC] hover:text-[#06231B] dark:hover:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {pickedContent?.kind !== 'binary' && (
                        <button
                          type="button"
                          onClick={() => void handleDownloadFile(pickedFile)}
                          disabled={downloadingId === pickedFile.id}
                          aria-label={`Download ${pickedFile.name}`}
                          className="p-1.5 rounded-lg text-[#5B7469] dark:text-[#9EB5AC] hover:text-[#06231B] dark:hover:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors disabled:opacity-50"
                        >
                          {downloadingId === pickedFile.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={clearPickedPreview}
                        aria-label={t.close}
                        className="p-1.5 rounded-lg text-[#5B7469] dark:text-[#9EB5AC] hover:text-[#06231B] dark:hover:text-[#FAF6EC] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {isLoadingPickedContent ? (
                    <div className="py-4 flex items-center justify-center gap-2 text-xs text-[#5B7469] dark:text-[#9EB5AC]">
                      <Loader2 size={15} className="animate-spin text-[#114637] dark:text-[#DFC589]" />
                      <span>{t.pickerLoadingPreview}</span>
                    </div>
                  ) : pickedContent?.kind === 'audio' && pickedAudioUrl ? (
                    <div className="space-y-1.5">
                      <span className="block text-[11px] font-medium text-[#5B7469] dark:text-[#9EB5AC]">
                        {t.pickerAudioPreviewLabel}
                      </span>
                      <audio controls src={pickedAudioUrl} className="w-full h-10" />
                    </div>
                  ) : pickedContent?.kind === 'text' ? (
                    <div className="space-y-2.5">
                      {pickedContent.text.trim() ? (
                        <pre className="max-h-36 overflow-y-auto custom-scrollbar p-3 rounded-xl bg-[#FAF6EC] dark:bg-[#041813]/90 border border-[#D9CEB8] dark:border-[#C6A259]/20 text-xs text-[#06231B] dark:text-[#FAF6EC] whitespace-pre-wrap break-words font-sans leading-relaxed">
                          {pickedContent.text.slice(0, 3000)}
                        </pre>
                      ) : (
                        <p className="text-xs text-[#5B7469] dark:text-[#9EB5AC]">
                          {t.pickerEmptyTextNotice}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {parsedImport?.kind === 'favorites-backup' &&
                          parsedImport.favoriteVoiceIds &&
                          onImportFavorites && (
                            <button
                              type="button"
                              onClick={() => {
                                const importedCount = onImportFavorites(
                                  parsedImport.favoriteVoiceIds || []
                                );
                                setPickerActionNotice(
                                  t.pickerFavoritesImportedNotice(importedCount)
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] text-[#FAF6EC] dark:text-[#041813] text-xs font-semibold shadow-sm transition-all"
                            >
                              <Heart size={13} />
                              <span>
                                {t.pickerImportFavorites(parsedImport.favoriteVoiceIds.length)}
                              </span>
                            </button>
                          )}

                        {parsedImport?.kind === 'character-profile' &&
                          parsedImport.voiceId &&
                          onApplyCharacterProfile && (
                            <button
                              type="button"
                              onClick={() => {
                                const targetVoiceId = parsedImport.voiceId!;
                                onApplyCharacterProfile(
                                  targetVoiceId,
                                  parsedImport.characterName ?? null,
                                  parsedImport.transcriptText ?? null
                                );
                                setPickerActionNotice(
                                  t.pickerProfileAppliedNotice(targetVoiceId)
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] text-[#FAF6EC] dark:text-[#041813] text-xs font-semibold shadow-sm transition-all"
                            >
                              <UserCheck size={13} />
                              <span>{t.pickerApplyProfile(parsedImport.voiceId)}</span>
                            </button>
                          )}

                        {activeVoice &&
                          onApplyScriptToVoice &&
                          (parsedImport?.transcriptText || pickedContent.text.trim()) && (
                            <button
                              type="button"
                              onClick={() => {
                                const rawScript = (
                                  parsedImport?.transcriptText || pickedContent.text.trim()
                                ).slice(0, MAX_CHARACTER_TRANSCRIPT_LENGTH);
                                onApplyScriptToVoice(activeVoice.name, rawScript);
                                setPickerActionNotice(
                                  t.pickerScriptAppliedNotice(activeVoiceLabel)
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF6EC] dark:bg-[#041813] border border-[#D9CEB8] dark:border-[#C6A259]/35 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] text-xs font-medium transition-colors"
                            >
                              <Sparkles size={13} className="text-[#7D602D] dark:text-[#DFC589]" />
                              <span>{t.pickerApplyScriptToVoice(activeVoiceLabel)}</span>
                            </button>
                          )}
                      </div>
                    </div>
                  ) : pickedContent?.kind === 'binary' ? (
                    <p className="text-xs text-[#5B7469] dark:text-[#9EB5AC]">
                      {t.pickerUnsupportedFileNotice}
                    </p>
                  ) : null}
                </div>
              )}

              {/* Quick Save Favorites Actions */}
              {favoriteVoices.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#F4EDE0]/75 dark:bg-[#092E24]/80 border border-[#D9CEB8] dark:border-[#C6A259]/25 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#06231B] dark:text-[#FAF6EC]">
                      {t.favorites} ({favoriteVoices.length})
                    </span>
                    <span className="text-[11px] text-[#5B7469] dark:text-[#9EB5AC]">
                      {t.saveToGoogleDrive}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveFavoritesJsonToDrive()}
                      disabled={isSavingAction !== null}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF6EC] dark:bg-[#041813] border border-[#D9CEB8] dark:border-[#C6A259]/30 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isSavingAction === 'json' ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <FileJson size={13} />
                      )}
                      <span>
                        {isSavingAction === 'json' ? t.savingToDrive : t.saveFavoritesJsonToDrive}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleSaveFavoritesZipToDrive()}
                      disabled={isSavingAction !== null}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSavingAction === 'zip' ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <FolderDown size={13} />
                      )}
                      <span>
                        {isSavingAction === 'zip' ? t.savingToDrive : t.saveFavoritesZipToDrive}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Explicit Delete Confirmation Dialog (in-app, never window.confirm) */}
              {pendingDeleteFile && (
                <div
                  role="alertdialog"
                  aria-modal="false"
                  aria-labelledby="drive-delete-confirm-title"
                  className="p-4 rounded-2xl bg-rose-50 dark:bg-[#2A1014]/90 border border-rose-200 dark:border-rose-800/70 space-y-3"
                >
                  <div className="space-y-1">
                    <h4
                      id="drive-delete-confirm-title"
                      className="text-xs font-bold text-rose-800 dark:text-rose-200"
                    >
                      {t.driveDeleteConfirmTitle}
                    </h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                      {t.driveDeleteConfirmBody(pendingDeleteFile.name)}
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingDeleteFile(null)}
                      disabled={deletingId !== null}
                      className="px-3 py-1.5 rounded-lg bg-[#FAF6EC] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-xs font-medium text-[#06231B] dark:text-[#FAF6EC] hover:bg-[#EBE2CE] dark:hover:bg-[#114637]"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirmDelete()}
                      disabled={deletingId !== null}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      {deletingId && <Loader2 size={12} className="animate-spin" />}
                      <span>{t.driveConfirmDeleteBtn}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Drive Files List */}
              <div className="space-y-2.5">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5B7469] dark:text-[#C6A259]">
                  {t.driveFilesTitle} ({files.length})
                </h3>

                {isLoadingFiles && files.length === 0 ? (
                  <div className="py-10 flex items-center justify-center">
                    <Loader2 size={22} className="animate-spin text-[#114637] dark:text-[#DFC589]" />
                  </div>
                ) : files.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#F4EDE0]/60 dark:bg-[#041813]/70 border border-[#D9CEB8]/80 dark:border-[#C6A259]/20 text-center space-y-1.5">
                    <p className="text-sm font-serif font-medium text-[#06231B] dark:text-[#FAF6EC]">
                      {t.driveEmptyTitle}
                    </p>
                    <p className="text-xs text-[#5B7469] dark:text-[#9EB5AC] max-w-md mx-auto leading-relaxed">
                      {t.driveEmptyHint}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 rounded-xl bg-[#FAF6EC] dark:bg-[#092E24]/85 border border-[#D9CEB8] dark:border-[#C6A259]/20 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#F4EDE0] dark:bg-[#041813] border border-[#D9CEB8] dark:border-[#C6A259]/20 flex items-center justify-center shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#06231B] dark:text-[#FAF6EC] truncate">
                              {file.name}
                            </p>
                            <p className="text-[11px] text-[#5B7469] dark:text-[#9EB5AC] truncate">
                              {[formatBytes(file.size), formatModifiedDate(file.modifiedTime)]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={t.openInDrive}
                              aria-label={`${t.openInDrive}: ${file.name}`}
                              className="p-1.5 rounded-lg text-[#5B7469] dark:text-[#9EB5AC] hover:text-[#06231B] dark:hover:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => void handleDownloadFile(file)}
                            disabled={downloadingId === file.id}
                            title={file.name}
                            aria-label={`Download ${file.name}`}
                            className="p-1.5 rounded-lg text-[#5B7469] dark:text-[#9EB5AC] hover:text-[#06231B] dark:hover:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors disabled:opacity-50"
                          >
                            {downloadingId === file.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setPendingDeleteFile(file)}
                            title={t.driveDeleteFile}
                            aria-label={`${t.driveDeleteFile}: ${file.name}`}
                            className="p-1.5 rounded-lg text-[#5B7469] dark:text-[#9EB5AC] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveModal;
