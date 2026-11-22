/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n';

export const PITCH_HZ_MIN_BOUND = 70;
export const PITCH_HZ_MAX_BOUND = 300;
export const PITCH_HZ_STEP = 5;
export const PITCH_HZ_MIN_GAP = 10;

interface PitchRangeFilterProps {
  value: [number, number];
  onChange: (next: [number, number]) => void;
  minBound?: number;
  maxBound?: number;
  step?: number;
  minGap?: number;
  variant?: 'compact' | 'expanded';
}

const PitchRangeFilter: React.FC<PitchRangeFilterProps> = ({
  value,
  onChange,
  minBound = PITCH_HZ_MIN_BOUND,
  maxBound = PITCH_HZ_MAX_BOUND,
  step = PITCH_HZ_STEP,
  minGap = PITCH_HZ_MIN_GAP,
  variant = 'compact',
}) => {
  const { t } = useI18n();
  const [minVal, maxVal] = value;

  const [minDraft, setMinDraft] = useState(String(minVal));
  const [maxDraft, setMaxDraft] = useState(String(maxVal));
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingThumbRef = useRef<'min' | 'max' | null>(null);
  const valueRef = useRef<[number, number]>(value);
  valueRef.current = value;

  useEffect(() => {
    setMinDraft(String(minVal));
  }, [minVal]);

  useEffect(() => {
    setMaxDraft(String(maxVal));
  }, [maxVal]);

  const snapValue = useCallback(
    (raw: number) => {
      const snapped = Math.round((raw - minBound) / step) * step + minBound;
      return Math.max(minBound, Math.min(maxBound, snapped));
    },
    [minBound, maxBound, step]
  );

  const toPercent = (hz: number) => {
    if (maxBound <= minBound) return 0;
    return Math.max(0, Math.min(100, ((hz - minBound) / (maxBound - minBound)) * 100));
  };

  const minPercent = toPercent(minVal);
  const maxPercent = toPercent(maxVal);
  const isModified = minVal !== minBound || maxVal !== maxBound;

  const clientXToHz = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return minBound;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return minBound;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return snapValue(minBound + ratio * (maxBound - minBound));
    },
    [minBound, maxBound, snapValue]
  );

  const applyThumbMove = useCallback(
    (thumb: 'min' | 'max', targetHz: number) => {
      const [curMin, curMax] = valueRef.current;
      if (thumb === 'min') {
        const clamped = Math.max(minBound, Math.min(curMax - minGap, targetHz));
        if (clamped !== curMin) {
          onChange([clamped, curMax]);
        }
      } else {
        const clamped = Math.min(maxBound, Math.max(curMin + minGap, targetHz));
        if (clamped !== curMax) {
          onChange([curMin, clamped]);
        }
      }
    },
    [minBound, maxBound, minGap, onChange]
  );

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    const clickedHz = clientXToHz(e.clientX);
    const distToMin = Math.abs(clickedHz - minVal);
    const distToMax = Math.abs(clickedHz - maxVal);

    let chosen: 'min' | 'max';
    if (distToMin === distToMax) {
      chosen = clickedHz >= maxVal ? 'max' : 'min';
    } else {
      chosen = distToMin < distToMax ? 'min' : 'max';
    }

    draggingThumbRef.current = chosen;
    setActiveThumb(chosen);
    e.currentTarget.setPointerCapture(e.pointerId);
    applyThumbMove(chosen, clickedHz);
  };

  const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingThumbRef.current) return;
    const hz = clientXToHz(e.clientX);
    applyThumbMove(draggingThumbRef.current, hz);
  };

  const handleTrackPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingThumbRef.current) return;
    draggingThumbRef.current = null;
    setActiveThumb(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleThumbKeyDown = (thumb: 'min' | 'max', e: React.KeyboardEvent<HTMLDivElement>) => {
    const cur = thumb === 'min' ? minVal : maxVal;
    let next: number | null = null;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      next = cur + step;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      next = cur - step;
    } else if (e.key === 'PageUp') {
      next = cur + step * 4;
    } else if (e.key === 'PageDown') {
      next = cur - step * 4;
    } else if (e.key === 'Home') {
      next = thumb === 'min' ? minBound : minVal + minGap;
    } else if (e.key === 'End') {
      next = thumb === 'min' ? maxVal - minGap : maxBound;
    }

    if (next !== null) {
      e.preventDefault();
      applyThumbMove(thumb, next);
    }
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setMinDraft(raw);
    const parsed = Number(raw);
    if (raw.trim() !== '' && Number.isFinite(parsed) && parsed >= minBound && parsed <= maxVal - minGap) {
      onChange([Math.round(parsed), maxVal]);
    }
  };

  const commitMinInput = () => {
    const parsed = Number(minDraft);
    if (!Number.isFinite(parsed) || minDraft.trim() === '') {
      setMinDraft(String(minVal));
      return;
    }
    const clamped = Math.max(minBound, Math.min(maxVal - minGap, Math.round(parsed)));
    setMinDraft(String(clamped));
    if (clamped !== minVal) {
      onChange([clamped, maxVal]);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setMaxDraft(raw);
    const parsed = Number(raw);
    if (raw.trim() !== '' && Number.isFinite(parsed) && parsed <= maxBound && parsed >= minVal + minGap) {
      onChange([minVal, Math.round(parsed)]);
    }
  };

  const commitMaxInput = () => {
    const parsed = Number(maxDraft);
    if (!Number.isFinite(parsed) || maxDraft.trim() === '') {
      setMaxDraft(String(maxVal));
      return;
    }
    const clamped = Math.min(maxBound, Math.max(minVal + minGap, Math.round(parsed)));
    setMaxDraft(String(clamped));
    if (clamped !== maxVal) {
      onChange([minVal, clamped]);
    }
  };

  const handleReset = () => {
    onChange([minBound, maxBound]);
  };

  const renderSliderTrack = (trackHeightClass: string) => {
    const lowEndPct = toPercent(145);
    const midEndPct = toPercent(215);

    return (
      <div
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        onPointerCancel={handleTrackPointerUp}
        className={`relative flex items-center select-none touch-none cursor-pointer ${trackHeightClass}`}
      >
        {/* Base Track with subtle vocal register zones (Low / Mid / High) */}
        <div className="relative w-full h-1.5 rounded-full bg-[#EBE2CE] dark:bg-[#0D3126] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[#DFD3BA]/80 dark:bg-[#114637]/60"
            style={{ width: `${lowEndPct}%` }}
          />
          <div
            className="absolute inset-y-0 bg-[#E6DAC3]/70 dark:bg-[#0D3A2E]"
            style={{ left: `${lowEndPct}%`, width: `${midEndPct - lowEndPct}%` }}
          />
          {/* Register boundary tick marks */}
          <div
            className="absolute inset-y-0 w-px bg-[#B49049]/40 dark:bg-[#C6A259]/35"
            style={{ left: `${lowEndPct}%` }}
          />
          <div
            className="absolute inset-y-0 w-px bg-[#B49049]/40 dark:bg-[#C6A259]/35"
            style={{ left: `${midEndPct}%` }}
          />
          {/* Selected Active Range Bar */}
          <div
            className="absolute inset-y-0 rounded-full bg-[#114637] dark:bg-gradient-to-r dark:from-[#B49049] dark:to-[#DFC589] transition-[left,width] duration-75"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(0, maxPercent - minPercent)}%`,
            }}
          />
        </div>

        {/* Min Thumb */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={t.pitchMinHz}
          aria-valuemin={minBound}
          aria-valuemax={maxVal - minGap}
          aria-valuenow={minVal}
          aria-valuetext={`${minVal} Hz`}
          onKeyDown={(e) => handleThumbKeyDown('min', e)}
          onPointerDown={(e) => {
            e.stopPropagation();
            draggingThumbRef.current = 'min';
            setActiveThumb('min');
            trackRef.current?.setPointerCapture(e.pointerId);
          }}
          style={{ left: `${minPercent}%` }}
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#FAF6EC] dark:bg-[#041813] border-2 border-[#0D3A2E] dark:border-[#DFC589] shadow-sm cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B49049] transition-transform ${
            activeThumb === 'min' ? 'scale-125 z-30' : 'hover:scale-110 z-20'
          }`}
        />

        {/* Max Thumb */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={t.pitchMaxHz}
          aria-valuemin={minVal + minGap}
          aria-valuemax={maxBound}
          aria-valuenow={maxVal}
          aria-valuetext={`${maxVal} Hz`}
          onKeyDown={(e) => handleThumbKeyDown('max', e)}
          onPointerDown={(e) => {
            e.stopPropagation();
            draggingThumbRef.current = 'max';
            setActiveThumb('max');
            trackRef.current?.setPointerCapture(e.pointerId);
          }}
          style={{ left: `${maxPercent}%` }}
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#FAF6EC] dark:bg-[#041813] border-2 border-[#0D3A2E] dark:border-[#DFC589] shadow-sm cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B49049] transition-transform ${
            activeThumb === 'max' ? 'scale-125 z-30' : 'hover:scale-110 z-20'
          }`}
        />
      </div>
    );
  };

  if (variant === 'expanded') {
    return (
      <div className="bg-[#FAF6EC]/90 dark:bg-[#092E24] border border-[#D9CEB8] dark:border-[#C6A259]/25 p-3.5 rounded-xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[#072920] dark:text-[#FAF6EC]">
            {t.pitchHzFilter}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold tabular-nums text-[#114637] dark:text-[#DFC589]">
              {minVal}–{maxVal} Hz
            </span>
            {isModified && (
              <button
                type="button"
                onClick={handleReset}
                title={t.resetPitchRange}
                aria-label={t.resetPitchRange}
                className="p-1 rounded-md text-[#5B7469] hover:text-[#072920] dark:text-[#9EB5AC] dark:hover:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="px-1.5">{renderSliderTrack('h-6')}</div>

        <div className="flex justify-between text-[10px] text-[#5B7469] dark:text-[#8DA399] font-mono tabular-nums px-0.5">
          <span>{minBound} Hz ({t.pitchRangeLow.split(' ')[0]})</span>
          <span>145–215</span>
          <span>{maxBound} Hz ({t.pitchRangeHigh.split(' ')[0]})</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-[#5B7469] dark:text-[#8DA399]">
              {t.pitchMinHz}
            </span>
            <div className="relative flex items-center">
              <input
                type="number"
                min={minBound}
                max={maxVal - minGap}
                step={step}
                value={minDraft}
                onChange={handleMinInputChange}
                onBlur={commitMinInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitMinInput();
                    e.currentTarget.blur();
                  }
                }}
                aria-label={t.pitchMinHz}
                className="w-full bg-[#F4EDE0] dark:bg-[#06231B] border border-[#D9CEB8] dark:border-[#C6A259]/25 rounded-lg px-2.5 py-1.5 pr-8 text-xs font-mono tabular-nums text-[#072920] dark:text-[#FAF6EC] focus:outline-none focus:ring-2 focus:ring-[#B49049]/30 dark:focus:ring-[#C6A259]/30"
              />
              <span className="pointer-events-none absolute right-2 text-[10px] font-mono text-[#5B7469] dark:text-[#8DA399]">
                Hz
              </span>
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-[#5B7469] dark:text-[#8DA399]">
              {t.pitchMaxHz}
            </span>
            <div className="relative flex items-center">
              <input
                type="number"
                min={minVal + minGap}
                max={maxBound}
                step={step}
                value={maxDraft}
                onChange={handleMaxInputChange}
                onBlur={commitMaxInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitMaxInput();
                    e.currentTarget.blur();
                  }
                }}
                aria-label={t.pitchMaxHz}
                className="w-full bg-[#F4EDE0] dark:bg-[#06231B] border border-[#D9CEB8] dark:border-[#C6A259]/25 rounded-lg px-2.5 py-1.5 pr-8 text-xs font-mono tabular-nums text-[#072920] dark:text-[#FAF6EC] focus:outline-none focus:ring-2 focus:ring-[#B49049]/30 dark:focus:ring-[#C6A259]/30"
              />
              <span className="pointer-events-none absolute right-2 text-[10px] font-mono text-[#5B7469] dark:text-[#8DA399]">
                Hz
              </span>
            </div>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-[#FAF6EC]/90 dark:bg-[#041813]/85 border border-[#D9CEB8] dark:border-[#C6A259]/25 px-2.5 py-1 rounded-lg text-xs font-medium text-[#06231B] dark:text-[#FAF6EC] shadow-xs">
      <span className="whitespace-nowrap text-[11px] text-[#3D5F53] dark:text-[#9EB5AC]">
        {t.pitchHzFilter}
      </span>

      <input
        type="number"
        min={minBound}
        max={maxVal - minGap}
        step={step}
        value={minDraft}
        onChange={handleMinInputChange}
        onBlur={commitMinInput}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitMinInput();
            e.currentTarget.blur();
          }
        }}
        aria-label={t.pitchMinHz}
        title={t.pitchMinHz}
        className="w-12 px-1.5 py-0.5 rounded bg-[#F4EDE0] dark:bg-[#06231B] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[11px] font-mono tabular-nums text-center text-[#06231B] dark:text-[#FAF6EC] focus:outline-none focus:ring-1 focus:ring-[#B49049] dark:focus:ring-[#DFC589]"
      />

      <div className="w-24 sm:w-28 px-1 shrink-0">{renderSliderTrack('h-5')}</div>

      <input
        type="number"
        min={minVal + minGap}
        max={maxBound}
        step={step}
        value={maxDraft}
        onChange={handleMaxInputChange}
        onBlur={commitMaxInput}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitMaxInput();
            e.currentTarget.blur();
          }
        }}
        aria-label={t.pitchMaxHz}
        title={t.pitchMaxHz}
        className="w-12 px-1.5 py-0.5 rounded bg-[#F4EDE0] dark:bg-[#06231B] border border-[#D9CEB8] dark:border-[#C6A259]/25 text-[11px] font-mono tabular-nums text-center text-[#06231B] dark:text-[#FAF6EC] focus:outline-none focus:ring-1 focus:ring-[#B49049] dark:focus:ring-[#DFC589]"
      />

      <span className="text-[11px] font-mono text-[#5B7469] dark:text-[#8DA399] shrink-0">Hz</span>

      {isModified && (
        <button
          type="button"
          onClick={handleReset}
          title={t.resetPitchRange}
          aria-label={t.resetPitchRange}
          className="p-0.5 rounded text-[#5B7469] hover:text-[#06231B] dark:text-[#9EB5AC] dark:hover:text-[#EAD7A4] hover:bg-[#EBE2CE] dark:hover:bg-[#114637] transition-colors shrink-0"
        >
          <RotateCcw size={12} />
        </button>
      )}
    </div>
  );
};

export default PitchRangeFilter;
