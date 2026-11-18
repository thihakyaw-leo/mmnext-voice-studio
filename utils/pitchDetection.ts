/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PitchDetectionResult {
  frequency: number | null;
  rms: number;
  clarity: number;
}

export interface NoteInfo {
  note: string;
  octave: number;
  cents: number;
  label: string;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Normalized autocorrelation pitch detector tuned for human speech (70 Hz - 520 Hz).
 * Uses parabolic interpolation around the best correlation lag for sub-sample precision.
 */
export function detectPitchAutocorrelation(
  buffer: Float32Array,
  sampleRate: number
): PitchDetectionResult {
  const size = buffer.length;
  if (size < 64 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return { frequency: null, rms: 0, clarity: 0 };
  }

  let sumSq = 0;
  for (let i = 0; i < size; i++) {
    const val = buffer[i];
    sumSq += val * val;
  }
  const rms = Math.sqrt(sumSq / size);

  // Silence gate
  if (rms < 0.012) {
    return { frequency: null, rms, clarity: 0 };
  }

  const minLag = Math.max(1, Math.floor(sampleRate / 520));
  const maxLag = Math.min(Math.floor(size / 2), Math.ceil(sampleRate / 70));
  if (maxLag <= minLag + 2) {
    return { frequency: null, rms, clarity: 0 };
  }

  const correlations = new Float32Array(maxLag + 1);
  let bestLag = -1;
  let bestCorr = 0;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let cross = 0;
    let normA = 0;
    let normB = 0;
    const limit = size - lag;
    for (let i = 0; i < limit; i++) {
      const a = buffer[i];
      const b = buffer[i + lag];
      cross += a * b;
      normA += a * a;
      normB += b * b;
    }
    const denom = Math.sqrt(normA * normB);
    const corr = denom > 0 ? cross / denom : 0;
    correlations[lag] = corr;

    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  if (bestLag <= minLag || bestLag >= maxLag || bestCorr < 0.62) {
    return { frequency: null, rms, clarity: bestCorr };
  }

  // Parabolic interpolation around bestLag
  const left = correlations[bestLag - 1] ?? bestCorr;
  const center = correlations[bestLag];
  const right = correlations[bestLag + 1] ?? bestCorr;
  const denom = 2 * (2 * center - left - right);
  const shift = Math.abs(denom) > 1e-6 ? (right - left) / denom : 0;
  const refinedLag = bestLag + Math.max(-0.5, Math.min(0.5, shift));

  const frequency = sampleRate / refinedLag;
  if (!Number.isFinite(frequency) || frequency < 65 || frequency > 550) {
    return { frequency: null, rms, clarity: bestCorr };
  }

  return { frequency, rms, clarity: bestCorr };
}

export function frequencyToNote(frequency: number): NoteInfo {
  const midiFloat = 12 * Math.log2(frequency / 440) + 69;
  const midi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const noteIdx = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[noteIdx];
  return {
    note,
    octave,
    cents,
    label: `${note}${octave}`,
  };
}

export function classifyVocalRegister(frequency: number): 'low' | 'mid' | 'high' {
  if (frequency < 145) return 'low';
  if (frequency <= 215) return 'mid';
  return 'high';
}

export function getVoicePitchHz(voice: { pitch: string; analysis?: { gender?: string; pitch?: string } }): number {
  const p = (voice.analysis?.pitch || voice.pitch || '').toLowerCase();
  const g = (voice.analysis?.gender || '').toLowerCase();
  const isFemale = g === 'female';

  if (p.includes('high') || p.includes('higher')) {
    return isFemale ? 220 : 160;
  }
  if (p.includes('low') || p.includes('lower')) {
    return isFemale ? 140 : 105;
  }
  if (p.includes('medium-low') || p.includes('lower middle')) {
    return isFemale ? 165 : 125;
  }
  if (p.includes('medium-high')) {
    return isFemale ? 205 : 150;
  }
  return isFemale ? 185 : 135;
}

