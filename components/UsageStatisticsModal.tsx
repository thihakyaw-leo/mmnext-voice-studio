/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3';
import {
  X,
  Clock,
  Headphones,
  Award,
  Activity,
  Trash2,
  Play,
  Square,
  Info,
  Loader2,
  Compass,
  Download,
  Check,
} from 'lucide-react';
import { Voice } from '../types';
import { VoiceUsageRecord } from '../firebase';
import { useI18n } from '../i18n';

export interface LiveListeningDelta {
  voiceName: string;
  seconds: number;
}

interface UsageStatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: Voice[];
  usageRecords: VoiceUsageRecord[];
  usageLoaded: boolean;
  liveDelta: LiveListeningDelta | null;
  playingVoice: string | null;
  onPlayToggle: (voiceName: string) => void;
  onSelectVoice: (voiceName: string) => void;
  onClearUsage: () => Promise<void> | void;
  isDarkMode: boolean;
}

interface EnrichedVoiceStat {
  voiceName: string;
  displayName: string;
  subtitleName: string | null;
  gender: string;
  pitch: string;
  playCount: number;
  totalSeconds: number;
  lastPlayedAtMs: number;
  isLive: boolean;
}

interface HoverTooltipState {
  stat: EnrichedVoiceStat;
  x: number;
  y: number;
  sharePercent: number;
}

type ChartMetric = 'plays' | 'time';

