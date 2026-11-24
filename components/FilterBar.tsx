/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { FilterState } from '../types';
import {
  Search,
  Sparkles,
  ChevronDown,
  LayoutGrid,
  GalleryHorizontalEnd,
  Sun,
  Moon,
  Heart,
  Menu,
  Columns2,
  AudioLines,
  BarChart3,
  Activity,
  Cloud,
  CloudOff,
  LogOut,
  Loader2,
  Check,
  X,
  LogIn,
  Key,
  HardDrive,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useFirebase } from './FirebaseProvider';
import PitchRangeFilter from './PitchRangeFilter';
import NetworkStatusIndicator from './NetworkStatusIndicator';
import PWAInstallButton from './PWAInstallButton';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  uniqueGenders: string[];
  uniquePitches: string[];
  onOpenAiCasting: () => void;
  viewMode: 'carousel' | 'grid' | 'compare';
  onViewModeChange: (mode: 'carousel' | 'grid' | 'compare') => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  favoritesCount: number;
  compareCount: number;
  onOpenFavorites: () => void;
  onOpenMobileSidebar: () => void;
  isVisualizerOpen: boolean;
  onToggleVisualizer: () => void;
  onOpenPitchChart: () => void;
  onOpenUsageStats: () => void;
  onOpenLogin: () => void;
  onOpenApiKeySettings?: () => void;
  onOpenGoogleDrive: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  uniqueGenders,
  uniquePitches,
  onOpenAiCasting,
  viewMode,
  onViewModeChange,
  isDarkMode,
  toggleTheme,
  favoritesCount,
  compareCount,
  onOpenFavorites,
  onOpenMobileSidebar,
  isVisualizerOpen,
  onToggleVisualizer,
  onOpenPitchChart,
  onOpenUsageStats,
  onOpenLogin,
  onOpenApiKeySettings,
  onOpenGoogleDrive,
}) => {
  const { language, setLanguage, t, translateGender, translatePitch } = useI18n();
  const {
    user,
    authBusy,
    authError,
    driveConnected,
    cloudSynced,
    dailyQuota,
    signOut,
    clearAuthError,
  } = useFirebase();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [accountMenuOpen]);

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, gender: e.target.value });
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, pitch: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleToggleFavoritesOnly = () => {
    onFilterChange({ ...filters, favoritesOnly: !filters.favoritesOnly });
  };

  return (
    <>
      {/* Desktop Top Menu Bar (lg and up) */}
      {/* Desktop Top Menu Bar (lg and up) */}
      <div className="hidden lg:block relative z-50 w-full text-[#072920] dark:text-[#FAF6EC] bg-[#FAF6EC]/95 dark:bg-[#06231B]/90 backdrop-blur-xl border-b border-[#D9CEB8] dark:border-[#C6A259]/30 luminous-hairline transition-colors duration-300 shadow-xs before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[#B49049]/35 dark:before:via-[#DFC589]/40 before:to-transparent before:pointer-events-none">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-10 relative">
          {/* Row 1: Brand, AI Casting & Utility Actions */}
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Brand + AI Casting Button */}
            <div className="flex items-center gap-5 shrink-0">
              <div className="flex items-center gap-3 group select-none shrink-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-md shrink-0 ring-1 ring-[#B49049]/45 dark:ring-[#C6A259]/50">
                  <img
                    src="/assets/aistudio/1Artboard_1_2x_180530e3.png"
                    alt={t.appTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-[#06231B] dark:text-[#FAF6EC] font-serif whitespace-nowrap">
                  {t.appTitle}
                </h1>
              </div>

              <button
                onClick={onOpenAiCasting}
                className="flex items-center gap-2 px-4 py-1.5 bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 dark:border-[#EAD7A4]/50 rounded-full text-xs font-semibold tracking-wide shadow-sm transition-all hover:scale-[1.03] active:scale-95 group shrink-0 whitespace-nowrap"
              >
                <Sparkles
                  size={13}
                  className="text-[#DFC589] dark:text-[#041813] transition-colors shrink-0"
                />
                <span>{t.aiCastingDirector}</span>
              </button>
            </div>

            {/* Right: Actions Group */}
            <div className="flex gap-2.5 shrink-0 items-center">
              <NetworkStatusIndicator />
              {dailyQuota && (
                <div
                  title={t.dailyQuotaTooltip(
                    dailyQuota.userRemaining,
                    dailyQuota.userLimit,
                    dailyQuota.globalRemaining,
                    dailyQuota.globalLimit
                  )}
                  className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-mono tabular-nums font-semibold whitespace-nowrap ${
                    dailyQuota.exhausted
                      ? 'bg-rose-50 dark:bg-[#2A1014] border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
                      : dailyQuota.userRemaining <= 5
                      ? 'bg-[#FAF6EC] dark:bg-[#143D31] border-[#B49049]/50 dark:border-[#C6A259]/45 text-[#7D602D] dark:text-[#EAD7A4]'
                      : 'bg-[#F4EDE0]/85 dark:bg-[#092E24]/85 border-[#D9CEB8] dark:border-[#C6A259]/30 text-[#2B463B] dark:text-[#DFC589]'
                  }`}
                >
                  <span>{t.quotaRemainingShort(dailyQuota.userRemaining, dailyQuota.userLimit)}</span>
                </div>
              )}
              <button
                type="button"
                onClick={onToggleVisualizer}
                aria-pressed={isVisualizerOpen}
                className={`p-2 rounded-lg border transition-all active:scale-95 ${
                  isVisualizerOpen
                    ? 'bg-[#0D3A2E] dark:bg-[#114637] border-[#B49049]/50 dark:border-[#C6A259]/60 text-[#FAF6EC] dark:text-[#EAD7A4] shadow-sm'
                    : 'bg-[#FAF6EC]/90 dark:bg-[#092E24]/85 border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#2B463B] dark:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:text-[#06231B] dark:hover:text-[#FAF6EC] hover:border-[#B49049]/60 dark:hover:border-[#DFC589]/50'
                }`}
                title={t.openAudioVisualizer}
                aria-label={t.openAudioVisualizer}
              >
                <AudioLines size={14} />
              </button>

              <button
                type="button"
                onClick={onOpenPitchChart}
                className="p-2 rounded-lg bg-[#FAF6EC]/90 dark:bg-[#092E24]/85 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#2B463B] dark:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:text-[#06231B] dark:hover:text-[#FAF6EC] hover:border-[#B49049]/60 dark:hover:border-[#DFC589]/50 transition-all active:scale-95 shadow-xs"
                title={t.pitchDistribution}
                aria-label={t.pitchDistribution}
              >
                <BarChart3 size={14} />
              </button>

              <button
                type="button"
                onClick={onOpenUsageStats}
                className="p-2 rounded-lg bg-[#FAF6EC]/90 dark:bg-[#092E24]/85 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#2B463B] dark:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:text-[#06231B] dark:hover:text-[#FAF6EC] hover:border-[#B49049]/60 dark:hover:border-[#DFC589]/50 transition-all active:scale-95 shadow-xs"
                title={t.usageStats}
                aria-label={t.usageStats}
              >
                <Activity size={14} />
              </button>

              <button
                type="button"
                onClick={onOpenGoogleDrive}
                className={`relative p-2 rounded-lg border transition-all active:scale-95 shadow-xs ${
                  driveConnected
                    ? 'bg-[#E9F3EE] dark:bg-[#114637] border-[#236D56]/40 dark:border-[#C6A259]/50 text-[#114637] dark:text-[#DFC589]'
                    : 'bg-[#FAF6EC]/90 dark:bg-[#092E24]/85 border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#2B463B] dark:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:text-[#06231B] dark:hover:text-[#FAF6EC] hover:border-[#B49049]/60 dark:hover:border-[#DFC589]/50'
                }`}
                title={driveConnected ? `${t.googleDrive} · ${t.driveConnected}` : t.connectGoogleDrive}
                aria-label={driveConnected ? `${t.googleDrive} · ${t.driveConnected}` : t.connectGoogleDrive}
              >
                <HardDrive size={14} />
                {driveConnected && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#2E8267] ring-1 ring-[#FAF6EC] dark:ring-[#06231B]" />
                )}
              </button>

              <PWAInstallButton variant="header" />

              <button
                type="button"
                onClick={onOpenFavorites}
                className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF6EC]/90 dark:bg-[#092E24]/85 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#FAF6EC] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:border-[#B49049]/60 dark:hover:border-[#DFC589]/50 transition-colors text-xs font-medium whitespace-nowrap shadow-xs"
                title={t.openFavorites}
                aria-label={`${t.openFavorites} (${favoritesCount})`}
              >
                <Heart
                  size={14}
                  className={
                    favoritesCount > 0
                      ? 'text-[#B49049] dark:text-[#DFC589] fill-[#B49049] dark:fill-[#DFC589]'
                      : 'text-[#5B7469] dark:text-[#9EB5AC]'
                  }
                />
                <span className="hidden xl:inline">{t.favorites}</span>
                {favoritesCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#0D3A2E] dark:bg-[#C6A259] text-[#FAF6EC] dark:text-[#041813] text-[10px] font-bold leading-none tabular-nums">
                    {favoritesCount}
                  </span>
                )}
              </button>

              <div className="flex bg-[#F4EDE0]/90 dark:bg-[#041813]/85 p-1 rounded-lg border border-[#D9CEB8] dark:border-[#C6A259]/30">
                <button
                  onClick={() => onViewModeChange('carousel')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'carousel'
                      ? 'bg-[#FAF6EC] dark:bg-[#114637] text-[#06231B] dark:text-[#DFC589] shadow-sm border border-[#B49049]/35 dark:border-[#C6A259]/40'
                      : 'text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC]'
                  }`}
                  title={t.carouselView}
                  aria-label={t.carouselView}
                >
                  <GalleryHorizontalEnd size={14} />
                </button>
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-[#FAF6EC] dark:bg-[#114637] text-[#06231B] dark:text-[#DFC589] shadow-sm border border-[#B49049]/35 dark:border-[#C6A259]/40'
                      : 'text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC]'
                  }`}
                  title={t.gridView}
                  aria-label={t.gridView}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => onViewModeChange('compare')}
                  className={`relative p-1.5 rounded-md transition-all ${
                    viewMode === 'compare'
                      ? 'bg-[#FAF6EC] dark:bg-[#114637] text-[#06231B] dark:text-[#DFC589] shadow-sm border border-[#B49049]/35 dark:border-[#C6A259]/40'
                      : 'text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC]'
                  }`}
                  title={t.compareView}
                  aria-label={t.compareView}
                >
                  <Columns2 size={14} />
                  {compareCount > 0 && viewMode !== 'compare' && (
                    <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-[#0D3A2E] dark:bg-[#C6A259] text-[#FAF6EC] dark:text-[#041813] text-[9px] font-bold leading-none">
                      {compareCount}
                    </span>
                  )}
                </button>
              </div>

              <div
                className="flex bg-[#F4EDE0]/90 dark:bg-[#041813]/85 p-0.5 rounded-lg border border-[#D9CEB8] dark:border-[#C6A259]/30"
                role="group"
                aria-label={t.switchLanguage}
              >
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide transition-all ${
                    language === 'en'
                      ? 'bg-[#FAF6EC] dark:bg-[#114637] text-[#06231B] dark:text-[#DFC589] shadow-sm'
                      : 'text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC]'
                  }`}
                  aria-pressed={language === 'en'}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('mm')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide transition-all ${
                    language === 'mm'
                      ? 'bg-[#FAF6EC] dark:bg-[#114637] text-[#06231B] dark:text-[#DFC589] shadow-sm'
                      : 'text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC]'
                  }`}
                  aria-pressed={language === 'mm'}
                >
                  MM
                </button>
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-[#FAF6EC]/90 dark:bg-[#092E24]/85 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#7D602D] dark:text-[#DFC589] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:border-[#B49049]/60 dark:hover:border-[#DFC589]/50 transition-colors shadow-xs"
                title={isDarkMode ? t.switchToLight : t.switchToDark}
                aria-label={isDarkMode ? t.switchToLight : t.switchToDark}
              >
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>

              {/* Compact Google Auth & Cloud Sync Menu */}
              <div className="relative" ref={accountMenuRef}>
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setAccountMenuOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-[#FAF6EC]/90 dark:bg-[#092E24] border border-[#D9CEB8]/90 dark:border-[#C6A259]/25 hover:border-[#B49049]/60 dark:hover:border-[#C6A259]/50 text-[#072920] dark:text-[#FAF6EC] transition-all text-xs font-medium"
                      title={`${user.displayName || user.email || t.cloudSynced} · ${cloudSynced ? t.cloudSynced : t.syncingCloud}`}
                      aria-expanded={accountMenuOpen}
                      aria-haspopup="menu"
                    >
                      <span className="relative w-5 h-5 rounded-md overflow-hidden bg-[#0D3A2E] dark:bg-[#C6A259] text-[#FAF6EC] dark:text-[#041813] flex items-center justify-center text-[10px] font-bold shrink-0">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || 'Account'}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          (user.displayName || user.email || 'U').charAt(0).toUpperCase()
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-[#FAF6EC] dark:ring-[#092E24] ${
                            cloudSynced ? 'bg-[#2E8267]' : 'bg-[#DFC589] animate-pulse'
                          }`}
                        />
                      </span>
                      <span className="hidden xl:inline max-w-[90px] truncate">
                        {user.displayName?.split(' ')[0] || t.cloudSynced}
                      </span>
                      <ChevronDown size={12} className="text-[#5B7469] dark:text-[#C6A259]/80" />
                    </button>

                    {accountMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#FAF6EC] dark:bg-[#07221B] border border-[#D9CEB8] dark:border-[#C6A259]/25 shadow-2xl luminous-hairline p-3.5 space-y-2.5 z-[70]"
                      >
                        <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/20">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#0D3A2E] dark:bg-[#C6A259] text-[#FAF6EC] dark:text-[#041813] flex items-center justify-center text-xs font-bold shrink-0">
                            {user.photoURL ? (
                              <img
                                src={user.photoURL}
                                alt={user.displayName || 'Account'}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              (user.displayName || user.email || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#072920] dark:text-[#FAF6EC] truncate">
                              {user.displayName || 'User'}
                            </p>
                            {user.email && (
                              <p className="text-[11px] text-[#5B7469] dark:text-[#8DA399] truncate">
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#E9F3EE] dark:bg-[#0D3A2E]/70 border border-[#236D56]/25 dark:border-[#2E8267]/35 text-[11px] font-medium text-[#114637] dark:text-[#5FA88E]">
                          <span className="inline-flex items-center gap-1.5">
                            <Cloud size={12} />
                            <span>{cloudSynced ? t.cloudSynced : t.syncingCloud}</span>
                          </span>
                          {cloudSynced && <Check size={12} />}
                        </div>

                        {dailyQuota && (
                          <div
                            title={t.dailyQuotaTooltip(
                              dailyQuota.userRemaining,
                              dailyQuota.userLimit,
                              dailyQuota.globalRemaining,
                              dailyQuota.globalLimit
                            )}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] font-medium ${
                              dailyQuota.exhausted
                                ? 'bg-rose-50/90 dark:bg-[#2A1014]/70 border-rose-200/80 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
                                : 'bg-[#F4EDE0]/80 dark:bg-[#092E24]/80 border-[#D9CEB8] dark:border-[#C6A259]/20 text-[#2F4D42] dark:text-[#C6A259]'
                            }`}
                          >
                            <span className="truncate">{t.dailyFreeLimitLabel}</span>
                            <span className="font-mono tabular-nums font-bold shrink-0">
                              {dailyQuota.userRemaining}/{dailyQuota.userLimit}
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            onOpenGoogleDrive();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#F4EDE0] dark:bg-[#0D3126] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] text-[#06231B] dark:text-[#EAD7A4] text-xs font-medium transition-colors border border-[#D9CEB8] dark:border-[#C6A259]/25"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <HardDrive size={13} className="text-[#7D602D] dark:text-[#DFC589]" />
                            <span>{t.googleDrive}</span>
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              driveConnected
                                ? 'bg-[#E9F3EE] dark:bg-[#145240] text-[#114637] dark:text-[#5FA88E]'
                                : 'text-[#5B7469] dark:text-[#9EB5AC]'
                            }`}
                          >
                            {driveConnected ? t.driveConnected : t.connectGoogleDrive}
                          </span>
                        </button>

                        {onOpenApiKeySettings && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setAccountMenuOpen(false);
                              onOpenApiKeySettings();
                            }}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#F4EDE0] dark:bg-[#0D3126] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] text-[#7D602D] dark:text-[#EAD7A4] text-xs font-medium transition-colors border border-[#B49049]/35 dark:border-[#C6A259]/30"
                          >
                            <Key size={13} />
                            <span>{language === 'mm' ? 'Gemini API Key ချိန်ညှိရန်' : 'Gemini API Key Settings'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          role="menuitem"
                          disabled={authBusy}
                          onClick={() => {
                            setAccountMenuOpen(false);
                            void signOut();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#EBE2CE]/70 dark:bg-[#092E24] hover:bg-rose-50 dark:hover:bg-[#2A1014]/60 text-[#2F4D42] dark:text-[#9EB5AC] hover:text-rose-700 dark:hover:text-rose-300 text-xs font-medium transition-colors"
                        >
                          <LogOut size={13} />
                          <span>{t.signOut}</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    disabled={authBusy}
                    title={t.cloudSyncHint}
                    aria-label={t.signInWithGoogle}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0D3A2E] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] hover:bg-[#145240] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] shadow-sm transition-all text-xs font-semibold whitespace-nowrap disabled:opacity-60 active:scale-95"
                  >
                    {authBusy ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <LogIn size={13} />
                    )}
                    <span>{authBusy ? t.signingIn : t.signInWithGoogle}</span>
                  </button>
                )}

                {authError && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-rose-50 dark:bg-[#2A1014]/95 border border-rose-200 dark:border-rose-800 p-2.5 shadow-lg text-[11px] text-rose-700 dark:text-rose-200 flex items-start justify-between gap-2 z-[75]">
                    <span className="inline-flex items-start gap-1.5 leading-snug">
                      <CloudOff size={13} className="shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearAuthError}
                      className="p-0.5 rounded hover:bg-rose-200/60 dark:hover:bg-rose-900/60 shrink-0"
                      aria-label={t.close}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Search & Voice Filters */}
          <div className="relative flex flex-wrap items-center justify-between gap-3 py-2.5 border-t border-[#D9CEB8] dark:border-[#C6A259]/20 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[#B49049]/25 dark:before:via-[#DFC589]/25 before:to-transparent before:pointer-events-none">
            {/* Search Input */}
            <div className="relative group flex-1 min-w-[180px] max-w-xs transition-all">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B7469] dark:text-[#8DA399] group-focus-within:text-[#06231B] dark:group-focus-within:text-[#DFC589] transition-colors">
                <Search size={14} />
              </div>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={filters.search}
                onChange={handleSearchChange}
                className="block w-full pl-9 pr-3 py-1.5 bg-[#FAF6EC]/90 dark:bg-[#041813]/85 border-[#D9CEB8] dark:border-[#C6A259]/25 focus:bg-[#FAF6EC] dark:focus:bg-[#06231B] border focus:border-[#B49049] dark:focus:border-[#DFC589]/70 rounded-lg text-sm text-[#06231B] dark:text-[#FAF6EC] placeholder-[#5B7469] dark:placeholder-[#8DA399] focus:outline-none focus:ring-2 focus:ring-[#B49049]/25 dark:focus:ring-[#C6A259]/20 transition-all shadow-xs"
              />
            </div>

            {/* Desktop Filter Dropdowns + Pitch Hz Range + Favorites Filter */}
            <div className="flex flex-wrap gap-2 items-center shrink-0">
              <div className="relative group">
                <select
                  value={filters.gender}
                  onChange={handleGenderChange}
                  aria-label={t.allGenders}
                  className="appearance-none bg-[#FAF6EC]/90 dark:bg-[#041813]/85 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#FAF6EC] py-1.5 pl-3 pr-8 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#B49049]/25 dark:focus:ring-[#C6A259]/25 hover:border-[#B49049]/60 dark:hover:border-[#C6A259]/45 cursor-pointer transition-all shadow-xs"
                >
                  <option value="All">{t.allGenders}</option>
                  {uniqueGenders.map((g) => (
                    <option key={g} value={g}>
                      {translateGender(g)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5B7469] dark:text-[#C6A259]">
                  <ChevronDown size={12} />
                </div>
              </div>

              <div className="relative group">
                <select
                  value={filters.pitch}
                  onChange={handlePitchChange}
                  aria-label={t.allPitches}
                  className="appearance-none bg-[#FAF6EC]/90 dark:bg-[#041813]/85 border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#FAF6EC] py-1.5 pl-3 pr-8 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#B49049]/25 dark:focus:ring-[#C6A259]/25 hover:border-[#B49049]/60 dark:hover:border-[#C6A259]/45 cursor-pointer transition-all shadow-xs"
                >
                  <option value="All">{t.allPitches}</option>
                  {uniquePitches.map((p) => (
                    <option key={p} value={p}>
                      {translatePitch(p)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#5B7469] dark:text-[#C6A259]">
                  <ChevronDown size={12} />
                </div>
              </div>

              <PitchRangeFilter
                variant="compact"
                value={filters.pitchHzRange}
                onChange={(nextRange) =>
                  onFilterChange({ ...filters, pitchHzRange: nextRange })
                }
              />

              <button
                type="button"
                onClick={handleToggleFavoritesOnly}
                aria-pressed={!!filters.favoritesOnly}
                className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium border whitespace-nowrap transition-all shadow-xs ${
                  filters.favoritesOnly
                    ? 'bg-[#0D3A2E] dark:bg-[#145240] border-[#B49049]/60 dark:border-[#C6A259]/60 text-[#FAF6EC] dark:text-[#EAD7A4]'
                    : 'bg-[#FAF6EC]/90 dark:bg-[#041813]/85 border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#FAF6EC] hover:border-[#B49049]/60 dark:hover:border-[#C6A259]/45'
                }`}
              >
                <Heart size={12} className={filters.favoritesOnly ? 'fill-[#DFC589] text-[#DFC589]' : 'text-[#9C7A3C] dark:text-[#C6A259]'} />
                <span>{t.favoritesOnly}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Compact Fixed Top Bar (< lg) */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 px-4 flex items-center justify-between text-[#072920] dark:text-[#FAF6EC] bg-[#FAF6EC]/95 dark:bg-[#06231B]/90 backdrop-blur-xl border-b border-[#D9CEB8] dark:border-[#C6A259]/30 luminous-hairline transition-colors duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-md shrink-0 ring-1 ring-[#B49049]/45 dark:ring-[#C6A259]/50">
            <img
              src="/assets/aistudio/1Artboard_1_2x_180530e3.png"
              alt={t.appTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-base font-semibold tracking-tight text-[#06231B] dark:text-[#FAF6EC] font-serif truncate">
            {t.appTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <NetworkStatusIndicator compact={true} />
          <PWAInstallButton variant="compact" />
          <button
            type="button"
            onClick={onToggleVisualizer}
            aria-pressed={isVisualizerOpen}
            className={`inline-flex items-center justify-center p-2 rounded-lg border transition-colors ${
              isVisualizerOpen
                ? 'bg-[#0D3A2E] dark:bg-[#145240] border-[#B49049]/50 dark:border-[#C6A259]/55 text-[#FAF6EC] dark:text-[#EAD7A4]'
                : 'bg-[#F4EDE0]/80 dark:bg-[#092E24] border-[#D9CEB8]/80 dark:border-[#C6A259]/20 text-[#2F4D42] dark:text-[#C6A259]'
            }`}
            aria-label={t.openAudioVisualizer}
            title={t.openAudioVisualizer}
          >
            <AudioLines size={16} />
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange(viewMode === 'compare' ? 'carousel' : 'compare')}
            className={`relative inline-flex items-center justify-center p-2 rounded-lg border transition-colors ${
              viewMode === 'compare'
                ? 'bg-[#0D3A2E] dark:bg-[#145240] border-[#B49049]/50 dark:border-[#C6A259]/55 text-[#FAF6EC] dark:text-[#EAD7A4]'
                : 'bg-[#F4EDE0]/80 dark:bg-[#092E24] border-[#D9CEB8]/80 dark:border-[#C6A259]/20 text-[#2F4D42] dark:text-[#C6A259]'
            }`}
            aria-label={t.compareView}
            title={t.compareView}
          >
            <Columns2 size={16} />
            {compareCount > 0 && viewMode !== 'compare' && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-[#0D3A2E] dark:bg-[#C6A259] text-[#FAF6EC] dark:text-[#041813] text-[9px] font-bold leading-none">
                {compareCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenGoogleDrive}
            className={`relative inline-flex items-center justify-center p-2 rounded-lg border transition-colors ${
              driveConnected
                ? 'bg-[#E9F3EE] dark:bg-[#145240] border-[#236D56]/40 dark:border-[#C6A259]/50 text-[#114637] dark:text-[#EAD7A4]'
                : 'bg-[#F4EDE0]/80 dark:bg-[#092E24] border-[#D9CEB8]/80 dark:border-[#C6A259]/20 text-[#2F4D42] dark:text-[#C6A259]'
            }`}
            aria-label={t.googleDrive}
            title={driveConnected ? `${t.googleDrive} · ${t.driveConnected}` : t.connectGoogleDrive}
          >
            <HardDrive size={16} />
            {driveConnected && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#2E8267] ring-1 ring-[#FAF6EC] dark:ring-[#06231B]" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenFavorites}
            className="relative inline-flex items-center justify-center p-2 rounded-lg bg-[#F4EDE0]/80 dark:bg-[#092E24] border border-[#D9CEB8]/80 dark:border-[#C6A259]/20 text-[#2F4D42] dark:text-[#FAF6EC]"
            aria-label={`${t.openFavorites} (${favoritesCount})`}
          >
            <Heart
              size={16}
              className={favoritesCount > 0 ? 'text-[#B49049] dark:text-[#DFC589] fill-[#B49049] dark:fill-[#DFC589]' : ''}
            />
            {favoritesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-[#0D3A2E] dark:bg-[#C6A259] text-[#FAF6EC] dark:text-[#041813] text-[9px] font-bold leading-none">
                {favoritesCount}
              </span>
            )}
          </button>

          {user ? (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#FAF6EC] dark:bg-[#092E24] border border-[#B49049]/40 dark:border-[#C6A259]/35 overflow-hidden text-[#072920] dark:text-[#FAF6EC] text-xs font-bold shrink-0"
              aria-label={user.displayName || t.cloudSynced}
              title={user.displayName || t.cloudSynced}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Account'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                (user.displayName || user.email || 'U').charAt(0).toUpperCase()
              )}
              <span
                className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ring-1 ring-[#FAF6EC] dark:ring-[#092E24] ${
                  cloudSynced ? 'bg-[#2E8267]' : 'bg-[#DFC589] animate-pulse'
                }`}
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF6EC] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/30 text-[#072920] dark:text-[#FAF6EC] text-xs font-semibold shrink-0 active:scale-95 transition-transform"
              aria-label={t.signInWithGoogle}
              title={t.signInWithGoogle}
            >
              <LogIn size={14} className="text-[#114637] dark:text-[#DFC589]" />
              <span className="hidden sm:inline">{t.signInWithGoogle}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="inline-flex items-center justify-center p-2 rounded-lg bg-[#0D3A2E] dark:bg-[#C6A259] text-[#FAF6EC] dark:text-[#041813] shadow-sm active:scale-95 transition-transform"
            aria-label={t.openMenu}
            title={t.openMenu}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterBar;