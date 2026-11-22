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

  const COLORS = ['#145240', '#236D56', '#2E8267', '#9C7A3C', '#B49049', '#C6A259', '#DFC589'];

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
            className="absolute inset-0 bg-[#020E0B]/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative w-full max-w-2xl bg-[#FAF6EC] dark:bg-[#06231B] border border-[#D9CEB8] dark:border-[#C6A259]/28 luminous-hairline rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#D9CEB8]/80 dark:border-[#C6A259]/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EBE2CE] dark:bg-[#114637] border border-[#B49049]/40 dark:border-[#C6A259]/30 flex items-center justify-center text-[#7D602D] dark:text-[#DFC589]">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h3
                    id="pitch-chart-title"
                    className="text-base font-serif font-semibold text-[#06231B] dark:text-[#FAF6EC] tracking-tight"
                  >
                    {t.pitchChartTitle}
                  </h3>
                  <p className="text-xs text-[#5B7469] dark:text-[#8DA399]">
                    {voices.length} total voices analyzed across library
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-[#5B7469] dark:text-[#8DA399] hover:text-[#06231B] dark:hover:text-[#FAF6EC] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors"
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
                    tick={{ fill: isDarkMode ? '#9EB5AC' : '#5B7469', fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fill: isDarkMode ? '#9EB5AC' : '#5B7469', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#041813' : '#FAF6EC',
                      borderColor: isDarkMode ? 'rgba(198, 162, 89, 0.35)' : '#D9CEB8',
                      borderRadius: '12px',
                      color: isDarkMode ? '#FAF6EC' : '#06231B',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(2, 14, 11, 0.25)',
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
            <div className="pt-4 border-t border-[#D9CEB8]/80 dark:border-[#C6A259]/20 flex items-center justify-between text-xs text-[#5B7469] dark:text-[#8DA399]">
              <span className="flex items-center gap-1.5">
                <Info size={13} className="text-[#7D602D] dark:text-[#DFC589] shrink-0" />
                <span>Click any bar to filter library by that pitch category</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 rounded-xl font-medium transition-all"
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