export function formatAudioDuration(totalSeconds: number): string {
  const safe = Math.max(0, Number.isFinite(totalSeconds) ? totalSeconds : 0);
  if (safe < 60) {
    if (safe < 10 && safe > 0) {
      return `${safe.toFixed(1)}s`;
    }
    return `${Math.round(safe)}s`;
  }
  const roundedTotal = Math.round(safe);
  const hours = Math.floor(roundedTotal / 3600);
  const minutes = Math.floor((roundedTotal % 3600) / 60);
  const seconds = roundedTotal % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function escapeCsvCell(rawValue: string | number): string {
  const str = String(rawValue);
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(safe) || /^\s|\s$/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export const UsageStatisticsModal: React.FC<UsageStatisticsModalProps> = ({
  isOpen,
  onClose,
  voices,
  usageRecords,
  usageLoaded,
  liveDelta,
  playingVoice,
  onPlayToggle,
  onSelectVoice,
  onClearUsage,
  isDarkMode,
}) => {
  const { t, language, translateGender, translatePitch } = useI18n();
  const [metric, setMetric] = useState<ChartMetric>('plays');
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [exportedCsv, setExportedCsv] = useState(false);
  const [chartWidth, setChartWidth] = useState(560);
  const [tooltip, setTooltip] = useState<HoverTooltipState | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setConfirmClear(false);
      setExportedCsv(false);
      setTooltip(null);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const container = chartContainerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const next = Math.max(260, Math.floor(container.clientWidth));
      setChartWidth((prev) => (prev !== next ? next : prev));
    };
    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, [isOpen, usageRecords.length]);

  const voiceLookup = useMemo(() => {
    const map = new Map<string, Voice>();
    for (const v of voices) {
      map.set(v.name, v);
    }
    return map;
  }, [voices]);

  const enrichedStats = useMemo<EnrichedVoiceStat[]>(() => {
    const byName = new Map<string, EnrichedVoiceStat>();

    for (const rec of usageRecords) {
      const voice = voiceLookup.get(rec.voiceName);
      const customLabel =
        language === 'mm'
          ? voice?.characterName?.mm || voice?.characterName?.en
          : voice?.characterName?.en || voice?.characterName?.mm;
      const displayName = customLabel || rec.voiceName;
      byName.set(rec.voiceName, {
        voiceName: rec.voiceName,
        displayName,
        subtitleName: customLabel && customLabel !== rec.voiceName ? rec.voiceName : null,
        gender: voice?.analysis.gender || 'Voice',
        pitch: voice?.analysis.pitch || voice?.pitch || 'Middle',
        playCount: rec.playCount,
        totalSeconds: rec.totalSeconds,
        lastPlayedAtMs: rec.lastPlayedAtMs,
        isLive: false,
      });
    }

    if (liveDelta && liveDelta.seconds > 0) {
      const existing = byName.get(liveDelta.voiceName);
      if (existing) {
        existing.totalSeconds = Math.round((existing.totalSeconds + liveDelta.seconds) * 100) / 100;
        existing.isLive = true;
      } else {
        const voice = voiceLookup.get(liveDelta.voiceName);
        const customLabel =
          language === 'mm'
            ? voice?.characterName?.mm || voice?.characterName?.en
            : voice?.characterName?.en || voice?.characterName?.mm;
        byName.set(liveDelta.voiceName, {
          voiceName: liveDelta.voiceName,
          displayName: customLabel || liveDelta.voiceName,
          subtitleName: customLabel && customLabel !== liveDelta.voiceName ? liveDelta.voiceName : null,
          gender: voice?.analysis.gender || 'Voice',
          pitch: voice?.analysis.pitch || voice?.pitch || 'Middle',
          playCount: 1,
          totalSeconds: Math.round(liveDelta.seconds * 100) / 100,
          lastPlayedAtMs: Date.now(),
          isLive: true,
        });
      }
    }

    const list = Array.from(byName.values());
    list.sort((a, b) => {
      if (metric === 'time') {
        return b.totalSeconds - a.totalSeconds || b.playCount - a.playCount;
      }
      return b.playCount - a.playCount || b.totalSeconds - a.totalSeconds;
    });
    return list;
  }, [usageRecords, voiceLookup, language, liveDelta, metric]);

  const summary = useMemo(() => {
    let totalPlays = 0;
    let totalSeconds = 0;
    for (const item of enrichedStats) {
      totalPlays += item.playCount;
      totalSeconds += item.totalSeconds;
    }
    const topByPlays = [...enrichedStats].sort(
      (a, b) => b.playCount - a.playCount || b.totalSeconds - a.totalSeconds
    )[0] || null;

    const avgSecondsPerPlay = totalPlays > 0 ? totalSeconds / totalPlays : 0;
    const topPlayShare =
      topByPlays && totalPlays > 0 ? ((topByPlays.playCount / totalPlays) * 100).toFixed(0) : '0';

    return {
      totalPlays,
      totalSeconds,
      avgSecondsPerPlay,
      voicesExplored: enrichedStats.length,
      topVoice: topByPlays,
      topPlayShare,
    };
  }, [enrichedStats]);

  const chartData = useMemo(() => enrichedStats.slice(0, 10), [enrichedStats]);

  // Render interactive D3 horizontal bar chart
  useEffect(() => {
    if (!isOpen || !svgRef.current || chartData.length === 0) return;

    const svgEl = svgRef.current;
    const isNarrow = chartWidth < 460;
    const margin = {
      top: 12,
      right: isNarrow ? 76 : 98,
      bottom: 28,
      left: isNarrow ? 94 : 126,
    };
    const rowHeight = 36;
    const innerHeight = Math.max(120, chartData.length * rowHeight);
    const totalHeight = margin.top + innerHeight + margin.bottom;
    const innerWidth = Math.max(120, chartWidth - margin.left - margin.right);

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg
      .attr('width', chartWidth)
      .attr('height', totalHeight)
      .attr('viewBox', `0 0 ${chartWidth} ${totalHeight}`);

    const defs = svg.append('defs');

    const goldGrad = defs
      .append('linearGradient')
      .attr('id', 'usage-bar-top-gold')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    goldGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', isDarkMode ? '#B49049' : '#9C7A3C');
    goldGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isDarkMode ? '#EAD7A4' : '#C6A259');

    const emeraldGrad = defs
      .append('linearGradient')
      .attr('id', 'usage-bar-emerald')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    emeraldGrad
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', isDarkMode ? '#145240' : '#0D3A2E');
    emeraldGrad
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isDarkMode ? '#3CA17E' : '#236D56');

    const root = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const getVal = (d: EnrichedVoiceStat) =>
      metric === 'time' ? d.totalSeconds : d.playCount;

    const maxVal = d3.max(chartData, getVal) || 1;

    const xScale = d3
      .scaleLinear()
      .domain([0, maxVal * 1.08])
      .nice()
      .range([0, innerWidth]);

    const yScale = d3
      .scaleBand<string>()
      .domain(chartData.map((d) => d.voiceName))
      .range([0, innerHeight])
      .padding(0.28);

    // Subtle vertical grid lines
    const gridGroup = root
      .append('g')
      .attr('class', 'd3-grid')
      .call(
        d3
          .axisBottom(xScale)
          .ticks(isNarrow ? 3 : 5)
          .tickSize(innerHeight)
          .tickFormat(() => '')
      );
    gridGroup.select('.domain').remove();
    gridGroup
      .selectAll('line')
      .attr('stroke', isDarkMode ? 'rgba(198, 162, 89, 0.14)' : 'rgba(125, 96, 45, 0.14)')
      .attr('stroke-dasharray', '3,3');

    // Bottom X axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(isNarrow ? 3 : 5)
      .tickFormat((v) => {
        const num = Number(v);
        if (metric === 'time') {
          return formatAudioDuration(num);
        }
        return Number.isInteger(num) ? String(num) : '';
      });

    const xAxisGroup = root
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup
      .select('.domain')
      .attr('stroke', isDarkMode ? 'rgba(198, 162, 89, 0.25)' : '#D9CEB8');
    xAxisGroup
      .selectAll('line')
      .attr('stroke', isDarkMode ? 'rgba(198, 162, 89, 0.25)' : '#D9CEB8');
    xAxisGroup
      .selectAll('text')
      .attr('fill', isDarkMode ? '#9EB5AC' : '#5B7469')
      .style('font-size', '10px')
      .style('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
      .style('font-variant-numeric', 'tabular-nums');

    // Left Y axis labels
    const yAxis = d3
      .axisLeft(yScale)
      .tickSize(0)
      .tickPadding(10)
      .tickFormat((voiceName) => {
        const item = chartData.find((c) => c.voiceName === voiceName);
        const label = item?.displayName || voiceName;
        const maxChars = isNarrow ? 11 : 15;
        return label.length > maxChars ? `${label.slice(0, maxChars - 1)}…` : label;
      });

    const yAxisGroup = root.append('g').call(yAxis);
    yAxisGroup.select('.domain').remove();
    yAxisGroup
      .selectAll('text')
      .attr('fill', (d) => {
        const idx = chartData.findIndex((c) => c.voiceName === d);
        if (idx === 0) return isDarkMode ? '#DFC589' : '#7D602D';
        return isDarkMode ? '#FAF6EC' : '#06231B';
      })
      .style('font-size', isNarrow ? '11px' : '12px')
      .style('font-weight', (d) =>
        chartData.findIndex((c) => c.voiceName === d) === 0 ? '700' : '500'
      )
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        if (typeof d === 'string') {
          onSelectVoice(d);
          onClose();
        }
      });

    // Track background rails
    root
      .selectAll('.usage-bar-track')
      .data(chartData, (d: any) => d.voiceName)
      .enter()
      .append('rect')
      .attr('class', 'usage-bar-track')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.voiceName) ?? 0)
      .attr('width', innerWidth)
      .attr('height', yScale.bandwidth())
      .attr('rx', 6)
      .attr('fill', isDarkMode ? 'rgba(9, 46, 36, 0.55)' : 'rgba(235, 226, 206, 0.55)');

    // Data bars
    const bars = root
      .selectAll<SVGRectElement, EnrichedVoiceStat>('.usage-bar-fill')
      .data(chartData, (d) => d.voiceName)
      .enter()
      .append('rect')
      .attr('class', 'usage-bar-fill')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.voiceName) ?? 0)
      .attr('height', yScale.bandwidth())
      .attr('rx', 6)
      .attr('width', 0)
      .attr('fill', (_d, i) =>
        i === 0 ? 'url(#usage-bar-top-gold)' : 'url(#usage-bar-emerald)'
      )
      .style('cursor', 'pointer')
      .style('opacity', 0.94);

    bars
      .transition()
      .duration(440)
      .ease(d3.easeCubicOut)
      .attr('width', (d) => {
        const val = getVal(d);
        if (val <= 0) return 0;
        return Math.max(4, xScale(val));
      });

    // Inline right-hand value labels
    const labels = root
      .selectAll<SVGTextElement, EnrichedVoiceStat>('.usage-bar-value')
      .data(chartData, (d) => d.voiceName)
      .enter()
      .append('text')
      .attr('class', 'usage-bar-value')
      .attr('x', 8)
      .attr('y', (d) => (yScale(d.voiceName) ?? 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', (_d, i) =>
        i === 0
          ? isDarkMode
            ? '#EAD7A4'
            : '#7D602D'
          : isDarkMode
          ? '#9EB5AC'
          : '#3D5F53'
      )
      .style('font-size', isNarrow ? '10px' : '11px')
      .style('font-weight', '600')
      .style('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
      .style('font-variant-numeric', 'tabular-nums')
      .style('opacity', 0)
      .text((d) =>
        metric === 'time'
          ? `${formatAudioDuration(d.totalSeconds)}`
          : `${d.playCount} · ${formatAudioDuration(d.totalSeconds)}`
      );

    labels
      .transition()
      .duration(440)
      .ease(d3.easeCubicOut)
      .attr('x', (d) => {
        const val = getVal(d);
        const w = val <= 0 ? 0 : Math.max(4, xScale(val));
        return Math.min(w + 8, innerWidth + 6);
      })
      .style('opacity', 1);

    // Interactive hover & click layer over full rows
    const denom = metric === 'time' ? summary.totalSeconds : summary.totalPlays;

    root
      .selectAll<SVGRectElement, EnrichedVoiceStat>('.usage-bar-hitbox')
      .data(chartData, (d) => d.voiceName)
      .enter()
      .append('rect')
      .attr('class', 'usage-bar-hitbox')
      .attr('x', 0)
      .attr('y', (d) => (yScale(d.voiceName) ?? 0) - 3)
      .attr('width', innerWidth + margin.right - 4)
      .attr('height', yScale.bandwidth() + 6)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        const containerRect = chartContainerRef.current?.getBoundingClientRect();
        const x = containerRect ? event.clientX - containerRect.left : chartWidth / 2;
        const y = containerRect ? event.clientY - containerRect.top : 40;
        const val = getVal(d);
        const sharePercent = denom > 0 ? Math.round((val / denom) * 1000) / 10 : 0;

        bars.style('opacity', (b) => (b.voiceName === d.voiceName ? 1 : 0.48));
        setTooltip({ stat: d, x, y, sharePercent });
      })
      .on('mousemove', function (event, d) {
        const containerRect = chartContainerRef.current?.getBoundingClientRect();
        if (!containerRect) return;
        const val = getVal(d);
        const sharePercent = denom > 0 ? Math.round((val / denom) * 1000) / 10 : 0;
        setTooltip({
          stat: d,
          x: event.clientX - containerRect.left,
          y: event.clientY - containerRect.top,
          sharePercent,
        });
      })
      .on('mouseleave', () => {
        bars.style('opacity', 0.94);
        setTooltip(null);
      })
      .on('click', (_event, d) => {
        onSelectVoice(d.voiceName);
        onClose();
      });
  }, [
    isOpen,
    chartData,
    chartWidth,
    metric,
    isDarkMode,
    summary.totalPlays,
    summary.totalSeconds,
    onSelectVoice,
    onClose,
  ]);

  const handleConfirmClear = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      await onClearUsage();
      setConfirmClear(false);
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportCsv = () => {
    if (enrichedStats.length === 0) return;

    const exportedAt = new Date().toISOString();
    const dateStamp = exportedAt.slice(0, 10);

    const headers = [
      'Rank',
      'Voice ID',
      'Display Name',
      'Gender',
      'Pitch',
      'Play Count',
      'Total Audio Time (Seconds)',
      'Formatted Audio Time',
      'Play Share (%)',
      'Time Share (%)',
      'Last Played (ISO)',
    ];

    const rows = enrichedStats.map((item, idx) => {
      const playShare =
        summary.totalPlays > 0 ? ((item.playCount / summary.totalPlays) * 100).toFixed(1) : '0.0';
      const timeShare =
        summary.totalSeconds > 0
          ? ((item.totalSeconds / summary.totalSeconds) * 100).toFixed(1)
          : '0.0';
      const lastPlayedIso =
        item.lastPlayedAtMs > 0 ? new Date(item.lastPlayedAtMs).toISOString() : '';

      return [
        idx + 1,
        item.voiceName,
        item.displayName,
        item.gender,
        item.pitch,
        item.playCount,
        item.totalSeconds.toFixed(2),
        formatAudioDuration(item.totalSeconds),
        playShare,
        timeShare,
        lastPlayedIso,
      ]
        .map(escapeCsvCell)
        .join(',');
    });

    const totalRow = [
      'TOTAL',
      'All Voices',
      `${summary.voicesExplored} voices`,
      '-',
      '-',
      summary.totalPlays,
      summary.totalSeconds.toFixed(2),
      formatAudioDuration(summary.totalSeconds),
      summary.totalPlays > 0 ? '100.0' : '0.0',
      summary.totalSeconds > 0 ? '100.0' : '0.0',
      exportedAt,
    ]
      .map(escapeCsvCell)
      .join(',');

    const csvContent = '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows, totalRow].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mmnext-usage-statistics-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportedCsv(true);
    window.setTimeout(() => {
      setExportedCsv(false);
    }, 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="usage-stats-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#020E0B]/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 18 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative w-full max-w-3xl max-h-[90vh] bg-[#FAF6EC] dark:bg-[#06231B] border border-[#D9CEB8] dark:border-[#C6A259]/28 luminous-hairline rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
          >
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/20 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#EBE2CE] dark:bg-[#114637] border border-[#B49049]/40 dark:border-[#C6A259]/30 flex items-center justify-center text-[#7D602D] dark:text-[#DFC589] shrink-0">
                  <Activity size={18} />
                </div>
                <div className="min-w-0">
                  <h3
                    id="usage-stats-title"
                    className="text-base sm:text-lg font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] tracking-tight truncate"
                  >
                    {t.usageStatsTitle}
                  </h3>
                  <p className="text-xs text-[#5B7469] dark:text-[#8DA399] truncate">
                    {t.usageStatsSubtitle}
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

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-6 py-5 space-y-5">
              {!usageLoaded ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#5B7469] dark:text-[#9EB5AC]">
                  <Loader2 size={24} className="animate-spin text-[#7D602D] dark:text-[#DFC589]" />
                  <p className="text-xs font-medium">{t.syncingCloud}</p>
                </div>
              ) : enrichedStats.length === 0 ? (
                <div className="py-12 px-4 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#F4EDE0] dark:bg-[#092E24] border border-[#B49049]/35 dark:border-[#C6A259]/30 flex items-center justify-center text-[#7D602D] dark:text-[#DFC589] mb-4">
                    <Headphones size={26} />
                  </div>
                  <h4 className="text-lg font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] mb-1.5">
                    {t.usageEmptyTitle}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#5B7469] dark:text-[#9EB5AC] max-w-md leading-relaxed mb-6">
                    {t.usageEmptyDesc}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] text-xs font-semibold shadow-md transition-all"
                  >
                    <Compass size={14} />
                    <span>{t.usageExploreVoicesBtn}</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* KPI Summary Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#F4EDE0]/90 dark:bg-[#092E24]/85 border border-[#D9CEB8] dark:border-[#C6A259]/22">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5B7469] dark:text-[#9EB5AC]">
                          {t.usageTotalAudioTime}
                        </span>
                        <Clock size={14} className="text-[#7D602D] dark:text-[#DFC589] shrink-0" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-[#06231B] dark:text-[#FAF6EC]">
                          {formatAudioDuration(summary.totalSeconds)}
                        </span>
                        {liveDelta && liveDelta.seconds > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#236D56] dark:text-[#5FA88E]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E8267] animate-pulse" />
                            {t.usageLiveSession}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5B7469] dark:text-[#8DA399] mt-1 tabular-nums">
                        {t.usageVoicesExplored(summary.voicesExplored)}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F4EDE0]/90 dark:bg-[#092E24]/85 border border-[#D9CEB8] dark:border-[#C6A259]/22">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5B7469] dark:text-[#9EB5AC]">
                          {t.usageTotalPlays}
                        </span>
                        <Headphones size={14} className="text-[#145240] dark:text-[#5FA88E] shrink-0" />
                      </div>
                      <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-[#06231B] dark:text-[#FAF6EC]">
                        {summary.totalPlays.toLocaleString()}
                      </div>
                      <p className="text-[11px] text-[#5B7469] dark:text-[#8DA399] mt-1 font-mono tabular-nums">
                        {t.usageAvgPerPlay(formatAudioDuration(summary.avgSecondsPerPlay))}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F4EDE0]/90 dark:bg-[#092E24]/85 border border-[#B49049]/40 dark:border-[#C6A259]/30">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7D602D] dark:text-[#DFC589]">
                          {t.usageTopVoice}
                        </span>
                        <Award size={14} className="text-[#B49049] dark:text-[#DFC589] shrink-0" />
                      </div>
                      <div className="text-lg sm:text-xl font-serif font-bold text-[#06231B] dark:text-[#FAF6EC] truncate">
                        {summary.topVoice ? summary.topVoice.displayName : '—'}
                      </div>
                      <p className="text-[11px] text-[#5B7469] dark:text-[#9EB5AC] mt-1 font-mono tabular-nums truncate">
                        {summary.topVoice
                          ? `${t.usagePlaysUnit(summary.topVoice.playCount)} · ${t.usageShareOfTotal(
                              summary.topPlayShare
                            )}`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* D3 Chart Container */}
                  <div className="p-4 rounded-2xl bg-[#F4EDE0]/65 dark:bg-[#041813]/75 border border-[#D9CEB8] dark:border-[#C6A259]/22">
                    <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
                      <div className="text-xs font-semibold text-[#06231B] dark:text-[#FAF6EC]">
                        {t.usageChartTopVoices(chartData.length, enrichedStats.length)}
                      </div>

                      <div
                        className="inline-flex p-0.5 rounded-lg bg-[#EBE2CE] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25"
                        role="group"
                        aria-label="Chart metric"
                      >
                        <button
                          type="button"
                          onClick={() => setMetric('plays')}
                          aria-pressed={metric === 'plays'}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            metric === 'plays'
                              ? 'bg-[#FAF6EC] dark:bg-[#145240] text-[#06231B] dark:text-[#EAD7A4] shadow-xs'
                              : 'text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC]'
                          }`}
                        >
                          {t.usageMetricPlays}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMetric('time')}
                          aria-pressed={metric === 'time'}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                            metric === 'time'
                              ? 'bg-[#FAF6EC] dark:bg-[#145240] text-[#06231B] dark:text-[#EAD7A4] shadow-xs'
                              : 'text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC]'
                          }`}
                        >
                          {t.usageMetricTime}
                        </button>
                      </div>
                    </div>

                    <div ref={chartContainerRef} className="relative w-full overflow-hidden">
                      <svg
                        ref={svgRef}
                        className="block w-full select-none"
                        role="img"
                        aria-label={t.usageStatsTitle}
                      />

                      {tooltip && (
                        <div
                          className="pointer-events-none absolute z-20 min-w-[180px] max-w-[240px] rounded-xl bg-[#FAF6EC]/98 dark:bg-[#06231B]/98 border border-[#B49049]/45 dark:border-[#C6A259]/45 px-3 py-2 shadow-xl backdrop-blur-md text-xs"
                          style={{
                            left: Math.min(Math.max(8, tooltip.x + 12), Math.max(8, chartWidth - 210)),
                            top: Math.max(4, tooltip.y - 64),
                          }}
                        >
                          <div className="font-semibold text-[#06231B] dark:text-[#FAF6EC] truncate">
                            {tooltip.stat.displayName}
                          </div>
                          {tooltip.stat.subtitleName && (
                            <div className="text-[10px] text-[#7D602D] dark:text-[#C6A259] font-mono">
                              {tooltip.stat.subtitleName}
                            </div>
                          )}
                          <div className="text-[11px] text-[#5B7469] dark:text-[#9EB5AC] mt-0.5">
                            {translateGender(tooltip.stat.gender)} · {translatePitch(tooltip.stat.pitch)}
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-[#D9CEB8]/70 dark:border-[#C6A259]/20 flex items-center justify-between gap-3 font-mono tabular-nums text-[11px]">
                            <span className="text-[#06231B] dark:text-[#EAD7A4] font-semibold">
                              {t.usagePlaysUnit(tooltip.stat.playCount)}
                            </span>
                            <span className="text-[#145240] dark:text-[#5FA88E] font-semibold">
                              {formatAudioDuration(tooltip.stat.totalSeconds)}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono tabular-nums text-[#7D602D] dark:text-[#DFC589] mt-0.5">
                            {t.usageShareOfTotal(String(tooltip.sharePercent))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detailed Voice Breakdown List */}
                  <div className="space-y-1.5">
                    {enrichedStats.map((item, idx) => {
                      const isPlayingItem = playingVoice === item.voiceName;
                      return (
                        <div
                          key={item.voiceName}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#F4EDE0]/60 dark:bg-[#092E24]/60 border border-[#D9CEB8]/80 dark:border-[#C6A259]/18 hover:border-[#B49049]/50 dark:hover:border-[#C6A259]/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-6 text-center font-mono tabular-nums text-xs font-bold shrink-0 ${
                                idx === 0
                                  ? 'text-[#7D602D] dark:text-[#DFC589]'
                                  : 'text-[#5B7469] dark:text-[#8DA399]'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectVoice(item.voiceName);
                                onClose();
                              }}
                              className="min-w-0 text-left group"
                            >
                              <div className="text-xs sm:text-sm font-semibold text-[#06231B] dark:text-[#FAF6EC] group-hover:text-[#7D602D] dark:group-hover:text-[#DFC589] transition-colors truncate">
                                {item.displayName}
                                {item.subtitleName && (
                                  <span className="ml-1.5 text-[11px] font-mono font-normal text-[#5B7469] dark:text-[#8DA399]">
                                    ({item.subtitleName})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#5B7469] dark:text-[#8DA399] truncate">
                                {translateGender(item.gender)} · {translatePitch(item.pitch)}
                              </div>
                            </button>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right font-mono tabular-nums">
                              <div className="text-xs font-semibold text-[#06231B] dark:text-[#FAF6EC]">
                                {t.usagePlaysUnit(item.playCount)}
                              </div>
                              <div className="text-[11px] text-[#145240] dark:text-[#DFC589]">
                                {formatAudioDuration(item.totalSeconds)}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onPlayToggle(item.voiceName)}
                              aria-label={isPlayingItem ? t.pauseSample : `${t.playSample}: ${item.displayName}`}
                              title={isPlayingItem ? t.pauseSample : t.playSample}
                              className={`p-2 rounded-lg border transition-all ${
                                isPlayingItem
                                  ? 'bg-[#0D3A2E] dark:bg-[#C6A259] border-[#B49049]/50 text-[#FAF6EC] dark:text-[#041813]'
                                  : 'bg-[#FAF6EC] dark:bg-[#041813]/85 border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#2B463B] dark:text-[#DFC589] hover:border-[#B49049]/60 dark:hover:border-[#DFC589]/50'
                              }`}
                            >
                              {isPlayingItem ? (
                                <Square size={12} className="fill-current" />
                              ) : (
                                <Play size={12} className="fill-current" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-[#D9CEB8]/80 dark:border-[#C6A259]/20 flex flex-wrap items-center justify-between gap-3 text-xs text-[#5B7469] dark:text-[#8DA399] shrink-0">
              <span className="flex items-center gap-1.5 min-w-0">
                <Info size={13} className="text-[#7D602D] dark:text-[#DFC589] shrink-0" />
                <span className="truncate">{t.usageChartClickHint}</span>
              </span>

              <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
                {enrichedStats.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4EDE0] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#06231B] dark:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] hover:border-[#B49049]/50 dark:hover:border-[#DFC589]/45 transition-colors font-medium"
                  >
                    {exportedCsv ? (
                      <Check size={12} className="text-[#2E8267] dark:text-[#DFC589]" />
                    ) : (
                      <Download size={12} className="text-[#7D602D] dark:text-[#DFC589]" />
                    )}
                    <span>{exportedCsv ? t.exportedNotice : t.usageExportCsv}</span>
                  </button>
                )}

                {usageRecords.length > 0 && (
                  confirmClear ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isClearing}
                        onClick={() => void handleConfirmClear()}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors disabled:opacity-50"
                      >
                        {t.usageConfirmClearStats}
                      </button>
                      <button
                        type="button"
                        disabled={isClearing}
                        onClick={() => setConfirmClear(false)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#EBE2CE] dark:bg-[#092E24] text-[#06231B] dark:text-[#FAF6EC] font-medium hover:brightness-95"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4EDE0] dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[#5B7469] dark:text-[#9EB5AC] hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 transition-colors font-medium"
                    >
                      <Trash2 size={12} />
                      <span>{t.usageClearStats}</span>
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 rounded-xl font-semibold transition-all"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UsageStatisticsModal;
