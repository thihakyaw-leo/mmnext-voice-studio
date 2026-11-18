/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, RotateCcw, X, Radio } from 'lucide-react';
import {
  classifyVocalRegister,
  detectPitchAutocorrelation,
  frequencyToNote,
} from '../utils/pitchDetection';
import AudioVisualizer, { VisualizerVariant } from './AudioVisualizer';
import { useI18n } from '../i18n';

interface PitchFrequencyPanelProps {
  isOpen: boolean;
  isPlaying: boolean;
  analyserNode: AnalyserNode | null;
  visualizerVariant: VisualizerVariant;
  voiceLabel: string;
  onClose: () => void;
}

interface PitchStats {
  currentHz: number | null;
  minHz: number | null;
  maxHz: number | null;
  avgHz: number | null;
  clarity: number;
  rms: number;
}

interface HoverBinInfo {
  xRatio: number;
  freqHz: number;
  noteLabel: string;
  db: number;
  percent: number;
}

const MIN_FREQ_HZ = 60;
const MAX_FREQ_HZ = 4000;
const CONTOUR_HISTORY_LEN = 96;

const PitchFrequencyPanel: React.FC<PitchFrequencyPanelProps> = ({
  isOpen,
  isPlaying,
  analyserNode,
  visualizerVariant,
  voiceLabel,
  onClose,
}) => {
  const { t } = useI18n();
  const [scaleMode, setScaleMode] = useState<'log' | 'linear'>('log');
  const [peakHold, setPeakHold] = useState<boolean>(true);
  const [hoverInfo, setHoverInfo] = useState<HoverBinInfo | null>(null);
  const [stats, setStats] = useState<PitchStats>({
    currentHz: null,
    minHz: null,
    maxHz: null,
    avgHz: null,
    clarity: 0,
    rms: 0,
  });

  const freqCanvasRef = useRef<HTMLCanvasElement>(null);
  const contourCanvasRef = useRef<HTMLCanvasElement>(null);
  const pitchHistoryRef = useRef<(number | null)[]>(new Array(CONTOUR_HISTORY_LEN).fill(null));
  const peakHoldBinsRef = useRef<Float32Array | null>(null);
  const statsAccumRef = useRef<{ min: number | null; max: number | null; sum: number; count: number }>({
    min: null,
    max: null,
    sum: 0,
    count: 0,
  });
  const hoverRatioRef = useRef<number | null>(null);
  const lastUiSyncRef = useRef<number>(0);

  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const handleResetStats = useCallback(() => {
    statsAccumRef.current = { min: null, max: null, sum: 0, count: 0 };
    pitchHistoryRef.current = new Array(CONTOUR_HISTORY_LEN).fill(null);
    if (peakHoldBinsRef.current) {
      peakHoldBinsRef.current.fill(0);
    }
    setStats({
      currentHz: null,
      minHz: null,
      maxHz: null,
      avgHz: null,
      clarity: 0,
      rms: 0,
    });
  }, []);

  // Reset peak-hold trace when toggled off
  useEffect(() => {
    if (!peakHold && peakHoldBinsRef.current) {
      peakHoldBinsRef.current.fill(0);
    }
  }, [peakHold]);

  const ratioToFrequency = useCallback(
    (ratio: number) => {
      const clamped = Math.max(0, Math.min(1, ratio));
      if (scaleMode === 'log') {
        return MIN_FREQ_HZ * Math.pow(MAX_FREQ_HZ / MIN_FREQ_HZ, clamped);
      }
      return MIN_FREQ_HZ + clamped * (MAX_FREQ_HZ - MIN_FREQ_HZ);
    },
    [scaleMode]
  );

  const frequencyToRatio = useCallback(
    (freq: number) => {
      const clamped = Math.max(MIN_FREQ_HZ, Math.min(MAX_FREQ_HZ, freq));
      if (scaleMode === 'log') {
        return Math.log(clamped / MIN_FREQ_HZ) / Math.log(MAX_FREQ_HZ / MIN_FREQ_HZ);
      }
      return (clamped - MIN_FREQ_HZ) / (MAX_FREQ_HZ - MIN_FREQ_HZ);
    },
    [scaleMode]
  );

  const handlePointerInspect = (clientX: number) => {
    const canvas = freqCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    hoverRatioRef.current = ratio;
  };

  const clearPointerInspect = () => {
    hoverRatioRef.current = null;
    setHoverInfo(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    const freqCanvas = freqCanvasRef.current;
    const contourCanvas = contourCanvasRef.current;
    if (!freqCanvas || !contourCanvas) return;

    const freqCtx = freqCanvas.getContext('2d');
    const contourCtx = contourCanvas.getContext('2d');
    if (!freqCtx || !contourCtx) return;

    let freqW = 0;
    let freqH = 0;
    let contourW = 0;
    let contourH = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const fr = freqCanvas.getBoundingClientRect();
      if (fr.width > 0 && fr.height > 0) {
        freqW = fr.width;
        freqH = fr.height;
        freqCanvas.width = Math.round(fr.width * dpr);
        freqCanvas.height = Math.round(fr.height * dpr);
        freqCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const cr = contourCanvas.getBoundingClientRect();
      if (cr.width > 0 && cr.height > 0) {
        contourW = cr.width;
        contourH = cr.height;
        contourCanvas.width = Math.round(cr.width * dpr);
        contourCanvas.height = Math.round(cr.height * dpr);
        contourCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(freqCanvas);
    ro?.observe(contourCanvas);

    const timeBuf = analyserNode ? new Float32Array(analyserNode.fftSize) : null;
    const freqBuf = analyserNode ? new Uint8Array(analyserNode.frequencyBinCount) : null;
    if (freqBuf && (!peakHoldBinsRef.current || peakHoldBinsRef.current.length !== freqBuf.length)) {
      peakHoldBinsRef.current = new Float32Array(freqBuf.length);
    }

    let rafId = 0;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const renderFrame = (now: number) => {
      let detectedHz: number | null = null;
      let rms = 0;
      let clarity = 0;

      if (analyserNode && timeBuf && freqBuf && isPlaying) {
        analyserNode.getFloatTimeDomainData(timeBuf);
        analyserNode.getByteFrequencyData(freqBuf);

        const sampleRate = analyserNode.context?.sampleRate || 48000;
        const result = detectPitchAutocorrelation(timeBuf, sampleRate);
        detectedHz = result.frequency;
        rms = result.rms;
        clarity = result.clarity;

        // Update peak-hold buffer
        if (peakHold && peakHoldBinsRef.current) {
          for (let i = 0; i < freqBuf.length; i++) {
            const v = freqBuf[i];
            if (v >= peakHoldBinsRef.current[i]) {
              peakHoldBinsRef.current[i] = v;
            } else {
              peakHoldBinsRef.current[i] = Math.max(0, peakHoldBinsRef.current[i] - 0.35);
            }
          }
        }
      } else if (freqBuf) {
        freqBuf.fill(0);
      }

      // Smoothly push pitch contour history (~25Hz cadence)
      if (isPlaying && now - lastUiSyncRef.current > 45) {
        lastUiSyncRef.current = now;
        const history = pitchHistoryRef.current;
        history.push(detectedHz);
        if (history.length > CONTOUR_HISTORY_LEN) {
          history.shift();
        }

        if (detectedHz !== null) {
          const acc = statsAccumRef.current;
          acc.min = acc.min === null ? detectedHz : Math.min(acc.min, detectedHz);
          acc.max = acc.max === null ? detectedHz : Math.max(acc.max, detectedHz);
          acc.sum += detectedHz;
          acc.count += 1;
        }

        setStats({
          currentHz: detectedHz,
          minHz: statsAccumRef.current.min,
          maxHz: statsAccumRef.current.max,
          avgHz:
            statsAccumRef.current.count > 0
              ? statsAccumRef.current.sum / statsAccumRef.current.count
              : null,
          clarity,
          rms,
        });

        // Update hover readout continuously while inspecting
        if (hoverRatioRef.current !== null && analyserNode && freqBuf) {
          const sampleRate = analyserNode.context?.sampleRate || 48000;
          const nyquist = sampleRate / 2;
          const inspectFreq = ratioToFrequency(hoverRatioRef.current);
          const binIdx = Math.min(
            freqBuf.length - 1,
            Math.max(0, Math.round((inspectFreq / nyquist) * freqBuf.length))
          );
          const rawVal = freqBuf[binIdx] || 0;
          const percent = Math.round((rawVal / 255) * 100);
          const db = rawVal > 0 ? Math.round(-72 + (rawVal / 255) * 72) : -72;
          setHoverInfo({
            xRatio: hoverRatioRef.current,
            freqHz: Math.round(inspectFreq),
            noteLabel: frequencyToNote(inspectFreq).label,
            db,
            percent,
          });
        }
      } else if (!isPlaying && now - lastUiSyncRef.current > 120) {
        lastUiSyncRef.current = now;
        setStats((prev) =>
          prev.currentHz !== null || prev.rms !== 0
            ? { ...prev, currentHz: null, rms: 0, clarity: 0 }
            : prev
        );
      }

      // 1) Draw Interactive Real-Time Frequency Graph
      if (freqW > 0 && freqH > 0) {
        freqCtx.clearRect(0, 0, freqW, freqH);
        const padBottom = 18;
        const plotH = Math.max(24, freqH - padBottom);
        const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(39,39,42,0.10)';
        const labelColor = isDark ? '#a1a1aa' : '#71717a';

        // Horizontal dB guide lines
        freqCtx.strokeStyle = gridColor;
        freqCtx.lineWidth = 1;
        for (const frac of [0.25, 0.5, 0.75]) {
          const y = Math.round(plotH * frac) + 0.5;
          freqCtx.beginPath();
          freqCtx.moveTo(0, y);
          freqCtx.lineTo(freqW, y);
          freqCtx.stroke();
        }

        // Frequency markers
        const markers = scaleMode === 'log' ? [100, 250, 500, 1000, 2000, 4000] : [500, 1000, 2000, 3000, 4000];
        freqCtx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
        freqCtx.fillStyle = labelColor;
        freqCtx.textAlign = 'center';

        for (const hz of markers) {
          const x = frequencyToRatio(hz) * freqW;
          freqCtx.strokeStyle = gridColor;
          freqCtx.beginPath();
          freqCtx.moveTo(x, 0);
          freqCtx.lineTo(x, plotH);
          freqCtx.stroke();

          const lbl = hz >= 1000 ? `${hz / 1000}k` : `${hz}`;
          const clampedX = Math.max(14, Math.min(freqW - 14, x));
          freqCtx.fillText(lbl, clampedX, freqH - 4);
        }

        // Spectrum Bars / Curve
        if (analyserNode && freqBuf) {
          const sampleRate = analyserNode.context?.sampleRate || 48000;
          const nyquist = sampleRate / 2;
          const colCount = Math.max(40, Math.min(96, Math.floor(freqW / 5)));
          const step = freqW / colCount;
          const barW = Math.max(2, step * 0.66);

          const grad = freqCtx.createLinearGradient(0, 0, 0, plotH);
          if (isDark) {
            grad.addColorStop(0, '#818cf8');
            grad.addColorStop(1, '#312e81');
          } else {
            grad.addColorStop(0, '#27272a');
            grad.addColorStop(1, '#a1a1aa');
          }

          freqCtx.fillStyle = grad;

          for (let i = 0; i < colCount; i++) {
            const r0 = i / colCount;
            const r1 = (i + 1) / colCount;
            const f0 = ratioToFrequency(r0);
            const f1 = ratioToFrequency(r1);
            const b0 = Math.max(0, Math.floor((f0 / nyquist) * freqBuf.length));
            const b1 = Math.min(
              freqBuf.length - 1,
              Math.max(b0, Math.ceil((f1 / nyquist) * freqBuf.length))
            );

            let maxMag = 0;
            for (let b = b0; b <= b1; b++) {
              if (freqBuf[b] > maxMag) maxMag = freqBuf[b];
            }
            const norm = maxMag / 255;
            const barH = Math.max(norm > 0.01 ? 2 : 0, norm * (plotH - 6));
            const x = i * step + (step - barW) / 2;
            if (barH > 0) {
              freqCtx.beginPath();
              freqCtx.roundRect(x, plotH - barH, barW, barH, Math.min(2, barW / 2));
              freqCtx.fill();
            }
          }

          // Peak Hold trace
          if (peakHold && peakHoldBinsRef.current) {
            freqCtx.beginPath();
            for (let i = 0; i < colCount; i++) {
              const r0 = i / colCount;
              const r1 = (i + 1) / colCount;
              const f0 = ratioToFrequency(r0);
              const f1 = ratioToFrequency(r1);
              const b0 = Math.max(0, Math.floor((f0 / nyquist) * freqBuf.length));
              const b1 = Math.min(
                freqBuf.length - 1,
                Math.max(b0, Math.ceil((f1 / nyquist) * freqBuf.length))
              );
              let maxPeak = 0;
              for (let b = b0; b <= b1; b++) {
                const pv = peakHoldBinsRef.current[b] || 0;
                if (pv > maxPeak) maxPeak = pv;
              }
              const x = (i + 0.5) * step;
              const y = plotH - (maxPeak / 255) * (plotH - 6);
              if (i === 0) freqCtx.moveTo(x, y);
              else freqCtx.lineTo(x, y);
            }
            freqCtx.strokeStyle = isDark ? 'rgba(165, 180, 252, 0.5)' : 'rgba(82, 82, 91, 0.45)';
            freqCtx.lineWidth = 1.25;
            freqCtx.stroke();
          }
        }

        // Detected Fundamental (F0) marker line
        if (detectedHz !== null) {
          const fx = frequencyToRatio(detectedHz) * freqW;
          freqCtx.save();
          freqCtx.strokeStyle = '#10b981';
          freqCtx.lineWidth = 1.75;
          freqCtx.setLineDash([4, 3]);
          freqCtx.beginPath();
          freqCtx.moveTo(fx, 0);
          freqCtx.lineTo(fx, plotH);
          freqCtx.stroke();
          freqCtx.restore();
        }

        // Pointer Hover Crosshair
        if (hoverRatioRef.current !== null) {
          const hx = hoverRatioRef.current * freqW;
          freqCtx.save();
          freqCtx.strokeStyle = isDark ? '#f4f4f5' : '#18181b';
          freqCtx.lineWidth = 1;
          freqCtx.beginPath();
          freqCtx.moveTo(hx, 0);
          freqCtx.lineTo(hx, plotH);
          freqCtx.stroke();
          freqCtx.restore();
        }
      }

      // 2) Draw Pitch Contour History Graph (65 Hz - 420 Hz)
      if (contourW > 0 && contourH > 0) {
        contourCtx.clearRect(0, 0, contourW, contourH);
        const minPitch = 65;
        const maxPitch = 420;
        const history = pitchHistoryRef.current;

        // Reference pitch bands (100, 200, 300 Hz)
        contourCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(39,39,42,0.08)';
        contourCtx.lineWidth = 1;
        for (const refHz of [100, 200, 300]) {
          const y = contourH - ((refHz - minPitch) / (maxPitch - minPitch)) * contourH;
          contourCtx.beginPath();
          contourCtx.moveTo(0, y);
          contourCtx.lineTo(contourW, y);
          contourCtx.stroke();
        }

        contourCtx.strokeStyle = isDark ? '#a5b4fc' : '#27272a';
        contourCtx.lineWidth = 2;
        contourCtx.lineCap = 'round';
        contourCtx.lineJoin = 'round';

        let drawingSegment = false;
        contourCtx.beginPath();
        for (let i = 0; i < history.length; i++) {
          const val = history[i];
          const x = (i / (history.length - 1)) * contourW;
          if (val === null) {
            if (drawingSegment) {
              contourCtx.stroke();
              contourCtx.beginPath();
              drawingSegment = false;
            }
            continue;
          }
          const clamped = Math.max(minPitch, Math.min(maxPitch, val));
          const y = contourH - ((clamped - minPitch) / (maxPitch - minPitch)) * (contourH - 8) - 4;
          if (!drawingSegment) {
            contourCtx.moveTo(x, y);
            drawingSegment = true;
          } else {
            contourCtx.lineTo(x, y);
          }
        }
        if (drawingSegment) {
          contourCtx.stroke();
        }
      }

      if (!prefersReducedMotion) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, [
    isOpen,
    isPlaying,
    analyserNode,
    scaleMode,
    peakHold,
    isDark,
    frequencyToRatio,
    ratioToFrequency,
  ]);

  const noteInfo = stats.currentHz ? frequencyToNote(stats.currentHz) : null;
  const register = stats.currentHz ? classifyVocalRegister(stats.currentHz) : null;
  const registerLabel =
    register === 'low'
      ? t.pitchRangeLow
      : register === 'mid'
      ? t.pitchRangeMid
      : register === 'high'
      ? t.pitchRangeHigh
      : '--';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.section
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          aria-label={t.pitchAnalyzerTitle}
          className="fixed bottom-14 sm:bottom-16 inset-x-0 z-[39] px-3 sm:px-6 lg:px-8 pb-2 pointer-events-none"
        >
          <div className="max-w-[1440px] mx-auto pointer-events-auto rounded-2xl bg-[#FDF7EB]/96 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-300/80 dark:border-zinc-800 shadow-2xl overflow-hidden">
            {/* Panel Header */}
            <div className="px-4 py-2.5 bg-[#F5EFE2]/90 dark:bg-zinc-950/60 border-b border-zinc-300/60 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Activity
                  size={15}
                  className={
                    isPlaying
                      ? 'text-emerald-600 dark:text-emerald-400 shrink-0'
                      : 'text-zinc-500 dark:text-zinc-400 shrink-0'
                  }
                />
                <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-white truncate">
                  {t.pitchAnalyzerTitle}
                </span>
                <span className="text-zinc-400 dark:text-zinc-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {voiceLabel}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Log / Linear Scale Toggle */}
                <div className="flex p-0.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-300/70 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setScaleMode('log')}
                    aria-pressed={scaleMode === 'log'}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      scaleMode === 'log'
                        ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {t.scaleLog}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScaleMode('linear')}
                    aria-pressed={scaleMode === 'linear'}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      scaleMode === 'linear'
                        ? 'bg-[#FDF7EB] dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {t.scaleLinear}
                  </button>
                </div>

                {/* Peak Hold Toggle */}
                <button
                  type="button"
                  onClick={() => setPeakHold((prev) => !prev)}
                  aria-pressed={peakHold}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                    peakHold
                      ? 'bg-zinc-800 dark:bg-indigo-600 border-zinc-800 dark:border-indigo-500 text-[#FDF7EB] dark:text-white'
                      : 'bg-white/80 dark:bg-zinc-800 border-zinc-300/80 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  <Radio size={11} />
                  <span>{t.peakHoldLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetStats}
                  title={t.resetStats}
                  aria-label={t.resetStats}
                  className="p-1.5 rounded-lg bg-white/80 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <RotateCcw size={12} />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.close}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Dual Analyzer Grid: Pitch Detection + Interactive Frequency Spectrum + Amplitude */}
            <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 max-h-[54vh] overflow-y-auto custom-scrollbar">
              {/* Left Column: Pitch Detection & Intonation Contour */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-[#F5EFE2]/90 dark:bg-zinc-950/70 border border-zinc-300/70 dark:border-zinc-800">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {t.detectedPitch}
                    </p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums text-zinc-800 dark:text-white">
                        {stats.currentHz ? `${stats.currentHz.toFixed(1)} Hz` : '-- Hz'}
                      </span>
                      {noteInfo && (
                        <span className="text-sm font-mono font-semibold text-zinc-600 dark:text-indigo-400">
                          {noteInfo.label}{' '}
                          <span className="text-xs opacity-75">
                            ({noteInfo.cents >= 0 ? `+${noteInfo.cents}` : noteInfo.cents}¢)
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {t.vocalRegister}
                    </p>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                      {registerLabel}
                    </p>
                  </div>
                </div>

                {/* Tuning Cents + Min/Avg/Max Row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="px-2.5 py-2 rounded-xl bg-white/85 dark:bg-zinc-800/70 border border-zinc-300/70 dark:border-zinc-800">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {t.minPitch}
                    </p>
                    <p className="text-xs sm:text-sm font-mono font-semibold tabular-nums text-zinc-800 dark:text-zinc-100 mt-0.5">
                      {stats.minHz ? `${Math.round(stats.minHz)} Hz` : '--'}
                    </p>
                  </div>
                  <div className="px-2.5 py-2 rounded-xl bg-white/85 dark:bg-zinc-800/70 border border-zinc-300/70 dark:border-zinc-800">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {t.avgPitch}
                    </p>
                    <p className="text-xs sm:text-sm font-mono font-semibold tabular-nums text-zinc-800 dark:text-zinc-100 mt-0.5">
                      {stats.avgHz ? `${Math.round(stats.avgHz)} Hz` : '--'}
                    </p>
                  </div>
                  <div className="px-2.5 py-2 rounded-xl bg-white/85 dark:bg-zinc-800/70 border border-zinc-300/70 dark:border-zinc-800">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {t.maxPitch}
                    </p>
                    <p className="text-xs sm:text-sm font-mono font-semibold tabular-nums text-zinc-800 dark:text-zinc-100 mt-0.5">
                      {stats.maxHz ? `${Math.round(stats.maxHz)} Hz` : '--'}
                    </p>
                  </div>
                </div>

                {/* Pitch Contour History */}
                <div className="rounded-xl bg-[#F5EFE2]/90 dark:bg-zinc-950/70 border border-zinc-300/70 dark:border-zinc-800 p-2.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">
                    <span className="font-bold uppercase tracking-wider">{t.pitchContour}</span>
                    <span className="font-mono tabular-nums">65 – 420 Hz</span>
                  </div>
                  <div className="h-16 w-full">
                    <canvas
                      ref={contourCanvasRef}
                      className="w-full h-full block"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Frequency Graph + Side-by-Side Amplitude Preview */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="rounded-xl bg-[#F5EFE2]/90 dark:bg-zinc-950/70 border border-zinc-300/70 dark:border-zinc-800 p-3 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {t.frequencySpectrum} ({MIN_FREQ_HZ} Hz – 4 kHz)
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                      {hoverInfo
                        ? `${hoverInfo.freqHz} Hz · ${hoverInfo.noteLabel} · ${hoverInfo.db} dB (${hoverInfo.percent}%)`
                        : t.hoverSpectrumHint}
                    </span>
                  </div>

                  <div
                    className="relative h-32 sm:h-36 w-full cursor-crosshair select-none touch-none"
                    onMouseMove={(e) => handlePointerInspect(e.clientX)}
                    onMouseLeave={clearPointerInspect}
                    onTouchStart={(e) => {
                      if (e.touches[0]) handlePointerInspect(e.touches[0].clientX);
                    }}
                    onTouchMove={(e) => {
                      if (e.touches[0]) handlePointerInspect(e.touches[0].clientX);
                    }}
                    onTouchEnd={clearPointerInspect}
                  >
                    <canvas
                      ref={freqCanvasRef}
                      className="w-full h-full block"
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                </div>

                {/* Live Amplitude Visualizer Alongside Spectrum */}
                <div className="rounded-xl bg-[#F5EFE2]/90 dark:bg-zinc-950/70 border border-zinc-300/70 dark:border-zinc-800 px-3 py-2 flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0">
                    {t.amplitudeLabel}
                  </span>
                  <div className="flex-1 h-9">
                    <AudioVisualizer
                      isPlaying={isPlaying}
                      variant={visualizerVariant}
                      analyserNode={analyserNode}
                      color={isDark ? '#a5b4fc' : '#27272a'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default PitchFrequencyPanel;
