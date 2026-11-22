/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  X,
  Sparkles,
  Search,
  ChevronDown,
  Heart,
  GalleryHorizontalEnd,
  LayoutGrid,
  Sun,
  Moon,
  Columns2,
  AudioLines,
  BarChart3,
  LogOut,
  Loader2,
  Check,
} from 'lucide-react';
import { FilterState } from '../types';
import { useI18n } from '../i18n';
import { useFirebase } from './FirebaseProvider';
import PitchRangeFilter from './PitchRangeFilter';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
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
  isVisualizerOpen: boolean;
  onToggleVisualizer: () => void;
  onOpenPitchChart: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
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
  isVisualizerOpen,
  onToggleVisualizer,
  onOpenPitchChart,
}) => {
  const { language, setLanguage, t, translateGender, translatePitch } = useI18n();
  const { user, authBusy, authError, cloudSynced, dailyQuota, signInWithGoogle, signOut, clearAuthError } =
    useFirebase();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    sidebarRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !sidebarRef.current) return;

      const focusable = sidebarRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -70 || info.velocity.x < -400) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[95] flex justify-start lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-sidebar-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#020E0B]/65 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Slide-in Sidebar */}
          <motion.aside
            ref={sidebarRef}
            tabIndex={-1}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            drag="x"
            dragConstraints={{ left: -320, right: 0 }}
            dragElastic={{ left: 0.1, right: 0 }}
            onDragEnd={handleDragEnd}
            className="relative w-[84vw] max-w-[320px] h-full bg-[#FAF6EC]/96 dark:bg-[#06231B]/96 backdrop-blur-2xl border-r border-[#D9CEB8] dark:border-[#C6A259]/25 shadow-2xl flex flex-col outline-none"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-md shrink-0 ring-1 ring-[#B49049]/45 dark:ring-[#C6A259]/40">
                  <img
                    src="/assets/aistudio/1Artboard_1_2x_180530e3.png"
                    alt={t.appTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2
                  id="mobile-sidebar-title"
                  className="text-lg font-semibold tracking-tight text-[#072920] dark:text-[#FAF6EC] font-serif truncate"
                >
                  {t.appTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-[#5B7469] dark:text-[#9EB5AC] hover:text-[#072920] dark:hover:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#0D3A2E] transition-colors shrink-0"
                aria-label={t.closeMenu}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
              {/* AI Casting Director CTA */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAiCasting();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0D3A2E] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] hover:bg-[#145240] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 rounded-2xl text-sm font-semibold shadow-md transition-all active:scale-[0.98]"
              >
                <Sparkles size={16} className="text-[#DFC589] dark:text-[#041813]" />
                <span>{t.aiCastingDirector}</span>
              </button>

              {/* Search & Filters Section */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5B7469] dark:text-[#C6A259]">
                  {t.filtersSection}
                </p>

                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5B7469] dark:text-[#8DA399]">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={filters.search}
                    onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                    className="block w-full pl-9 pr-8 py-2.5 bg-[#F4EDE0] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 focus:bg-[#FAF6EC] dark:focus:bg-[#041813] focus:border-[#B49049] dark:focus:border-[#DFC589]/60 rounded-xl text-sm text-[#072920] dark:text-[#FAF6EC] placeholder-[#5B7469] dark:placeholder-[#8DA399] focus:outline-none focus:ring-2 focus:ring-[#B49049]/25 transition-all"
                  />
                  {filters.search && (
                    <button
                      type="button"
                      onClick={() => onFilterChange({ ...filters, search: '' })}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#5B7469] hover:text-[#072920] dark:hover:text-[#EAD7A4]"
                      aria-label={t.resetFilters}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Gender & Pitch Selects */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <select
                      value={filters.gender}
                      onChange={(e) => onFilterChange({ ...filters, gender: e.target.value })}
                      aria-label={t.allGenders}
                      className="appearance-none w-full bg-[#FAF6EC] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#072920] dark:text-[#FAF6EC] py-2.5 pl-3 pr-7 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#B49049]/25"
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

                  <div className="relative">
                    <select
                      value={filters.pitch}
                      onChange={(e) => onFilterChange({ ...filters, pitch: e.target.value })}
                      aria-label={t.allPitches}
                      className="appearance-none w-full bg-[#FAF6EC] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#072920] dark:text-[#FAF6EC] py-2.5 pl-3 pr-7 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#B49049]/25"
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
                </div>

                {/* Granular Pitch Hz Range Filter */}
                <PitchRangeFilter
                  variant="expanded"
                  value={filters.pitchHzRange}
                  onChange={(nextRange) =>
                    onFilterChange({ ...filters, pitchHzRange: nextRange })
                  }
                />

                {/* Favorites Only Filter Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({ ...filters, favoritesOnly: !filters.favoritesOnly })
                  }
                  aria-pressed={!!filters.favoritesOnly}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                    filters.favoritesOnly
                      ? 'bg-[#0D3A2E] dark:bg-[#145240] border-[#B49049]/60 dark:border-[#C6A259]/55 text-[#FAF6EC] dark:text-[#EAD7A4]'
                      : 'bg-[#FAF6EC] dark:bg-[#092E24] border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#072920] dark:text-[#FAF6EC]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Heart size={14} className={filters.favoritesOnly ? 'fill-[#DFC589] text-[#DFC589]' : 'text-[#9C7A3C] dark:text-[#C6A259]'} />
                    <span>{t.favoritesOnly}</span>
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      filters.favoritesOnly ? 'bg-[#DFC589]' : 'bg-[#D9CEB8] dark:bg-[#236D56]'
                    }`}
                  />
                </button>
              </div>

              {/* Controls & Settings Section */}
              <div className="space-y-3 pt-3 border-t border-[#D9CEB8]/80 dark:border-[#C6A259]/20">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5B7469] dark:text-[#C6A259]">
                  {t.preferencesSection}
                </p>

                {/* Open Favorites Drawer */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFavorites();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#FAF6EC] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#072920] dark:text-[#FAF6EC] hover:border-[#B49049]/60 dark:hover:border-[#C6A259]/45 transition-colors text-xs font-medium"
                >
                  <span className="inline-flex items-center gap-2">
                    <Heart
                      size={14}
                      className={favoritesCount > 0 ? 'text-[#B49049] dark:text-[#DFC589] fill-[#B49049] dark:fill-[#DFC589]' : 'text-[#5B7469] dark:text-[#9EB5AC]'}
                    />
                    <span>{t.favorites}</span>
                  </span>
                  {favoritesCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#0D3A2E] dark:bg-[#C6A259] text-[#FAF6EC] dark:text-[#041813] text-[10px] font-bold">
                      {favoritesCount}
                    </span>
                  )}
                </button>

                {/* Audio Visualizer Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleVisualizer();
                    onClose();
                  }}
                  aria-pressed={isVisualizerOpen}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-colors text-xs font-medium ${
                    isVisualizerOpen
                      ? 'bg-[#0D3A2E] dark:bg-[#145240] border-[#B49049]/60 dark:border-[#C6A259]/55 text-[#FAF6EC] dark:text-[#EAD7A4]'
                      : 'bg-[#FAF6EC] dark:bg-[#092E24] border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#072920] dark:text-[#FAF6EC] hover:bg-[#F4EDE0]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <AudioLines size={14} />
                    <span>{t.audioVisualizer}</span>
                  </span>
                </button>

                {/* Pitch Distribution Chart Button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPitchChart();
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#FAF6EC] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#072920] dark:text-[#FAF6EC] hover:bg-[#F4EDE0] dark:hover:bg-[#0D3A2E] hover:border-[#B49049]/60 dark:hover:border-[#C6A259]/45 transition-colors text-xs font-medium active:scale-[0.99]"
                >
                  <BarChart3 size={14} className="text-[#9C7A3C] dark:text-[#DFC589]" />
                  <span>{t.pitchDistribution}</span>
                </button>

                {/* View Mode Toggle */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F4EDE0] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/20">
                  <button
                    type="button"
                    onClick={() => {
                      onViewModeChange('carousel');
                      onClose();
                    }}
                    className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      viewMode === 'carousel'
                        ? 'bg-[#FAF6EC] dark:bg-[#145240] text-[#072920] dark:text-[#EAD7A4] shadow-sm'
                        : 'text-[#5B7469] dark:text-[#8DA399]'
                    }`}
                  >
                    <GalleryHorizontalEnd size={13} />
                    <span className="truncate">{t.carouselShort}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onViewModeChange('grid');
                      onClose();
                    }}
                    className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      viewMode === 'grid'
                        ? 'bg-[#FAF6EC] dark:bg-[#145240] text-[#072920] dark:text-[#EAD7A4] shadow-sm'
                        : 'text-[#5B7469] dark:text-[#8DA399]'
                    }`}
                  >
                    <LayoutGrid size={13} />
                    <span className="truncate">{t.gridShort}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onViewModeChange('compare');
                      onClose();
                    }}
                    className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      viewMode === 'compare'
                        ? 'bg-[#FAF6EC] dark:bg-[#145240] text-[#072920] dark:text-[#EAD7A4] shadow-sm'
                        : 'text-[#5B7469] dark:text-[#8DA399]'
                    }`}
                  >
                    <Columns2 size={13} />
                    <span className="truncate">{t.compareShort}</span>
                    {compareCount > 0 && (
                      <span className="text-[10px] font-bold opacity-75">({compareCount})</span>
                    )}
                  </button>
                </div>

                {/* Language & Theme Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="grid grid-cols-2 p-1 rounded-xl bg-[#F4EDE0] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/20"
                    role="group"
                    aria-label={t.switchLanguage}
                  >
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        language === 'en'
                          ? 'bg-[#FAF6EC] dark:bg-[#145240] text-[#072920] dark:text-[#EAD7A4] shadow-sm'
                          : 'text-[#5B7469] dark:text-[#8DA399]'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('mm')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        language === 'mm'
                          ? 'bg-[#FAF6EC] dark:bg-[#145240] text-[#072920] dark:text-[#EAD7A4] shadow-sm'
                          : 'text-[#5B7469] dark:text-[#8DA399]'
                      }`}
                    >
                      MM
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#F4EDE0] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/20 text-[#7D602D] dark:text-[#DFC589] text-xs font-medium"
                  >
                    {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                    <span>{isDarkMode ? t.lightMode : t.darkMode}</span>
                  </button>
                </div>
              </div>

              {/* Cloud Sync Account Section */}
              <div className="space-y-2.5 pt-3 border-t border-[#D9CEB8]/80 dark:border-[#C6A259]/20">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5B7469] dark:text-[#C6A259]">
                  {t.cloudAccountSection}
                </p>

                {user ? (
                  <div className="p-3 rounded-2xl bg-[#FAF6EC] dark:bg-[#092E24]/90 border border-[#D9CEB8] dark:border-[#C6A259]/25 space-y-2.5">
                    <div className="flex items-center gap-2.5">
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
                        <p className="text-[11px] text-[#236D56] dark:text-[#5FA88E] inline-flex items-center gap-1">
                          {cloudSynced ? <Check size={11} /> : <Loader2 size={11} className="animate-spin" />}
                          <span>{cloudSynced ? t.cloudSynced : t.syncingCloud}</span>
                        </p>
                      </div>
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
                            : 'bg-[#F4EDE0]/80 dark:bg-[#06231B]/80 border-[#D9CEB8] dark:border-[#C6A259]/20 text-[#2F4D42] dark:text-[#C6A259]'
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
                      disabled={authBusy}
                      onClick={() => void signOut()}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#EBE2CE]/70 dark:bg-[#06231B] hover:bg-rose-50 dark:hover:bg-[#2A1014]/60 text-[#2F4D42] dark:text-[#9EB5AC] hover:text-rose-700 dark:hover:text-rose-300 text-xs font-medium transition-colors"
                    >
                      <LogOut size={13} />
                      <span>{t.signOut}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={authBusy}
                      onClick={() => void signInWithGoogle()}
                      className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#0D3A2E] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] hover:bg-[#145240] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] transition-all text-xs font-semibold shadow-sm disabled:opacity-60"
                    >
                      {authBusy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                      )}
                      <span>{authBusy ? t.signingIn : t.continueWithGoogle}</span>
                    </button>
                    <p className="text-[11px] text-[#5B7469] dark:text-[#8DA399] leading-snug px-1">
                      {t.cloudSyncHint}
                    </p>
                  </div>
                )}

                {authError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-[#2A1014]/80 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
                    <span className="truncate">{authError}</span>
                    <button type="button" onClick={clearAuthError} aria-label={t.close}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileSidebar;
