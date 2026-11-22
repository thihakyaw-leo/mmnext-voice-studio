/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'mm';

const LANGUAGE_STORAGE_KEY = 'gemini-voice-library:language';

export interface TranslationDict {
  appTitle: string;
  aiCastingDirector: string;
  aiCastingShort: string;
  searchPlaceholder: string;
  allGenders: string;
  allPitches: string;
  favorites: string;
  favoritesShort: string;
  favoritesOnly: string;
  openFavorites: string;
  carouselView: string;
  gridView: string;
  switchToLight: string;
  switchToDark: string;
  switchLanguage: string;
  noVoicesFound: string;
  noVoicesHint: string;
  openAiCasting: string;
  noFavoritesTitle: string;
  noFavoritesHint: string;
  noMatchingFavorites: string;
  noMatchingFavoritesHint: string;
  browseAllVoices: string;
  resetFilters: string;
  pitchSuffix: string;
  saveToFavorites: string;
  removeFromFavorites: string;
  favoritesDrawerSubtitle: string;
  showInMainView: string;
  showingFavoritesOnly: string;
  clearAll: string;
  confirmClear: string;
  cancel: string;
  emptyFavoritesDrawerDesc: string;
  focusInLibrary: string;
  playSample: string;
  pauseSample: string;
  previousVoice: string;
  nextVoice: string;
  castingTitle: string;
  castingSubtitle: string;
  castingPlaceholder: string;
  tryLabel: string;
  exampleIrishLabel: string;
  exampleIrishText: string;
  exampleSgLabel: string;
  exampleSgText: string;
  exampleMmLabel: string;
  exampleMmText: string;
  poweredBy: string;
  findVoices: string;
  noMatchingVoicesError: string;
  analysisFailedError: string;
  close: string;
  aiSuggestedPersona: string;
  basedOnDescription: string;
  systemPrompt: string;
  copySystemPrompt: string;
  generating: string;
  stopPreview: string;
  listen: string;
  clickToPreviewAudio: string;
  ttsFailedError: string;
  savedCountLabel: (count: number) => string;
  editCharacterProfile: string;
  characterProfileTitle: string;
  characterProfileSubtitle: string;
  characterNameMmLabel: string;
  characterNameMmPlaceholder: string;
  characterNameEnLabel: string;
  characterNameEnPlaceholder: string;
  saveCharacterProfile: string;
  clearCharacterProfile: string;
  builtInVoiceId: string;
  characterTranscriptLabel: string;
  characterTranscriptPlaceholder: string;
  characterTranscriptHint: string;
  speakTranscript: string;
  clearTranscript: string;
  transcriptSavedBadge: string;
  exportBackupLabel: string;
    exportProfileJson: string;
  exportProfileTxt: string;
  exportedNotice: string;
  myanmarAttireTitle: string;
  myanmarAttireSubtitle: string;
  upperAttireLabel: string;
  lowerAttireLabel: string;
  accessoriesLabel: string;
  personaRoleLabel: string;
  suitableProjectsLabel: string;
  character3dView: string;
  character3dZoomHint: string;
  networkOfflineLabel: string;
  networkOfflineTooltip: string;
  highLatencyLabel: string;
  highLatencyTooltip: (ms: number | null) => string;
  recheckConnection: string;
  exportJson: string;
  exportJsonTooltip: string;
  openMenu: string;
  closeMenu: string;
  filtersSection: string;
  preferencesSection: string;
  lightMode: string;
  darkMode: string;
  carouselShort: string;
  gridShort: string;
  compareView: string;
  compareShort: string;
  compareTitle: string;
  compareSubtitle: string;
  voiceSlotA: string;
  voiceSlotB: string;
  playSequential: string;
  stopComparison: string;
  playingVoiceA: string;
  upNextVoiceB: string;
  playingVoiceB: string;
  swapVoices: string;
  randomPair: string;
  addToCompare: string;
  removeFromCompare: string;
  traitComparison: string;
  genderLabel: string;
  pitchLabel: string;
  characteristicsLabel: string;
  sameTrait: string;
  differentTrait: string;
  speakingNow: string;
  downloadingSpeech: string;
  downloadSpeech: string;
  ttsBoxTitle: string;
  ttsActiveBadge: string;
  ttsPlaceholder: string;
  ttsGeneratingFor: (name: string) => string;
  ttsTapHint: string;
  ttsDefaultHint: string;
  ttsClearText: string;
  ttsDone: string;
  ttsOpenButton: string;
  audioVisualizer: string;
  visualizerWave: string;
  visualizerBars: string;
  visualizerMirror: string;
  openAudioVisualizer: string;
  closeAudioVisualizer: string;
  readyToPlay: string;
  downloadAllFavorites: string;
  downloadingAllZip: string;
  downloadAllFavoritesTooltip: string;
  downloadZipFailedError: string;
  pitchAnalyzerTitle: string;
  pitchButtonLabel: string;
  detectedPitch: string;
  vocalRegister: string;
  pitchRangeLow: string;
  pitchRangeMid: string;
  pitchRangeHigh: string;
  minPitch: string;
  avgPitch: string;
  maxPitch: string;
  pitchContour: string;
  frequencySpectrum: string;
  hoverSpectrumHint: string;
  amplitudeLabel: string;
  scaleLog: string;
  scaleLinear: string;
  peakHoldLabel: string;
  resetStats: string;
  pitchHzFilter: string;
  resetBurmeseNames: string;
  pitchDistribution: string;
  pitchChartTitle: string;
  closeChart: string;
  shortcutNavArrows: string;
  shortcutNavGrid: string;
  shortcutPlayPause: string;
  shortcutWheel: string;
  voiceTagsLabel: string;
  pitchRangeTagLabel: string;
  emotionalToneTagLabel: string;
  signInWithGoogle: string;
  signingIn: string;
  signOut: string;
  cloudSynced: string;
  syncingCloud: string;
  cloudAccountSection: string;
  cloudSyncHint: string;
  favoritesDrawerSyncedSubtitle: string;
  recentCloudCastings: string;
  deleteCasting: string;
  loginTitle: string;
  loginSubtitle: string;
  continueWithGoogle: string;
  continueAsGuest: string;
  loginBenefitFavorites: string;
  loginBenefitNames: string;
  loginBenefitPrefs: string;
  loginBenefitHistory: string;
  favoritesSyncPrompt: string;
  shareVoice: string;
  shareCompare: string;
  shareModalTitle: string;
  shareCompareModalTitle: string;
  shareModalSubtitle: string;
  uniqueShareLink: string;
  copyLink: string;
  linkCopied: string;
  socialMediaSnippet: string;
  copySnippet: string;
  snippetCopied: string;
  shareViaWebShare: string;
  webShareUnsupportedHint: string;
  webShareFailed: string;
  snippetStyleShort: string;
  snippetStyleDetailed: string;
  pitchMinHz: string;
  pitchMaxHz: string;
  resetPitchRange: string;
  signInRequiredNotice: string;
  dailyFreeLimitLabel: string;
  quotaRemainingShort: (remaining: number, limit: number) => string;
  dailyQuotaTooltip: (userRem: number, userLim: number, globalRem: number, globalLim: number) => string;
  dailyQuotaExhaustedBanner: string;
  googleDrive: string;
  connectGoogleDrive: string;
  reconnectGoogleDrive: string;
  disconnectGoogleDrive: string;
  driveConnected: string;
  connectingGoogleDrive: string;
  driveVaultTitle: string;
  driveVaultSubtitle: string;
  driveFolderBadge: string;
  saveToGoogleDrive: string;
  savingToDrive: string;
  savedToDriveNotice: string;
  openInDrive: string;
  driveFilesTitle: string;
  driveEmptyTitle: string;
  driveEmptyHint: string;
  driveRefresh: string;
  driveDeleteFile: string;
  driveDeleteConfirmTitle: string;
  driveDeleteConfirmBody: (fileName: string) => string;
  driveConfirmDeleteBtn: string;
  driveConnectPrompt: string;
  driveTokenExpiredNotice: string;
  saveProfileJsonToDrive: string;
  saveProfileTxtToDrive: string;
  saveAudioWavToDrive: string;
  saveFavoritesJsonToDrive: string;
  saveFavoritesZipToDrive: string;
  driveSaveFailedError: string;
  pickFromGoogleDrive: string;
  openingGooglePicker: string;
  pickerSelectedTitle: string;
  pickerLoadingPreview: string;
  pickerApplyScriptToVoice: (voiceLabel: string) => string;
  pickerScriptAppliedNotice: (voiceLabel: string) => string;
  pickerImportFavorites: (count: number) => string;
  pickerFavoritesImportedNotice: (count: number) => string;
  pickerApplyProfile: (voiceLabel: string) => string;
  pickerProfileAppliedNotice: (voiceLabel: string) => string;
  pickerPickScriptBtn: string;
  pickerLoadBriefBtn: string;
  pickerUnsupportedFileNotice: string;
  pickerAudioPreviewLabel: string;
  pickerEmptyTextNotice: string;
}

const TRANSLATIONS: Record<Language, TranslationDict> = {
  en: {
    appTitle: 'MMNext Studio',
    aiCastingDirector: 'AI Casting Director',
    aiCastingShort: 'Casting',
    searchPlaceholder: 'Search...',
    allGenders: 'All Genders',
    allPitches: 'All Pitches',
    favorites: 'Favorites',
    favoritesShort: 'Saved',
    favoritesOnly: 'Favorites Only',
    openFavorites: 'Open Favorites list',
    carouselView: 'Carousel View',
    gridView: 'Grid View',
    switchToLight: 'Switch to Light Mode',
    switchToDark: 'Switch to Dark Mode',
    switchLanguage: 'Switch language (EN / MM)',
    noVoicesFound: 'No voices found',
    noVoicesHint: 'Try adjusting your filters or use AI Match.',
    openAiCasting: 'Open AI Casting',
    noFavoritesTitle: 'No favorite voices yet',
    noFavoritesHint: 'Save your preferred voices using the heart icon to persist them across sessions.',
    noMatchingFavorites: 'No matching favorites',
    noMatchingFavoritesHint: 'Try clearing your search or filter selections.',
    browseAllVoices: 'Browse All Voices',
    resetFilters: 'Reset Filters',
    pitchSuffix: 'Pitch',
    saveToFavorites: 'Save to Favorites',
    removeFromFavorites: 'Remove from Favorites',
    favoritesDrawerSubtitle: 'Saved locally in your browser',
    showInMainView: 'Filter Main View',
    showingFavoritesOnly: 'Showing Favorites Only',
    clearAll: 'Clear All',
    confirmClear: 'Confirm Clear',
    cancel: 'Cancel',
    emptyFavoritesDrawerDesc:
      'Tap the heart icon on any voice card to add it to your Favorites list. Your selections are saved automatically in this browser.',
    focusInLibrary: 'View in library',
    playSample: 'Play sample',
    pauseSample: 'Pause sample',
    previousVoice: 'Previous voice',
    nextVoice: 'Next voice',
    castingTitle: 'Describe your character.',
    castingSubtitle: 'Gemini will analyze the library and find the perfect match.',
    castingPlaceholder: "e.g. A friendly, energetic narrator for a children's book about space exploration...",
    tryLabel: 'Try:',
    exampleIrishLabel: 'Irish male',
    exampleIrishText: 'A high pitch male with a strong Irish accent.',
    exampleSgLabel: 'Singaporean female',
    exampleSgText: 'An energetic Singaporean female with a strong Singlish accent.',
    exampleMmLabel: 'Burmese narrator',
    exampleMmText: 'A warm, calm storyteller with gentle pacing and a natural Myanmar accent.',
    poweredBy: 'Powered by',
    findVoices: 'Find Voices',
    noMatchingVoicesError: 'No matching voices found.',
    analysisFailedError: 'Analysis failed. Please try again.',
    close: 'Close',
    aiSuggestedPersona: 'AI Suggested Persona',
    basedOnDescription: 'Based on your description',
    systemPrompt: 'System Prompt',
    copySystemPrompt: 'Copy System Prompt',
    generating: 'Generating...',
    stopPreview: 'Stop Preview',
    listen: 'Listen',
    clickToPreviewAudio: 'Click to preview audio',
    ttsFailedError: 'Failed to generate speech. Please try again.',
    savedCountLabel: (count: number) => `${count} ${count === 1 ? 'voice' : 'voices'} saved`,
    editCharacterProfile: 'Edit Character Profile',
    characterProfileTitle: 'Character Profile',
    characterProfileSubtitle: 'Displays verified Gemini voice specifications. Assign a real character label only if needed for your project.',
    characterNameMmLabel: 'Custom Character Name (Project / Script)',
    characterNameMmPlaceholder: 'Leave empty to display real Gemini voice name',
    characterNameEnLabel: 'Romanized / English Label (Optional)',
    characterNameEnPlaceholder: 'e.g. Host, Narrator, or Character Name',
    saveCharacterProfile: 'Save Profile',
    clearCharacterProfile: 'Use Real Voice Name',
    builtInVoiceId: 'Gemini Voice',
    characterTranscriptLabel: 'Character Transcript (TTS Script)',
    characterTranscriptPlaceholder: 'Enter the transcript you want this character to speak...',
    characterTranscriptHint: 'Click Speak to preview immediately, or Save Profile so playing this character anywhere speaks your transcript.',
    speakTranscript: 'Speak Transcript',
    clearTranscript: 'Clear',
    transcriptSavedBadge: 'Transcript TTS',
    exportBackupLabel: 'Local Backup',
    exportProfileJson: 'Export JSON',
    exportProfileTxt: 'Export TXT',
    exportedNotice: 'Downloaded',
    myanmarAttireTitle: 'Myanmar Traditional Attire',
    myanmarAttireSubtitle: 'Authentic 3D visual styling and heritage wardrobe specification',
    upperAttireLabel: 'Upper Garment (အင်္ကျီ)',
    lowerAttireLabel: 'Lower Garment (လုံချည် / ပုဆိုး / ထမီ)',
    accessoriesLabel: 'Accessories & Thanakha (အဆင်တန်ဆာ / သနပ်ခါး)',
    personaRoleLabel: 'Character Persona & Role',
    suitableProjectsLabel: 'Suitable Voice Projects & Genres',
    character3dView: '3D Realistic Myanmar Character',
    character3dZoomHint: 'Click to expand 3D character portrait',
    networkOfflineLabel: 'Offline',
    networkOfflineTooltip: 'No internet connection detected. Cached samples may still play, while cloud sync and live AI calls require connectivity.',
    highLatencyLabel: 'High Latency',
    highLatencyTooltip: (ms: number | null) =>
      ms !== null
        ? `API responses are slower than usual (${(ms / 1000).toFixed(1)}s). Click to re-check.`
        : 'API request is taking longer than usual. Click to re-check.',
    recheckConnection: 'Re-check connection',
    exportJson: 'Export JSON',
    exportJsonTooltip: 'Export favorites as JSON file',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    filtersSection: 'Search & Filters',
    preferencesSection: 'Controls & Settings',
    lightMode: 'Light',
    darkMode: 'Dark',
    carouselShort: 'Carousel',
    gridShort: 'Grid',
    compareView: 'Compare Voices',
    compareShort: 'Compare',
    compareTitle: 'Side-by-Side Comparison',
    compareSubtitle: 'Select two voices from the library and play them sequentially for direct comparison.',
    voiceSlotA: 'Voice A',
    voiceSlotB: 'Voice B',
    playSequential: 'Play Sequentially (A → B)',
    stopComparison: 'Stop Comparison',
    playingVoiceA: 'Playing Voice A (1/2)',
    upNextVoiceB: 'Up next: Voice B...',
    playingVoiceB: 'Playing Voice B (2/2)',
    swapVoices: 'Swap A ↔ B',
    randomPair: 'Random Pair',
    addToCompare: 'Select to Compare',
    removeFromCompare: 'Remove from Compare',
    traitComparison: 'Trait Comparison',
    genderLabel: 'Gender',
    pitchLabel: 'Pitch',
    characteristicsLabel: 'Characteristics',
    sameTrait: 'Same',
    differentTrait: 'Different',
    speakingNow: 'Speaking',
    downloadingSpeech: 'Downloading speech...',
    downloadSpeech: 'Download speech WAV',
    ttsBoxTitle: 'Custom TTS Script',
    ttsActiveBadge: 'Active',
    ttsPlaceholder: 'Type or paste text to synthesize with any voice...',
    ttsGeneratingFor: (name: string) => `Generating speech for ${name}...`,
    ttsTapHint: 'Tap play on any voice card to hear or download this script.',
    ttsDefaultHint: 'Leave empty to play the built-in voice sample.',
    ttsClearText: 'Clear text',
    ttsDone: 'Done',
    ttsOpenButton: 'Open custom TTS script box',
    audioVisualizer: 'Audio Visualizer',
    visualizerWave: 'Wave',
    visualizerBars: 'Bars',
    visualizerMirror: 'Pulse',
    openAudioVisualizer: 'Toggle Audio Visualizer',
    closeAudioVisualizer: 'Close Audio Visualizer',
    readyToPlay: 'Select or play any voice sample',
    downloadAllFavorites: 'Download All Favorites',
    downloadingAllZip: 'Preparing ZIP...',
    downloadAllFavoritesTooltip: 'Download all favorited audio samples as a single ZIP file',
    downloadZipFailedError: 'Failed to download favorites ZIP. Please try again.',
    pitchAnalyzerTitle: 'Live Pitch & Frequency Analyzer',
    pitchButtonLabel: 'Pitch & Freq',
    detectedPitch: 'Detected Pitch (F0)',
    vocalRegister: 'Vocal Range',
    pitchRangeLow: 'Low Register',
    pitchRangeMid: 'Mid Register',
    pitchRangeHigh: 'High Register',
    minPitch: 'Min',
    avgPitch: 'Avg',
    maxPitch: 'Max',
    pitchContour: 'Pitch Contour',
    frequencySpectrum: 'Real-Time Frequency Graph',
    hoverSpectrumHint: 'Hover or tap graph to inspect frequency',
    amplitudeLabel: 'Amplitude',
    scaleLog: 'Log',
    scaleLinear: 'Linear',
    peakHoldLabel: 'Peak',
    resetStats: 'Reset pitch statistics',
    pitchHzFilter: 'Pitch Hz Range',
    resetBurmeseNames: 'Clear Custom Profiles',
    pitchDistribution: 'Pitch Distribution',
    pitchChartTitle: 'Voice Library Pitch Distribution',
    closeChart: 'Close Chart',
    shortcutNavArrows: 'Navigate',
    shortcutNavGrid: 'Grid Nav',
    shortcutPlayPause: 'Play / Pause',
    shortcutWheel: 'Wheel',
    voiceTagsLabel: 'Voice attributes',
    pitchRangeTagLabel: 'Pitch range',
    emotionalToneTagLabel: 'Emotional tone',
    signInWithGoogle: 'Sign In',
    signingIn: 'Signing in...',
    signOut: 'Sign Out',
    cloudSynced: 'Cloud Synced',
    syncingCloud: 'Syncing...',
    cloudAccountSection: 'Cloud Sync',
    cloudSyncHint: 'Sync favorites, custom character profiles & AI castings',
    favoritesDrawerSyncedSubtitle: 'Synced automatically with your Google account',
    recentCloudCastings: 'Recent Cloud Castings',
    deleteCasting: 'Delete casting',
    loginTitle: 'Sign in to MMNext Studio',
    loginSubtitle: 'Connect your Google account to back up and sync your workspace across devices.',
    continueWithGoogle: 'Continue with Google',
    continueAsGuest: 'Continue as Guest',
    loginBenefitFavorites: 'Sync favorite voices across browsers & devices',
    loginBenefitNames: 'Save your custom project character profiles',
    loginBenefitPrefs: 'Remember theme, language & visualizer mode',
    loginBenefitHistory: 'Access recent AI Casting Director results',
    favoritesSyncPrompt: 'Sign in to sync favorites across devices',
    shareVoice: 'Share voice',
    shareCompare: 'Share Pair',
    shareModalTitle: 'Share Voice Persona',
    shareCompareModalTitle: 'Share Voice Comparison',
    shareModalSubtitle: 'Copy a direct link, grab a social post snippet, or share using your device.',
    uniqueShareLink: 'Unique Share Link',
    copyLink: 'Copy Link',
    linkCopied: 'Copied',
    socialMediaSnippet: 'Social Media Snippet',
    copySnippet: 'Copy Snippet',
    snippetCopied: 'Snippet Copied',
    shareViaWebShare: 'Share with Device / Apps',
    webShareUnsupportedHint: 'System share sheet is unavailable in this browser — copy the link or snippet above.',
    webShareFailed: 'Could not open system share sheet. You can copy the link or snippet instead.',
    snippetStyleShort: 'Short Post',
    snippetStyleDetailed: 'Detailed',
    pitchMinHz: 'Min Hz',
    pitchMaxHz: 'Max Hz',
    resetPitchRange: 'Reset Hz range',
    signInRequiredNotice: 'Guest access is disabled. Sign in with Google to enter the studio.',
    dailyFreeLimitLabel: 'Gemini Daily Free Limit',
    quotaRemainingShort: (remaining: number, limit: number) => `${remaining}/${limit} Free`,
    dailyQuotaTooltip: (userRem: number, userLim: number, globalRem: number, globalLim: number) =>
      `Your daily free AI/TTS quota: ${userRem}/${userLim} left · Studio pool: ${globalRem}/${globalLim} left (resets midnight PT)`,
    dailyQuotaExhaustedBanner:
      'Daily free Gemini limit reached. Cached voice samples still play; live AI Casting & new TTS reset at midnight PT.',
    googleDrive: 'Google Drive',
    connectGoogleDrive: 'Connect Google Drive',
    reconnectGoogleDrive: 'Reconnect Drive',
    disconnectGoogleDrive: 'Disconnect Drive',
    driveConnected: 'Drive Connected',
    connectingGoogleDrive: 'Connecting Drive...',
    driveVaultTitle: 'Google Drive Storage',
    driveVaultSubtitle: 'Save voice profiles, favorites backups, and generated WAV audio directly to your own Google Drive.',
    driveFolderBadge: 'Folder: MMNext Studio',
    saveToGoogleDrive: 'Save to Google Drive',
    savingToDrive: 'Saving to Drive...',
    savedToDriveNotice: 'Saved to Google Drive',
    openInDrive: 'Open in Drive',
    driveFilesTitle: 'Saved Files in Your Drive',
    driveEmptyTitle: 'No saved files in your Drive yet',
    driveEmptyHint: 'Save favorites backups, character profiles, or generated WAV audio to store them inside your MMNext Studio folder.',
    driveRefresh: 'Refresh files',
    driveDeleteFile: 'Delete from Drive',
    driveDeleteConfirmTitle: 'Delete file from Google Drive?',
    driveDeleteConfirmBody: (fileName: string) =>
      `Are you sure you want to permanently delete "${fileName}" from your Google Drive?`,
    driveConfirmDeleteBtn: 'Delete File',
    driveConnectPrompt: 'Authorize access to your Google Drive "MMNext Studio" folder to save and manage your voice files.',
    driveTokenExpiredNotice: 'Your Google Drive session expired. Please reconnect Google Drive to continue.',
    saveProfileJsonToDrive: 'JSON to Drive',
    saveProfileTxtToDrive: 'TXT to Drive',
    saveAudioWavToDrive: 'Save WAV to Drive',
    saveFavoritesJsonToDrive: 'Save JSON to Drive',
    saveFavoritesZipToDrive: 'Save Audio ZIP to Drive',
    driveSaveFailedError: 'Failed to save to Google Drive. Please try again.',
    pickFromGoogleDrive: 'Pick from Drive',
    openingGooglePicker: 'Opening Picker...',
    pickerSelectedTitle: 'Selected via Google Picker',
    pickerLoadingPreview: 'Reading file from Google Drive...',
    pickerApplyScriptToVoice: (voiceLabel: string) => `Apply Script to ${voiceLabel}`,
    pickerScriptAppliedNotice: (voiceLabel: string) => `Script applied to ${voiceLabel} TTS transcript.`,
    pickerImportFavorites: (count: number) => `Import ${count} Favorite${count === 1 ? '' : 's'}`,
    pickerFavoritesImportedNotice: (count: number) => `Imported ${count} voice${count === 1 ? '' : 's'} into Favorites.`,
    pickerApplyProfile: (voiceLabel: string) => `Apply Profile to ${voiceLabel}`,
    pickerProfileAppliedNotice: (voiceLabel: string) => `Character profile applied to ${voiceLabel}.`,
    pickerPickScriptBtn: 'Pick from Drive',
    pickerLoadBriefBtn: 'Pick Brief from Drive',
    pickerUnsupportedFileNotice: 'Binary file selected — download or open in Drive to view.',
    pickerAudioPreviewLabel: 'Audio Preview',
    pickerEmptyTextNotice: 'The selected file has no readable text.',
  },
  mm: {
    appTitle: 'MMNext Studio',
    aiCastingDirector: 'AI အသံရွေးချယ်သူ',
    aiCastingShort: 'ရွေးချယ်ရန်',
    searchPlaceholder: 'ရှာဖွေရန်...',
    allGenders: 'ကျား/မ အားလုံး',
    allPitches: 'အသံအနိမ့်အမြင့် အားလုံး',
    favorites: 'အနှစ်သက်ဆုံးများ',
    favoritesShort: 'သိမ်းဆည်းမှု',
    favoritesOnly: 'အနှစ်သက်ဆုံးများသာ',
    openFavorites: 'အနှစ်သက်ဆုံးစာရင်း ဖွင့်ရန်',
    carouselView: 'ကတ်လှည့်ကြည့်ရှုမှု',
    gridView: 'ဇယားကွက်ကြည့်ရှုမှု',
    switchToLight: 'အလင်းပုံစံသို့ ပြောင်းရန်',
    switchToDark: 'အမှောင်ပုံစံသို့ ပြောင်းရန်',
    switchLanguage: 'ဘာသာစကား ပြောင်းရန် (EN / MM)',
    noVoicesFound: 'အသံများ မတွေ့ရှိပါ',
    noVoicesHint: 'စစ်ထုတ်မှုများကို ချိန်ညှိကြည့်ပါ သို့မဟုတ် AI Casting ကို အသုံးပြုပါ။',
    openAiCasting: 'AI အသံရွေးချယ်မှု ဖွင့်ရန်',
    noFavoritesTitle: 'အနှစ်သက်ဆုံး အသံများ မရှိသေးပါ',
    noFavoritesHint: 'သင်နှစ်သက်သော အသံများကို နှလုံးသားပုံလေးနှိပ်၍ နောက်ပိုင်းတွင် ပြန်သုံးနိုင်ရန် သိမ်းဆည်းထားနိုင်ပါသည်။',
    noMatchingFavorites: 'ကိုက်ညီသော အနှစ်သက်ဆုံးအသံ မတွေ့ပါ',
    noMatchingFavoritesHint: 'ရှာဖွေမှု သို့မဟုတ် စစ်ထုတ်မှုများကို ပြန်လည်ရှင်းလင်းကြည့်ပါ။',
    browseAllVoices: 'အသံအားလုံး ကြည့်ရှုရန်',
    resetFilters: 'စစ်ထုတ်မှုများ ပြန်လည်သတ်မှတ်ရန်',
    pitchSuffix: 'အသံ',
    saveToFavorites: 'အနှစ်သက်ဆုံးသို့ သိမ်းဆည်းရန်',
    removeFromFavorites: 'အနှစ်သက်ဆုံးမှ ဖယ်ရှားရန်',
    favoritesDrawerSubtitle: 'သင့်ဘရောက်ဆာတွင် သိမ်းဆည်းထားသည်',
    showInMainView: 'ပင်မစာမျက်နှာတွင် စစ်ထုတ်ရန်',
    showingFavoritesOnly: 'အနှစ်သက်ဆုံးများသာ ပြသနေသည်',
    clearAll: 'အားလုံးဖျက်ရန်',
    confirmClear: 'ဖျက်ရန် အတည်ပြုမည်',
    cancel: 'မလုပ်တော့ပါ',
    emptyFavoritesDrawerDesc:
      'မည်သည့်အသံကတ်တွင်မဆို နှလုံးသားပုံကို နှိပ်၍ အနှစ်သက်ဆုံးစာရင်းသို့ ထည့်သွင်းနိုင်ပါသည်။ သင့်ရွေးချယ်မှုများကို ဘရောက်ဆာတွင် အလိုအလျောက် သိမ်းဆည်းပေးပါမည်။',
    focusInLibrary: 'စာကြည့်တိုက်တွင် ကြည့်ရန်',
    playSample: 'နမူနာနားထောင်ရန်',
    pauseSample: 'ခေတ္တရပ်ရန်',
    previousVoice: 'ယခင်အသံ',
    nextVoice: 'နောက်အသံ',
    castingTitle: 'သင့်ဇာတ်ကောင်အကြောင်း ဖော်ပြပါ။',
    castingSubtitle: 'Gemini မှ အသံစာကြည့်တိုက်ကို ဆန်းစစ်ပြီး အသင့်တော်ဆုံး အသံကို ရှာဖွေပေးပါမည်။',
    castingPlaceholder: 'ဥပမာ - အာကာသ စူးစမ်းလေ့လာရေး ကလေးပုံပြင်အတွက် ဖော်ရွေတက်ကြွသော ဇာတ်ကြောင်းပြောသူ...',
    tryLabel: 'စမ်းသုံးကြည့်ရန်:',
    exampleIrishLabel: 'အိုင်ယာလန် အမျိုးသား',
    exampleIrishText: 'A high pitch male with a strong Irish accent.',
    exampleSgLabel: 'စင်ကာပူ အမျိုးသမီး',
    exampleSgText: 'An energetic Singaporean female with a strong Singlish accent.',
    exampleMmLabel: 'မြန်မာ ဇာတ်ကြောင်းပြောသူ',
    exampleMmText: 'A warm, calm storyteller with gentle pacing and a natural Myanmar accent.',
    poweredBy: 'ပံ့ပိုးမှု -',
    findVoices: 'အသံများ ရှာဖွေမည်',
    noMatchingVoicesError: 'ကိုက်ညီသော အသံများ မတွေ့ရှိပါ။',
    analysisFailedError: 'ဆန်းစစ်မှု မအောင်မြင်ပါ။ ထပ်မံကြိုးစားကြည့်ပါ။',
    close: 'ပိတ်ရန်',
    aiSuggestedPersona: 'AI အကြံပြု ဇာတ်ကောင်ပုံစံ',
    basedOnDescription: 'သင့်ဖော်ပြချက်အပေါ် အခြေခံ၍',
    systemPrompt: 'စနစ်ညွှန်ကြားချက် (System Prompt)',
    copySystemPrompt: 'စနစ်ညွှန်ကြားချက် ကူးယူရန်',
    generating: 'ဖန်တီးနေသည်...',
    stopPreview: 'အစမ်းနားထောင်မှု ရပ်ရန်',
    listen: 'နားထောင်ရန်',
    clickToPreviewAudio: 'အသံနမူနာ နားထောင်ရန် နှိပ်ပါ',
    ttsFailedError: 'အသံဖန်တီးမှု မအောင်မြင်ပါ။ ထပ်မံကြိုးစားကြည့်ပါ။',
    savedCountLabel: (count: number) => `${count} ခု သိမ်းဆည်းထားသည်`,
    editCharacterProfile: 'Character Profile ပြင်ဆင်ရန်',
    characterProfileTitle: 'Character Profile (အချက်အလက်အစစ်)',
    characterProfileSubtitle: 'Gemini အသံအစစ်အမှန် အချက်အလက်များကို ပြသထားပါသည်။ သင့်ပရောဂျက်အတွက် လိုအပ်မှသာ ဇာတ်ကောင်အမည်အစစ် ထည့်သွင်းသိမ်းဆည်းနိုင်ပါသည်။',
    characterNameMmLabel: 'စိတ်ကြိုက် ဇာတ်ကောင်အမည် (ပရောဂျက်/ဇာတ်ညွှန်း)',
    characterNameMmPlaceholder: 'Gemini မူရင်းအသံအမည်အတိုင်းထားရန် ဗလာထားပါ',
    characterNameEnLabel: 'အင်္ဂလိပ်အမည်ခွဲ (ထည့်လိုပါက)',
    characterNameEnPlaceholder: 'ဥပမာ - Host, Narrator သို့မဟုတ် အမည်',
    saveCharacterProfile: 'Profile သိမ်းဆည်းမည်',
    clearCharacterProfile: 'မူရင်း Gemini အမည်သာသုံးမည်',
    builtInVoiceId: 'Gemini အသံအမည်',
    characterTranscriptLabel: 'Transcript စာသား (TTS ပြောဆိုရန်)',
    characterTranscriptPlaceholder: 'ဤ Character ဖြင့် အသံထွက်ပြောဆိုစေလိုသော Transcript စာသားကို ရိုက်ထည့်ပါ...',
    characterTranscriptHint: 'ချက်ချင်းနားထောင်ရန် "TTS ဖွင့်မည်" ကိုနှိပ်ပါ သို့မဟုတ် သိမ်းဆည်းပြီး ပင်မစာမျက်နှာမှ ဖွင့်တိုင်း ဤစာသားအတိုင်း TTS ပြုလုပ်ပါမည်။',
    speakTranscript: 'TTS ဖွင့်မည်',
    clearTranscript: 'ရှင်းလင်းမည်',
    transcriptSavedBadge: 'Transcript TTS',
    exportBackupLabel: 'စက်ထဲသို့ သိမ်းဆည်းရန် (Backup)',
    exportProfileJson: 'JSON ထုတ်ယူရန်',
    exportProfileTxt: 'TXT ထုတ်ယူရန်',
    exportedNotice: 'သိမ်းဆည်းပြီး',
    myanmarAttireTitle: 'မြန်မာရိုးရာ ဝတ်စားဆင်ယင်ပုံ',
    myanmarAttireSubtitle: 'စစ်မှန်သော မြန်မာ့ရိုးရာ ဝတ်စုံဒီဇိုင်းနှင့် 3D Character ရုပ်ထွက်အချက်အလက်',
    upperAttireLabel: 'အင်္ကျီဝတ်စုံ',
    lowerAttireLabel: 'လုံချည် / ပုဆိုး / ထမီ',
    accessoriesLabel: 'အဆင်တန်ဆာနှင့် သနပ်ခါး',
    personaRoleLabel: 'ဇာတ်ကောင်စရိုက်နှင့် သရုပ်ဆောင်လေသံ',
    suitableProjectsLabel: 'သင့်တော်သော အသံပရောဂျက် အမျိုးအစားများ',
    character3dView: '3D ရိုးရာဇာတ်ကောင် ရုပ်ထွက်',
    character3dZoomHint: '3D ဇာတ်ကောင်ပုံ အပြည့်အစုံကြည့်ရန် နှိပ်ပါ',
    networkOfflineLabel: 'အော့ဖ်လိုင်း',
    networkOfflineTooltip: 'အင်တာနက်ချိတ်ဆက်မှု ပြတ်တောက်နေပါသည်။ Cache ရှိပြီးသားအသံများကိုသာ ဖွင့်နိုင်ပြီး AI နှင့် Cloud ချိတ်ဆက်မှု ခေတ္တရပ်နေပါသည်။',
    highLatencyLabel: 'API နှေးကွေး',
    highLatencyTooltip: (ms: number | null) =>
      ms !== null
        ? `API တုံ့ပြန်ချိန် ပုံမှန်ထက် နှေးကွေးနေပါသည် (${(ms / 1000).toFixed(1)}s)။ ပြန်လည်စစ်ဆေးရန် နှိပ်ပါ။`
        : 'API ချိတ်ဆက်မှု ကြာမြင့်နေပါသည်။ ပြန်လည်စစ်ဆေးရန် နှိပ်ပါ။',
    recheckConnection: 'ချိတ်ဆက်မှု ပြန်စစ်မည်',
    exportJson: 'JSON ထုတ်ယူရန်',
    exportJsonTooltip: 'အနှစ်သက်ဆုံးစာရင်းကို JSON ဖိုင်အဖြစ် ထုတ်ယူရန်',
    openMenu: 'မီနူး ဖွင့်ရန်',
    closeMenu: 'မီနူး ပိတ်ရန်',
    filtersSection: 'ရှာဖွေမှုနှင့် စစ်ထုတ်မှုများ',
    preferencesSection: 'ထိန်းချုပ်မှုနှင့် ဆက်တင်များ',
    lightMode: 'အလင်း',
    darkMode: 'အမှောင်',
    carouselShort: 'ကတ်လှည့်',
    gridShort: 'ဇယားကွက်',
    compareView: 'အသံနှိုင်းယှဉ်မှု',
    compareShort: 'နှိုင်းယှဉ်',
    compareTitle: 'အသံ နှစ်ခု ယှဉ်တွဲနားထောင်ရန်',
    compareSubtitle: 'အသံစာကြည့်တိုက်မှ အသံနှစ်ခုကို ရွေးချယ်ပြီး တစ်ခုပြီးတစ်ခု ဆက်တိုက်နားထောင် နှိုင်းယှဉ်နိုင်ပါသည်။',
    voiceSlotA: 'အသံ (A)',
    voiceSlotB: 'အသံ (B)',
    playSequential: 'ဆက်တိုက်နားထောင်မည် (A → B)',
    stopComparison: 'နှိုင်းယှဉ်မှု ရပ်မည်',
    playingVoiceA: 'အသံ (A) ဖွင့်နေသည် (၁/၂)',
    upNextVoiceB: 'နောက်တစ်ခု - အသံ (B)...',
    playingVoiceB: 'အသံ (B) ဖွင့်နေသည် (၂/၂)',
    swapVoices: 'A ↔ B နေရာလဲရန်',
    randomPair: 'ကျပန်း နှစ်ခုရွေးရန်',
    addToCompare: 'နှိုင်းယှဉ်ရန် ရွေးချယ်မည်',
    removeFromCompare: 'နှိုင်းယှဉ်မှုမှ ဖယ်ရှားမည်',
    traitComparison: 'အသံလက္ခဏာ နှိုင်းယှဉ်ချက်',
    genderLabel: 'ကျား/မ',
    pitchLabel: 'အသံအနိမ့်အမြင့်',
    characteristicsLabel: 'အသံစရိုက်',
    sameTrait: 'တူညီ',
    differentTrait: 'ကွဲပြား',
    speakingNow: 'ဖွင့်နေသည်',
    downloadingSpeech: 'အသံဖိုင် ဒေါင်းလုဒ်ဆွဲနေသည်...',
    downloadSpeech: 'အသံဖိုင် WAV ဒေါင်းလုဒ်ဆွဲရန်',
    ttsBoxTitle: 'စိတ်ကြိုက် TTS စာသား',
    ttsActiveBadge: 'အသုံးပြုနေသည်',
    ttsPlaceholder: 'မည်သည့်အသံနှင့်မဆို စမ်းသပ်ပြောဆိုစေလိုသော စာသားကို ရိုက်ထည့်ပါ...',
    ttsGeneratingFor: (name: string) => `${name} အတွက် အသံဖန်တီးနေသည်...`,
    ttsTapHint: 'ဤစာသားကို နားထောင်ရန် သို့မဟုတ် ဒေါင်းလုဒ်ဆွဲရန် အသံကတ်တစ်ခုခုကို နှိပ်ပါ။',
    ttsDefaultHint: 'မူရင်းနမူနာအသံကို နားထောင်လိုပါက စာသားအကွက်ကို ဗလာထားပါ။',
    ttsClearText: 'စာသားရှင်းလင်းရန်',
    ttsDone: 'ပြီးပါပြီ',
    ttsOpenButton: 'စိတ်ကြိုက် TTS စာသားအကွက် ဖွင့်ရန်',
    audioVisualizer: 'အသံလှိုင်းပြကွက်',
    visualizerWave: 'လှိုင်း',
    visualizerBars: 'တိုင်များ',
    visualizerMirror: 'နှစ်ဖက်တိုင်',
    openAudioVisualizer: 'အသံလှိုင်းပြကွက် ဖွင့်/ပိတ်ရန်',
    closeAudioVisualizer: 'အသံလှိုင်းပြကွက် ပိတ်ရန်',
    readyToPlay: 'အသံနမူနာတစ်ခုကို ရွေးချယ်၍ ဖွင့်ပါ',
    downloadAllFavorites: 'အနှစ်သက်ဆုံးအားလုံး ဒေါင်းလုဒ်',
    downloadingAllZip: 'ZIP ဖန်တီးနေသည်...',
    downloadAllFavoritesTooltip: 'အနှစ်သက်ဆုံး အသံနမူနာအားလုံးကို ZIP ဖိုင်တစ်ခုတည်းအဖြစ် ဒေါင်းလုဒ်ဆွဲရန်',
    downloadZipFailedError: 'ZIP ဖိုင် ဒေါင်းလုဒ်ဆွဲမှု မအောင်မြင်ပါ။ ထပ်မံကြိုးစားကြည့်ပါ။',
    pitchAnalyzerTitle: 'တိုက်ရိုက် အသံအနိမ့်အမြင့်နှင့် ကြိမ်နှုန်းပြကွက်',
    pitchButtonLabel: 'Pitch & Freq',
    detectedPitch: 'ဖမ်းယူရရှိသော အသံအမြင့် (F0)',
    vocalRegister: 'အသံအတိုင်းအတာ',
    pitchRangeLow: 'အသံနိမ့်',
    pitchRangeMid: 'အသံအလတ်',
    pitchRangeHigh: 'အသံမြင့်',
    minPitch: 'အနိမ့်ဆုံး',
    avgPitch: 'ပျမ်းမျှ',
    maxPitch: 'အမြင့်ဆုံး',
    pitchContour: 'အသံအတက်အကျ မျဉ်းကွေး',
    frequencySpectrum: 'တိုက်ရိုက် ကြိမ်နှုန်းဂရပ်',
    hoverSpectrumHint: 'ကြိမ်နှုန်းကို စစ်ဆေးရန် ဂရပ်ပေါ်သို့ ထောက်ကြည့်ပါ',
    amplitudeLabel: 'အသံလှိုင်း',
    scaleLog: 'Log',
    scaleLinear: 'Linear',
    peakHoldLabel: 'Peak',
    resetStats: 'အသံအမြင့် စာရင်းပြန်လည်သတ်မှတ်ရန်',
    pitchHzFilter: 'အသံအနိမ့်အမြင့် (Hz)',
    resetBurmeseNames: 'စိတ်ကြိုက် Profile အမည်များ ရှင်းလင်းမည်',
    pitchDistribution: 'အသံအနိမ့်အမြင့် ဖြန့်ခွဲမှု',
    pitchChartTitle: 'အသံစာကြည့်တိုက် အနိမ့်အမြင့် ဖြန့်ခွဲမှု ဂရပ်',
    closeChart: 'ဂရပ်ပိတ်ရန်',
    shortcutNavArrows: 'ရွေ့ရန်',
    shortcutNavGrid: 'ဇယားကွက် ရွေ့ရန်',
    shortcutPlayPause: 'ဖွင့် / ရပ်',
    shortcutWheel: 'မောက်စ်ဘီး',
    voiceTagsLabel: 'အသံအချက်အလက် တဂ်များ',
    pitchRangeTagLabel: 'ကြိမ်နှုန်းအပိုင်းအခြား',
    emotionalToneTagLabel: 'ခံစားချက်လေသံ',
    signInWithGoogle: 'ဝင်ရောက်ရန်',
    signingIn: 'ဝင်ရောက်နေသည်...',
    signOut: 'ထွက်ရန်',
    cloudSynced: 'Cloud ချိတ်ဆက်ပြီး',
    syncingCloud: 'ချိတ်ဆက်နေသည်...',
    cloudAccountSection: 'Cloud သိမ်းဆည်းမှု',
    cloudSyncHint: 'အနှစ်သက်ဆုံးများ၊ စိတ်ကြိုက် Character Profile နှင့် AI မှတ်တမ်းများ သိမ်းဆည်းရန်',
    favoritesDrawerSyncedSubtitle: 'သင့် Google အကောင့်နှင့် အလိုအလျောက် ချိတ်ဆက်ထားသည်',
    recentCloudCastings: 'မကြာသေးမီက Cloud ရွေးချယ်မှုများ',
    deleteCasting: 'မှတ်တမ်းဖျက်ရန်',
    loginTitle: 'MMNext Studio သို့ ဝင်ရောက်ရန်',
    loginSubtitle: 'သင့် Google အကောင့်နှင့် ချိတ်ဆက်ပြီး စက်ပစ္စည်းများအကြား ဒေတာများကို သိမ်းဆည်းပါ။',
    continueWithGoogle: 'Google ဖြင့် ဆက်လက်ဝင်ရောက်မည်',
    continueAsGuest: 'ဧည့်သည်အဖြစ် ဆက်သုံးမည်',
    loginBenefitFavorites: 'အနှစ်သက်ဆုံးအသံများကို Cloud တွင် သိမ်းဆည်းရန်',
    loginBenefitNames: 'သင့်ပရောဂျက် Character Profile အစစ်များကို သိမ်းဆည်းထားရန်',
    loginBenefitPrefs: 'အလင်း/အမှောင်၊ ဘာသာစကားနှင့် Visualizer ပုံစံ မှတ်သားရန်',
    loginBenefitHistory: 'AI အသံရွေးချယ်မှု မှတ်တမ်းများကို ပြန်ကြည့်ရန်',
    favoritesSyncPrompt: 'Cloud တွင် သိမ်းဆည်းရန် အကောင့်ဝင်ပါ',
    shareVoice: 'အသံမျှဝေရန်',
    shareCompare: 'နှိုင်းယှဉ်မှု မျှဝေရန်',
    shareModalTitle: 'အသံဇာတ်ကောင် မျှဝေရန်',
    shareCompareModalTitle: 'အသံနှိုင်းယှဉ်မှု မျှဝေရန်',
    shareModalSubtitle: 'တိုက်ရိုက်လင့်ခ် သို့မဟုတ် ဆိုရှယ်မီဒီယာစာသားကို ကူးယူ၍ မျှဝေနိုင်ပါသည်။',
    uniqueShareLink: 'တိုက်ရိုက်မျှဝေရန် လင့်ခ်',
    copyLink: 'လင့်ခ်ကူးယူရန်',
    linkCopied: 'ကူးယူပြီးပါပြီ',
    socialMediaSnippet: 'ဆိုရှယ်မီဒီယာ စာသားနမူနာ',
    copySnippet: 'စာသားကူးယူရန်',
    snippetCopied: 'စာသားကူးယူပြီး',
    shareViaWebShare: 'စက်မှတစ်ဆင့် တိုက်ရိုက်မျှဝေမည်',
    webShareUnsupportedHint: 'ဤဘရောက်ဆာတွင် စက်မှတိုက်ရိုက်မျှဝေမှု မရရှိနိုင်ပါ — အထက်ပါလင့်ခ် သို့မဟုတ် စာသားကို ကူးယူအသုံးပြုပါ။',
    webShareFailed: 'စက်မှတိုက်ရိုက်မျှဝေမှု ဖွင့်မရပါ။ လင့်ခ် သို့မဟုတ် စာသားကို ကူးယူမျှဝေနိုင်ပါသည်။',
    snippetStyleShort: 'အတိုချုံး',
    snippetStyleDetailed: 'အသေးစိတ်',
    pitchMinHz: 'အနိမ့် Hz',
    pitchMaxHz: 'အမြင့် Hz',
    resetPitchRange: 'Hz ပြန်လည်သတ်မှတ်ရန်',
    signInRequiredNotice: 'ဧည့်သည်အဖြစ် အသုံးပြုခွင့် (Guest Mode) ကို ပိတ်ထားပါသည်။ ဆက်လက်အသုံးပြုရန် Google ဖြင့် ဝင်ရောက်ပါ။',
    dailyFreeLimitLabel: 'Gemini နေ့စဉ် အခမဲ့ကန့်သတ်ချက်',
    quotaRemainingShort: (remaining: number, limit: number) => `${remaining}/${limit} ကျန်`,
    dailyQuotaTooltip: (userRem: number, userLim: number, globalRem: number, globalLim: number) =>
      `သင့်နေ့စဉ် AI/TTS အခမဲ့ခွင့်ပြုချက် - ${userRem}/${userLim} ကျန် · Studio စုစုပေါင်း - ${globalRem}/${globalLim} ကျန် (Midnight PT တွင် ပြန်လည်စတင်သည်)`,
    dailyQuotaExhaustedBanner:
      'ယနေ့အတွက် Gemini အခမဲ့ကန့်သတ်ချက် ပြည့်သွားပါပြီ။ Cache ရှိပြီးသားအသံများကို ဆက်နားထောင်နိုင်ပြီး AI/TTS အသစ်များကို Midnight PT တွင် ပြန်သုံးနိုင်ပါမည်။',
    googleDrive: 'Google Drive',
    connectGoogleDrive: 'Google Drive ချိတ်ဆက်မည်',
    reconnectGoogleDrive: 'Drive ပြန်ချိတ်ဆက်မည်',
    disconnectGoogleDrive: 'Drive ဖြုတ်မည်',
    driveConnected: 'Drive ချိတ်ဆက်ပြီး',
    connectingGoogleDrive: 'Drive ချိတ်ဆက်နေသည်...',
    driveVaultTitle: 'Google Drive သိုလှောင်မှု',
    driveVaultSubtitle: 'Character Profile များ၊ အနှစ်သက်ဆုံးစာရင်းနှင့် WAV အသံဖိုင်များကို သင့် Google Drive ထဲသို့ တိုက်ရိုက်သိမ်းဆည်းပါ။',
    driveFolderBadge: 'ဖိုင်တွဲ - MMNext Studio',
    saveToGoogleDrive: 'Google Drive သို့ သိမ်းမည်',
    savingToDrive: 'Drive သို့ သိမ်းနေသည်...',
    savedToDriveNotice: 'Google Drive တွင် သိမ်းဆည်းပြီး',
    openInDrive: 'Drive တွင် ဖွင့်မည်',
    driveFilesTitle: 'သင့် Drive ထဲရှိ သိမ်းဆည်းထားသော ဖိုင်များ',
    driveEmptyTitle: 'Drive ထဲတွင် သိမ်းထားသော ဖိုင် မရှိသေးပါ',
    driveEmptyHint: 'အနှစ်သက်ဆုံး Backup များ၊ Character Profile များ သို့မဟုတ် WAV အသံဖိုင်များကို MMNext Studio ဖိုင်တွဲထဲသို့ သိမ်းဆည်းနိုင်ပါသည်။',
    driveRefresh: 'စာရင်းပြန်စစ်မည်',
    driveDeleteFile: 'Drive မှ ဖျက်မည်',
    driveDeleteConfirmTitle: 'Google Drive မှ ဖိုင်ဖျက်မည်လား?',
    driveDeleteConfirmBody: (fileName: string) =>
      `"${fileName}" ကို သင့် Google Drive မှ အပြီးတိုင် ဖျက်ပစ်ရန် သေချာပါသလား?`,
    driveConfirmDeleteBtn: 'ဖိုင်ဖျက်မည်',
    driveConnectPrompt: 'သင့်ကိုယ်ပိုင် Google Drive ထဲရှိ "MMNext Studio" ဖိုင်တွဲသို့ အသံဖိုင်များ သိမ်းဆည်းစီမံရန် ခွင့်ပြုချက်ပေးပါ။',
    driveTokenExpiredNotice: 'Google Drive ချိတ်ဆက်မှု သက်တမ်းကုန်သွားပါသည်။ ဆက်လက်သိမ်းဆည်းရန် ပြန်လည်ချိတ်ဆက်ပါ။',
    saveProfileJsonToDrive: 'JSON -> Drive',
    saveProfileTxtToDrive: 'TXT -> Drive',
    saveAudioWavToDrive: 'WAV -> Drive သိမ်းမည်',
    saveFavoritesJsonToDrive: 'JSON -> Drive သိမ်းမည်',
    saveFavoritesZipToDrive: 'Audio ZIP -> Drive',
    driveSaveFailedError: 'Google Drive သို့ သိမ်းဆည်းမှု မအောင်မြင်ပါ။ ထပ်မံကြိုးစားကြည့်ပါ။',
    pickFromGoogleDrive: 'Drive မှ ရွေးချယ်မည် (Picker)',
    openingGooglePicker: 'Picker ဖွင့်နေသည်...',
    pickerSelectedTitle: 'Google Picker မှ ရွေးချယ်ထားသော ဖိုင်',
    pickerLoadingPreview: 'Google Drive မှ ဖိုင်အချက်အလက် ဖတ်နေသည်...',
    pickerApplyScriptToVoice: (voiceLabel: string) => `${voiceLabel} ၏ TTS စာသားအဖြစ် ထည့်မည်`,
    pickerScriptAppliedNotice: (voiceLabel: string) => `${voiceLabel} ၏ TTS Transcript ထဲသို့ ထည့်သွင်းပြီးပါပြီ။`,
    pickerImportFavorites: (count: number) => `အနှစ်သက်ဆုံး ${count} ခု ထည့်သွင်းမည်`,
    pickerFavoritesImportedNotice: (count: number) => `အနှစ်သက်ဆုံးအသံ ${count} ခုကို ထည့်သွင်းပြီးပါပြီ။`,
    pickerApplyProfile: (voiceLabel: string) => `${voiceLabel} Profile အဖြစ် အသုံးပြုမည်`,
    pickerProfileAppliedNotice: (voiceLabel: string) => `${voiceLabel} Character Profile ကို အသုံးပြုပြီးပါပြီ။`,
    pickerPickScriptBtn: 'Drive မှ ရွေးမည်',
    pickerLoadBriefBtn: 'Drive မှ စာသားရွေးမည်',
    pickerUnsupportedFileNotice: 'ဤဖိုင်အမျိုးအစားကို တိုက်ရိုက်မဖတ်နိုင်ပါ — ဒေါင်းလုဒ်ဆွဲ၍ သို့မဟုတ် Drive တွင် ဖွင့်ကြည့်နိုင်ပါသည်။',
    pickerAudioPreviewLabel: 'အသံဖိုင် အစမ်းနားထောင်ရန်',
    pickerEmptyTextNotice: 'ရွေးချယ်ထားသော ဖိုင်တွင် စာသားမပါရှိပါ။',
  },
};

