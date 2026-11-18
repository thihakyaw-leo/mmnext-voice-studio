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
  Shuffle,
  Menu,
  Columns2,
  AudioLines,
  BarChart3,
  Cloud,
  CloudOff,
  LogOut,
  Loader2,
  Check,
  X,
  LogIn,
  Key,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useFirebase } from './FirebaseProvider';
import PitchRangeFilter from './PitchRangeFilter';

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
  onRandomizeNames: () => void;
  onOpenMobileSidebar: () => void;
  isVisualizerOpen: boolean;
  onToggleVisualizer: () => void;
  onOpenPitchChart: () => void;
  onOpenLogin: () => void;
  onOpenApiKeySettings?: () => void;
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
  onRandomizeNames,
  onOpenMobileSidebar,
  isVisualizerOpen,
  onToggleVisualizer,
  onOpenPitchChart,
  onOpenLogin,
  onOpenApiKeySettings,
}) => {
  const { language, setLanguage, t, translateGender, translatePitch } = useI18n();
  const { user, authBusy, authError, cloudSynced, dailyQuota, signOut, clearAuthError } =
    useFirebase();
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
      <div className="hidden lg:block relative z-50 w-full bg-[#FDF7EB]/85 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-300/70 dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Row 1: Brand, AI Casting & Utility Actions */}
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Left: Brand + AI Casting Button */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2.5 group select-none shrink-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-zinc-900/10 shrink-0 ring-1 ring-zinc-300/60 dark:ring-0">
                  <img
                    src="/assets/aistudio/1Artboard_1_2x_180530e3.png"
                    alt={t.appTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-zinc-800 dark:text-white font-display whitespace-nowrap">
                  {t.appTitle}
                </h1>
              </div>

              <button
                onClick={onOpenAiCasting}
                className="flex items-center gap-2 px-4 py-1.5 bg-zinc-800 dark:bg-indigo-600 hover:bg-zinc-700 dark:hover:bg-indigo-500 text-[#FDF7EB] dark:text-white rounded-full text-sm font-medium shadow-md transition-all hover:scale-105 active:scale-95 group shrink-0 whitespace-nowrap"
              >
                <Sparkles
                  size={14}
                  className="text-zinc-300 dark:text-indigo-100 group-hover:text-white transition-colors shrink-0"
                />
                <span className="tracking-wide">{t.aiCastingDirector}</span>
              </button>
            </div>

            {/* Right: Actions Group */}
            <div className="flex gap-2 shrink-0 items-center">
              {dailyQuota && (
                <div
                  title={t.dailyQuotaTooltip(
                    dailyQuota.userRemaining,
                    dailyQuota.userLimit,
                    dailyQuota.globalRemaining,
                    dailyQuota.globalLimit
                  )}
                  className={`hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono tabular-nums font-semibold whitespace-nowrap ${
                    dailyQuota.exhausted
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300'
                      : dailyQuota.userRemaining <= 5
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                      : 'bg-zinc-200/60 dark:bg-zinc-800 border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
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
                    ? 'bg-zinc-800 dark:bg-indigo-600 border-zinc-800 dark:border-indigo-500 text-[#FDF7EB] dark:text-white shadow-sm'
                    : 'bg-zinc-200/60 dark:bg-zinc-800 border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:text-indigo-400 hover:border-zinc-400/70 dark:hover:border-indigo-800'
                }`}
                title={t.openAudioVisualizer}
                aria-label={t.openAudioVisualizer}
              >
                <AudioLines size={14} />
              </button>

              <button
                type="button"
                onClick={onRandomizeNames}
                className="p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:text-indigo-400 hover:border-zinc-400/70 dark:hover:border-indigo-800 transition-all active:scale-95"
                title={t.randomizeNames}
                aria-label={t.randomizeNames}
              >
                <Shuffle size={14} />
              </button>

              <button
                type="button"
                onClick={onOpenPitchChart}
                className="p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:text-indigo-400 hover:border-zinc-400/70 dark:hover:border-indigo-800 transition-all active:scale-95"
                title={t.pitchDistribution}
                aria-label={t.pitchDistribution}
              >
                <BarChart3 size={14} />
              </button>

              <button
                type="button"
                onClick={onOpenFavorites}
                className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 transition-colors text-xs font-medium whitespace-nowrap"
                title={t.openFavorites}
                aria-label={`${t.openFavorites} (${favoritesCount})`}
              >
                <Heart
                  size={14}
                  className={favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : ''}
                />
                <span className="hidden xl:inline">{t.favorites}</span>
                {favoritesCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                    {favoritesCount}
                  </span>
                )}
              </button>

              <div className="flex bg-zinc-200/60 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-300/70 dark:border-zinc-700">
                <button
                  onClick={() => onViewModeChange('carousel')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'carousel'
                      ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'
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
                      ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'
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
                      ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                  title={t.compareView}
                  aria-label={t.compareView}
                >
                  <Columns2 size={14} />
                  {compareCount > 0 && viewMode !== 'compare' && (
                    <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white text-[9px] font-bold leading-none">
                      {compareCount}
                    </span>
                  )}
                </button>
              </div>

              <div
                className="flex bg-zinc-200/60 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-300/70 dark:border-zinc-700"
                role="group"
                aria-label={t.switchLanguage}
              >
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide transition-all ${
                    language === 'en'
                      ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'
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
                      ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                  aria-pressed={language === 'mm'}
                >
                  MM
                </button>
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
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
                      className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-white/90 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-indigo-700 text-zinc-700 dark:text-zinc-200 transition-all text-xs font-medium"
                      title={`${user.displayName || user.email || t.cloudSynced} · ${cloudSynced ? t.cloudSynced : t.syncingCloud}`}
                      aria-expanded={accountMenuOpen}
                      aria-haspopup="menu"
                    >
                      <span className="relative w-5 h-5 rounded-md overflow-hidden bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white flex items-center justify-center text-[10px] font-bold shrink-0">
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
                          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white dark:ring-zinc-800 ${
                            cloudSynced ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                          }`}
                        />
                      </span>
                      <span className="hidden xl:inline max-w-[90px] truncate">
                        {user.displayName?.split(' ')[0] || t.cloudSynced}
                      </span>
                      <ChevronDown size={12} className="text-zinc-400" />
                    </button>

                    {accountMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#FDF7EB] dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800 shadow-xl p-3 space-y-2.5 z-[70]"
                      >
                        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-300/60 dark:border-zinc-800">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white flex items-center justify-center text-xs font-bold shrink-0">
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
                            <p className="text-xs font-semibold text-zinc-800 dark:text-white truncate">
                              {user.displayName || 'User'}
                            </p>
                            {user.email && (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
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
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-[11px] font-medium ${
                              dailyQuota.exhausted
                                ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
                                : 'bg-white/80 dark:bg-zinc-800/70 border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            <span className="truncate">{t.dailyFreeLimitLabel}</span>
                            <span className="font-mono tabular-nums font-bold shrink-0">
                              {dailyQuota.userRemaining}/{dailyQuota.userLimit}
                            </span>
                          </div>
                        )}

                        {onOpenApiKeySettings && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setAccountMenuOpen(false);
                              onOpenApiKeySettings();
                            }}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-medium transition-colors border border-violet-200 dark:border-violet-800/60"
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
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-700 dark:text-zinc-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium transition-colors"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 dark:bg-indigo-600 hover:bg-zinc-700 dark:hover:bg-indigo-500 text-[#FDF7EB] dark:text-white shadow-sm transition-all text-xs font-semibold whitespace-nowrap disabled:opacity-60 active:scale-95"
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
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-800 p-2.5 shadow-lg text-[11px] text-rose-700 dark:text-rose-200 flex items-start justify-between gap-2 z-[75]">
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
          <div className="flex flex-wrap items-center justify-between gap-2.5 py-2 border-t border-zinc-300/60 dark:border-zinc-800/80">
            {/* Search Input */}
            <div className="relative group flex-1 min-w-[180px] max-w-xs transition-all">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-500 group-focus-within:text-zinc-700 dark:group-focus-within:text-zinc-300 transition-colors">
                <Search size={14} />
              </div>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={filters.search}
                onChange={handleSearchChange}
                className="block w-full pl-8 pr-2.5 py-1.5 bg-zinc-200/60 dark:bg-zinc-800 border-zinc-300/60 dark:border-transparent focus:bg-white/90 dark:focus:bg-zinc-900 border focus:border-zinc-400 dark:focus:border-indigo-700 rounded-lg text-sm text-zinc-800 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300/60 dark:focus:ring-indigo-900/30 transition-all"
              />
            </div>

            {/* Desktop Filter Dropdowns + Pitch Hz Range + Favorites Filter */}
            <div className="flex flex-wrap gap-2 items-center shrink-0">
              <div className="relative group">
                <select
                  value={filters.gender}
                  onChange={handleGenderChange}
                  aria-label={t.allGenders}
                  className="appearance-none bg-white/85 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 py-1.5 pl-3 pr-8 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-300/60 dark:focus:ring-indigo-900 hover:bg-zinc-100/80 dark:hover:bg-zinc-700 cursor-pointer transition-all"
                >
                  <option value="All">{t.allGenders}</option>
                  {uniqueGenders.map((g) => (
                    <option key={g} value={g}>
                      {translateGender(g)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                  <ChevronDown size={12} />
                </div>
              </div>

              <div className="relative group">
                <select
                  value={filters.pitch}
                  onChange={handlePitchChange}
                  aria-label={t.allPitches}
                  className="appearance-none bg-white/85 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 py-1.5 pl-3 pr-8 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-300/60 dark:focus:ring-indigo-900 hover:bg-zinc-100/80 dark:hover:bg-zinc-700 cursor-pointer transition-all"
                >
                  <option value="All">{t.allPitches}</option>
                  {uniquePitches.map((p) => (
                    <option key={p} value={p}>
                      {translatePitch(p)}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
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
                className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium border whitespace-nowrap transition-all ${
                  filters.favoritesOnly
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300'
                    : 'bg-white/85 dark:bg-zinc-800 border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-700'
                }`}
              >
                <Heart size={12} className={filters.favoritesOnly ? 'fill-current' : ''} />
                <span>{t.favoritesOnly}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Compact Fixed Top Bar (< lg) */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 h-14 px-4 flex items-center justify-between bg-[#FDF7EB]/85 dark:bg-zinc-900/85 backdrop-blur-xl border-b border-zinc-300/70 dark:border-zinc-800/80 transition-colors duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-md shadow-zinc-900/10 shrink-0 ring-1 ring-zinc-300/60 dark:ring-0">
            <img
              src="/assets/aistudio/1Artboard_1_2x_180530e3.png"
              alt={t.appTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-800 dark:text-white font-display truncate">
            {t.appTitle}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleVisualizer}
            aria-pressed={isVisualizerOpen}
            className={`inline-flex items-center justify-center p-2 rounded-lg border transition-colors ${
              isVisualizerOpen
                ? 'bg-zinc-800 dark:bg-indigo-600 border-zinc-800 dark:border-indigo-500 text-[#FDF7EB] dark:text-white'
                : 'bg-zinc-200/60 dark:bg-zinc-800 border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200'
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
                ? 'bg-zinc-800 dark:bg-indigo-600 border-zinc-800 dark:border-indigo-500 text-[#FDF7EB] dark:text-white'
                : 'bg-zinc-200/60 dark:bg-zinc-800 border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200'
            }`}
            aria-label={t.compareView}
            title={t.compareView}
          >
            <Columns2 size={16} />
            {compareCount > 0 && viewMode !== 'compare' && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white text-[9px] font-bold leading-none">
                {compareCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenFavorites}
            className="relative inline-flex items-center justify-center p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
            aria-label={`${t.openFavorites} (${favoritesCount})`}
          >
            <Heart
              size={16}
              className={favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : ''}
            />
            {favoritesCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold leading-none">
                {favoritesCount}
              </span>
            )}
          </button>

          {user ? (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/90 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 overflow-hidden text-zinc-800 dark:text-white text-xs font-bold shrink-0"
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
                className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full ring-1 ring-white dark:ring-zinc-900 ${
                  cloudSynced ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
                }`}
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold shrink-0 active:scale-95 transition-transform"
              aria-label={t.signInWithGoogle}
              title={t.signInWithGoogle}
            >
              <LogIn size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">{t.signInWithGoogle}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="inline-flex items-center justify-center p-2 rounded-lg bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white shadow-sm active:scale-95 transition-transform"
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