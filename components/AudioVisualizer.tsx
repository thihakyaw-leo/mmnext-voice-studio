/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

export type VisualizerVariant = 'wave' | 'bars' | 'mirror';

interface AudioVisualizerProps {
  isPlaying: boolean;
  color?: string;
  variant?: VisualizerVariant;
  analyserNode?: AnalyserNode | null;
}

const STUDIO_ACCENT_COLORS_DARK = [
  '#DFC589', // Champagne Gold
  '#C6A259', // Antique Gold
  '#3D9476', // Controlled Jade
  '#EAD7A4', // Luminous Champagne
];

const STUDIO_ACCENT_COLORS_LIGHT = [
  '#114637', // Forest Green
  '#236D56', // Controlled Jade
  '#9C7A3C', // Antique Gold
  '#195E4A', // Rich Emerald
];

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 223, g: 197, b: 137 };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b))
      .toString(16)
      .slice(1)
  );
}

function interpolateColor(color1: string, color2: string, factor: number) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  return rgbToHex(
    rgb1.r + (rgb2.r - rgb1.r) * factor,
    rgb1.g + (rgb2.g - rgb1.g) * factor,
    rgb1.b + (rgb2.b - rgb1.b) * factor
  );
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  color = '#DFC589',
  variant = 'wave',
  analyserNode = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const phaseRef = useRef<number>(0);
  const peaksRef = useRef<number[]>([]);
  const smoothedBarsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = window.devicePixelRatio || 1;
      if (width > 0 && height > 0) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    resizeCanvas();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => resizeCanvas())
        : null;
    resizeObserver?.observe(canvas);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const freqData = analyserNode ? new Uint8Array(analyserNode.frequencyBinCount) : null;
    const timeData = analyserNode ? new Uint8Array(analyserNode.fftSize) : null;

    const getSampleBars = (barCount: number, phase: number): number[] => {
      if (analyserNode && freqData) {
        analyserNode.getByteFrequencyData(freqData);
        let energySum = 0;
        for (let i = 0; i < freqData.length; i++) energySum += freqData[i];
        if (energySum > 0) {
          const bars: number[] = [];
          const usableBins = Math.max(barCount, Math.floor(freqData.length * 0.72));
          for (let i = 0; i < barCount; i++) {
            const binStart = Math.floor((i / barCount) * usableBins);
            const binEnd = Math.max(binStart + 1, Math.floor(((i + 1) / barCount) * usableBins));
            let sum = 0;
            for (let b = binStart; b < binEnd; b++) sum += freqData[b] || 0;
            bars.push(Math.min(1, sum / ((binEnd - binStart) * 255)));
          }
          return bars;
        }
      }

      // Speech-cadence harmonic synthesis fallback
      const speechSyllableGate =
        0.58 + 0.42 * Math.abs(Math.sin(phase * 0.38) * Math.cos(phase * 0.17));
      const bars: number[] = [];
      for (let i = 0; i < barCount; i++) {
        const norm = i / Math.max(1, barCount - 1);
        const centerFocus = Math.sin(norm * Math.PI);
        const harmonic =
          0.45 * Math.abs(Math.sin(phase * 1.15 + i * 0.45)) +
          0.35 * Math.abs(Math.cos(phase * 0.8 - i * 0.72)) +
          0.2 * Math.abs(Math.sin(phase * 1.9 + i * 1.1));
        const val = Math.min(1, Math.max(0.08, harmonic * speechSyllableGate * (0.45 + 0.55 * centerFocus)));
        bars.push(val);
      }
      return bars;
    };

    const drawIdle = () => {
      const centerY = height / 2;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      if (variant === 'bars') {
        const barCount = Math.max(16, Math.min(40, Math.floor(width / 9)));
        const step = width / barCount;
        const barW = Math.max(2, Math.min(5, step * 0.48));
        ctx.globalAlpha = 0.22;
        for (let i = 0; i < barCount; i++) {
          const x = i * step + (step - barW) / 2;
          const h = 3 + 3 * Math.sin((i / Math.max(1, barCount - 1)) * Math.PI);
          ctx.beginPath();
          ctx.roundRect(x, height - h - 4, barW, h, barW / 2);
          ctx.fill();
        }
      } else if (variant === 'mirror') {
        const barCount = Math.max(18, Math.min(44, Math.floor(width / 8)));
        const step = width / barCount;
        const barW = Math.max(2, Math.min(4, step * 0.45));
        ctx.globalAlpha = 0.22;
        for (let i = 0; i < barCount; i++) {
          const x = i * step + (step - barW) / 2;
          const h = 3;
          ctx.beginPath();
          ctx.roundRect(x, centerY - h / 2, barW, h, barW / 2);
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.globalAlpha = 0.24;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    };

    const draw = () => {
      if (!ctx || !canvas) return;
      if (width <= 0 || height <= 0) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const centerY = height / 2;
      ctx.clearRect(0, 0, width, height);

      if (!isPlaying) {
        drawIdle();
        return;
      }

      if (!prefersReducedMotion) {
        phaseRef.current += 0.14;
      }

      const isDark =
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      const palette = isDark ? STUDIO_ACCENT_COLORS_DARK : STUDIO_ACCENT_COLORS_LIGHT;

      const colorPhase = phaseRef.current * 0.04;
      const colorIndex = Math.floor(colorPhase) % palette.length;
      const nextColorIndex = (colorIndex + 1) % palette.length;
      const colorFactor = colorPhase % 1;

      const currentColor = prefersReducedMotion
        ? color
        : interpolateColor(palette[colorIndex], palette[nextColorIndex], colorFactor);

      if (variant === 'bars') {
        const barCount = Math.max(16, Math.min(48, Math.floor(width / 8)));
        const step = width / barCount;
        const barW = Math.max(2, Math.min(6, step * 0.52));
        const maxBarHeight = Math.max(10, height - 10);
        const samples = getSampleBars(barCount, phaseRef.current);

        if (smoothedBarsRef.current.length !== barCount) {
          smoothedBarsRef.current = new Array(barCount).fill(0);
          peaksRef.current = new Array(barCount).fill(0);
        }

        for (let i = 0; i < barCount; i++) {
          const target = samples[i];
          const prev = smoothedBarsRef.current[i] ?? 0;
          const smoothed = prev + (target - prev) * 0.35;
          smoothedBarsRef.current[i] = smoothed;

          if (smoothed >= (peaksRef.current[i] ?? 0)) {
            peaksRef.current[i] = smoothed;
          } else {
            peaksRef.current[i] = Math.max(0, peaksRef.current[i] - 0.015);
          }

          const barH = Math.max(3, smoothed * maxBarHeight);
          const x = i * step + (step - barW) / 2;
          const y = height - barH - 3;

          ctx.save();
          ctx.fillStyle = currentColor;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.roundRect(x, y, barW, barH, barW / 2);
          ctx.fill();

          const peakY = Math.max(2, height - peaksRef.current[i] * maxBarHeight - 6);
          ctx.globalAlpha = 0.45;
          ctx.beginPath();
          ctx.roundRect(x, peakY, barW, 2, 1);
          ctx.fill();
          ctx.restore();
        }
      } else if (variant === 'mirror') {
        const barCount = Math.max(18, Math.min(52, Math.floor(width / 7)));
        const step = width / barCount;
        const barW = Math.max(2, Math.min(5, step * 0.48));
        const maxHalfHeight = Math.max(6, centerY - 5);
        const samples = getSampleBars(barCount, phaseRef.current);

        if (smoothedBarsRef.current.length !== barCount) {
          smoothedBarsRef.current = new Array(barCount).fill(0);
        }

        for (let i = 0; i < barCount; i++) {
          const target = samples[i];
          const prev = smoothedBarsRef.current[i] ?? 0;
          const smoothed = prev + (target - prev) * 0.36;
          smoothedBarsRef.current[i] = smoothed;

          const totalH = Math.max(4, smoothed * maxHalfHeight * 2);
          const x = i * step + (step - barW) / 2;
          const y = centerY - totalH / 2;

          ctx.save();
          ctx.fillStyle = currentColor;
          ctx.globalAlpha = 0.84;
          ctx.beginPath();
          ctx.roundRect(x, y, barW, totalH, barW / 2);
          ctx.fill();
          ctx.restore();
        }
      } else {
        // Default: dual harmonic waveform
        let hasLiveTimeData = false;
        if (analyserNode && timeData) {
          analyserNode.getByteTimeDomainData(timeData);
          for (let i = 0; i < timeData.length; i++) {
            if (Math.abs(timeData[i] - 128) > 2) {
              hasLiveTimeData = true;
              break;
            }
          }
        }

        const amp = Math.min(22, Math.max(8, height * 0.24));
        const points = 100;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let i = 0; i <= points; i++) {
          const x = (i / points) * width;
          const envelope = Math.sin((i / points) * Math.PI);
          let yOffset = 0;

          if (hasLiveTimeData && timeData) {
            const idx = Math.min(
              timeData.length - 1,
              Math.floor((i / points) * timeData.length)
            );
            const normalized = (timeData[idx] - 128) / 128;
            yOffset = normalized * amp * 1.45 * envelope;
          } else {
            yOffset =
              Math.sin(i * 0.2 + phaseRef.current) * (amp * 0.65) * envelope +
              Math.sin(i * 0.5 - phaseRef.current * 2) * (amp * 0.35) * envelope +
              Math.sin(i * 0.1 + phaseRef.current * 0.5) * (amp * 0.22) * envelope;
          }

          ctx.lineTo(x, centerY + yOffset);
        }

        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.85;
        ctx.stroke();

        // Secondary echo wave for depth
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let i = 0; i <= points; i++) {
          const x = (i / points) * width;
          const envelope = Math.sin((i / points) * Math.PI);
          const y =
            centerY +
            Math.sin(i * 0.2 + phaseRef.current + 1.0) * (amp * 0.6) * envelope;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.restore();
      }

      if (!prefersReducedMotion) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      resizeObserver?.disconnect();
    };
  }, [isPlaying, color, variant, analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default AudioVisualizer;