const GENDER_MM: Record<string, string> = {
  Male: 'အမျိုးသား',
  Female: 'အမျိုးသမီး',
};

const PITCH_MM: Record<string, string> = {
  Higher: 'အမြင့်',
  Middle: 'အလယ်အလတ်',
  'Lower middle': 'အလယ်အနိမ့်',
  Lower: 'အနိမ့်',
  'Medium-High': 'အလယ်အမြင့်',
  Medium: 'အလယ်',
  'Medium-Low': 'အလယ်အနိမ့်',
  Low: 'အနိမ့်',
};

const TONE_MM: Record<string, string> = {
  Warm: 'နွေးထွေးသော',
  Enthusiastic: 'စိတ်အားထက်သန်သော',
  Energetic: 'တက်ကြွသော',
  Calm: 'တည်ငြိမ်အေးဆေးသော',
  Optimistic: 'အကောင်းမြင်သော',
  Confident: 'ယုံကြည်မှုရှိသော',
  Friendly: 'ဖော်ရွေသော',
  Gentle: 'ညင်သာသော',
  Lively: 'သက်ဝင်လှုပ်ရှားသော',
  Excitable: 'စိတ်လှုပ်ရှားတက်ကြွသော',
  Upbeat: 'ရွှင်လန်းတက်ကြွသော',
  Inviting: 'ဖိတ်ခေါ်နွေးထွေးသော',
  Motivating: 'အားပေးတိုက်တွန်းသော',
  Encouraging: 'အားပေးသော',
  Engaging: 'ဆွဲဆောင်မှုရှိသော',
  Approachable: 'ရင်းနှီးလွယ်သော',
  Inquisitive: 'စူးစမ်းလိုစိတ်ရှိသော',
  Soft: 'နူးညံ့သော',
  Bright: 'ကြည်လင်တောက်ပသော',
  Breezy: 'ပေါ့ပါးလွတ်လပ်သော',
  'Easy-going': 'သက်တောင့်သက်သာရှိသော',
  Smooth: 'ချောမွေ့သော',
  Sophisticated: 'တည်ငြိမ်ရင့်ကျက်သော',
  Informative: 'ဗဟုသုတပေးသော',
  Mature: 'ရင့်ကျက်သော',
  Casual: 'ပေါ့ပေါ့ပါးပါး',
  Firm: 'ခိုင်မာပြတ်သားသော',
  Balanced: 'မျှတသော',
};

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: TranslationDict;
  translateGender: (gender: string) => string;
  translatePitch: (pitch: string) => string;
  translateTone: (tone: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'mm') {
      return saved;
    }
  } catch {
    // Ignore storage access errors
  }
  return 'en';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage access errors
    }
    document.documentElement.lang = language === 'mm' ? 'my' : 'en';
  }, [language]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LANGUAGE_STORAGE_KEY && (e.newValue === 'en' || e.newValue === 'mm')) {
        setLanguageState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState(prev => (prev === 'en' ? 'mm' : 'en'));
  }, []);

  const translateGender = useCallback(
    (gender: string) => (language === 'mm' ? GENDER_MM[gender] || gender : gender),
    [language]
  );

  const translatePitch = useCallback(
    (pitch: string) => (language === 'mm' ? PITCH_MM[pitch] || pitch : pitch),
    [language]
  );

  const translateTone = useCallback(
    (tone: string) => (language === 'mm' ? TONE_MM[tone] || tone : tone),
    [language]
  );

  const t = TRANSLATIONS[language];

  return (
    <I18nContext.Provider value={{ language, setLanguage, toggleLanguage, t, translateGender, translatePitch, translateTone }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
