/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
} from 'lucide-react';
import { useI18n } from '../i18n';

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
}) => {
  const { language, setLanguage, t, translateGender, translatePitch } = useI18n();

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
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center justify-between h-full gap-4">
            {/* Left: Brand + AI Casting Button */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 group select-none">
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
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 dark:bg-indigo-600 hover:bg-zinc-700 dark:hover:bg-indigo-500 text-[#FDF7EB] dark:text-white rounded-full text-sm font-medium shadow-md transition-all hover:scale-105 active:scale-95 group shrink-0"
              >
                <Sparkles
                  size={14}
                  className="text-zinc-300 dark:text-indigo-100 group-hover:text-white transition-colors"
                />
                <span className="tracking-wide">{t.aiCastingDirector}</span>
              </button>
            </div>

            {/* Right: Search, Filters & Actions */}
            <div className="flex items-center gap-2 justify-end min-w-0 flex-1">
              {/* Search Input */}
              <div className="relative group w-full max-w-[180px] transition-all">
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

              {/* Desktop Filter Dropdowns + Favorites Filter */}
              <div className="flex gap-2 shrink-0 items-center">
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

                <div className="xl:flex hidden items-center gap-2 bg-white/85 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="whitespace-nowrap">{t.pitchHzFilter}:</span>
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
                    className="w-20 accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                    title={`Max Pitch Hz: ${filters.pitchHzRange[1]} Hz`}
                  />
                  <span className="font-mono text-[11px] min-w-[34px] text-right">
                    {filters.pitchHzRange[1]}Hz
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleFavoritesOnly}
                  aria-pressed={!!filters.favoritesOnly}
                  className={`inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                    filters.favoritesOnly
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300'
                      : 'bg-white/85 dark:bg-zinc-800 border-zinc-300/80 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Heart size={12} className={filters.favoritesOnly ? 'fill-current' : ''} />
                  <span className="hidden xl:inline">{t.favoritesOnly}</span>
                </button>
              </div>

              <div className="w-px h-5 bg-zinc-300/80 dark:bg-zinc-700 mx-0.5 shrink-0"></div>

              {/* Actions Group */}
              <div className="flex gap-2 shrink-0 items-center">
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
                  className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 transition-colors text-xs font-medium"
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
              </div>
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