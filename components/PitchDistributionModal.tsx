/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BarChart3, Info } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Voice } from '../types';
import { useI18n } from '../i18n';

interface PitchDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  voices: Voice[];
  onSelectPitchFilter: (pitch: string) => void;
  isDarkMode: boolean;
}

export const PitchDistributionModal: React.FC<PitchDistributionModalProps> = ({
  isOpen,
  onClose,
  voices,
  onSelectPitchFilter,
  isDarkMode,
}) => {
  const { t, translatePitch } = useI18n();

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of voices) {
      const p = v.analysis.pitch || v.pitch || 'Middle';
      counts[p] = (counts[p] || 0) + 1;
    }

    // Sort order for pitch categories
    const order = ['Higher', 'Medium-High', 'Middle', 'Lower middle', 'Lower', 'Low', 'High'];
    const keys = Object.keys(counts).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    return keys.map((key) => ({
      pitch: key,
      translatedPitch: translatePitch(key),
      count: counts[key],
    }));
  }, [voices, translatePitch]);

  const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#4f46e5', '#312e81', '#4338ca', '#3730a3'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pitch-chart-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative w-full max-w-2xl bg-[#FDF7EB] dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-300/60 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h3
                    id="pitch-chart-title"
                    className="text-base font-bold text-zinc-800 dark:text-white tracking-tight"
                  >
                    {t.pitchChartTitle}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {voices.length} total voices analyzed across library
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
                aria-label={t.close}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chart Body */}
            <div className="py-6 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      const pitchKey = e.activePayload[0].payload.pitch;
                      onSelectPitchFilter(pitchKey);
                      onClose();
                    }
                  }}
                >
                  <XAxis
                    dataKey="translatedPitch"
                    tick={{ fill: isDarkMode ? '#a1a1aa' : '#52525b', fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fill: isDarkMode ? '#a1a1aa' : '#52525b', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                      borderColor: isDarkMode ? '#27272a' : '#e4e4e7',
                      borderRadius: '12px',
                      color: isDarkMode ? '#f4f4f5' : '#18181b',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: any) => [`${value} voices`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} cursor="pointer">
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        className="transition-opacity hover:opacity-80"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Footer Hint */}
            <div className="pt-4 border-t border-zinc-300/60 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Info size={13} className="text-indigo-500 shrink-0" />
                <span>Click any bar to filter library by that pitch category</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white rounded-xl font-medium hover:bg-zinc-700 dark:hover:bg-indigo-500 transition-colors"
              >
                {t.closeChart}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PitchDistributionModal;
