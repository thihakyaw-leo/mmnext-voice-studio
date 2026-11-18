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
  Shuffle,
  GalleryHorizontalEnd,
  LayoutGrid,
  Sun,
  Moon,
  Columns2,
  AudioLines,
  BarChart3,
} from 'lucide-react';
import { FilterState } from '../types';
import { useI18n } from '../i18n';

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
  onRandomizeNames: () => void;
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
  onRandomizeNames,
  isVisualizerOpen,
  onToggleVisualizer,
  onOpenPitchChart,
}) => {
  const { language, setLanguage, t, translateGender, translatePitch } = useI18n();
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
            className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
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
            className="relative w-[84vw] max-w-[320px] h-full bg-[#FDF7EB]/95 dark:bg-zinc-900/95 backdrop-blur-2xl border-r border-zinc-300/70 dark:border-zinc-800 shadow-2xl flex flex-col outline-none"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-300/60 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-md shadow-zinc-900/10 shrink-0 ring-1 ring-zinc-300/60 dark:ring-0">
                  <img
                    src="/assets/aistudio/1Artboard_1_2x_180530e3.png"
                    alt={t.appTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2
                  id="mobile-sidebar-title"
                  className="text-base font-bold tracking-tight text-zinc-800 dark:text-white font-display truncate"
                >
                  {t.appTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors shrink-0"
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
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 dark:bg-indigo-600 hover:bg-zinc-700 dark:hover:bg-indigo-500 text-[#FDF7EB] dark:text-white rounded-2xl text-sm font-medium shadow-md transition-all active:scale-[0.98]"
              >
                <Sparkles size={16} className="text-zinc-300 dark:text-indigo-100" />
                <span>{t.aiCastingDirector}</span>
              </button>

              {/* Search & Filters Section */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {t.filtersSection}
                </p>

                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-500">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    value={filters.search}
                    onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                    className="block w-full pl-9 pr-8 py-2.5 bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300/60 dark:border-transparent focus:bg-white/90 dark:focus:bg-zinc-900 focus:border-zinc-400 dark:focus:border-indigo-700 rounded-xl text-sm text-zinc-800 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300/60 dark:focus:ring-indigo-900/30 transition-all"
                  />
                  {filters.search && (
                    <button
                      type="button"
                      onClick={() => onFilterChange({ ...filters, search: '' })}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
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
                      className="appearance-none w-full bg-white/80 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 py-2.5 pl-3 pr-7 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-300/60 dark:focus:ring-indigo-900"
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

                  <div className="relative">
                    <select
                      value={filters.pitch}
                      onChange={(e) => onFilterChange({ ...filters, pitch: e.target.value })}
                      aria-label={t.allPitches}
                      className="appearance-none w-full bg-white/80 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 py-2.5 pl-3 pr-7 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-zinc-300/60 dark:focus:ring-indigo-900"
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
                </div>

                {/* Pitch Hz Range Filter Slider */}
                <div className="bg-white/80 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 p-3.5 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-200">
                    <span>{t.pitchHzFilter}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">
                      70 - {filters.pitchHzRange[1]} Hz
                    </span>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="350"
                    step="5"
                    value={filters.pitchHzRange[1]}
                    onChange={(e) =>
                      onFilterChange({
                        ...filters,
                        pitchHzRange: [filters.pitchHzRange[0], Number(e.target.value)],
                      })
                    }
                    className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                    <span>70 Hz</span>
                    <span>210 Hz</span>
                    <span>350 Hz</span>
                  </div>
                </div>

                {/* Favorites Only Filter Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({ ...filters, favoritesOnly: !filters.favoritesOnly })
                  }
                  aria-pressed={!!filters.favoritesOnly}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                    filters.favoritesOnly
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300'
                      : 'bg-white/80 dark:bg-zinc-800 border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Heart size={14} className={filters.favoritesOnly ? 'fill-current' : ''} />
                    <span>{t.favoritesOnly}</span>
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      filters.favoritesOnly ? 'bg-rose-500' : 'bg-zinc-400 dark:bg-zinc-600'
                    }`}
                  />
                </button>
              </div>

              {/* Controls & Settings Section */}
              <div className="space-y-3 pt-2 border-t border-zinc-300/60 dark:border-zinc-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                  {t.preferencesSection}
                </p>

                {/* Open Favorites Drawer */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFavorites();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-rose-200 dark:hover:border-rose-800 transition-colors text-xs font-medium"
                >
                  <span className="inline-flex items-center gap-2">
                    <Heart
                      size={14}
                      className={favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : ''}
                    />
                    <span>{t.favorites}</span>
                  </span>
                  {favoritesCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
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
                      ? 'bg-zinc-800 dark:bg-indigo-600 border-zinc-800 dark:border-indigo-500 text-[#FDF7EB] dark:text-white'
                      : 'bg-white/80 dark:bg-zinc-800 border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <AudioLines size={14} />
                    <span>{t.audioVisualizer}</span>
                  </span>
                </button>

                {/* Randomize Burmese Character Names */}
                <button
                  type="button"
                  onClick={onRandomizeNames}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:text-indigo-400 hover:border-zinc-400 dark:hover:border-indigo-800 transition-colors text-xs font-medium active:scale-[0.99]"
                >
                  <Shuffle size={14} />
                  <span>{t.randomizeNames}</span>
                </button>

                {/* Pitch Distribution Chart Button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPitchChart();
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:text-indigo-400 hover:border-zinc-400 dark:hover:border-indigo-800 transition-colors text-xs font-medium active:scale-[0.99]"
                >
                  <BarChart3 size={14} />
                  <span>{t.pitchDistribution}</span>
                </button>

                {/* View Mode Toggle */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => {
                      onViewModeChange('carousel');
                      onClose();
                    }}
                    className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      viewMode === 'carousel'
                        ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400'
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
                        ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400'
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
                        ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400'
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
                    className="grid grid-cols-2 p-1 rounded-xl bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700"
                    role="group"
                    aria-label={t.switchLanguage}
                  >
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        language === 'en'
                          ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                          : 'text-zinc-500 dark:text-zinc-500'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('mm')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        language === 'mm'
                          ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                          : 'text-zinc-500 dark:text-zinc-500'
                      }`}
                    >
                      MM
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium"
                  >
                    {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                    <span>{isDarkMode ? t.lightMode : t.darkMode}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileSidebar;
