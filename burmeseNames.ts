/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Voice } from './types';

export type VoiceArchetype =
  | 'matureFemale'
  | 'adultFemale'
  | 'youngFemale'
  | 'matureGravellyMale'
  | 'middleAgedMale'
  | 'youngMale';

export interface BurmeseCharacterName {
  mm: string;
  en: string;
}

const ARCHETYPE_POOLS: Record<VoiceArchetype, BurmeseCharacterName[]> = {
  matureFemale: [
    { mm: 'မအေးအေးဝင်း', en: 'Ma Aye Aye Win' },
    { mm: 'ဒေါ်ခင်မြင့်', en: 'Daw Khin Myint' },
    { mm: 'မသီတာဦး', en: 'Ma Thidar Oo' },
    { mm: 'ဒေါ်စန်းစန်းမြင့်', en: 'Daw San San Myint' },
    { mm: 'မတင်တင်လှ', en: 'Ma Tin Tin Hla' },
    { mm: 'ဒေါ်မြင့်မြင့်သန်း', en: 'Daw Myint Myint Than' },
    { mm: 'မချိုချိုဝင်း', en: 'Ma Cho Cho Win' },
    { mm: 'ဒေါ်နုနုရီ', en: 'Daw Nu Nu Yi' },
    { mm: 'မဝင်းဝင်းမော်', en: 'Ma Win Win Maw' },
    { mm: 'ဒေါ်သန်းသန်းဌေး', en: 'Daw Than Than Htay' },
  ],
  adultFemale: [
    { mm: 'မေသဇင်', en: 'May Thazin' },
    { mm: 'ခင်ဝင့်ဝါ', en: 'Khin Wint Wah' },
    { mm: 'နွယ်နီအောင်', en: 'Nwe Ni Aung' },
    { mm: 'သီရိမောင်', en: 'Thiri Maung' },
    { mm: 'မမိုးမြတ်', en: 'Ma Moe Myat' },
    { mm: 'စုမြတ်နိုး', en: 'Su Myat Noe' },
    { mm: 'ဖြူစင်သန့်', en: 'Phyu Sin Thant' },
    { mm: 'ကြည်ပြာဝင်း', en: 'Kyi Pyar Win' },
    { mm: 'မေသူဇာ', en: 'May Thu Zar' },
    { mm: 'ရတနာမင်း', en: 'Yadanar Min' },
  ],
  youngFemale: [
    { mm: 'သံစဉ်ချို', en: 'Than Zin Cho' },
    { mm: 'မေမြတ်နိုး', en: 'May Myat Noe' },
    { mm: 'ယွန်းမီမီ', en: 'Yoon Mi Mi' },
    { mm: 'နှင်းဝတ်ရည်', en: 'Hnin Wut Yi' },
    { mm: 'ပန်းအိဖြူ', en: 'Pan Ei Phyu' },
    { mm: 'ချိုမာလာ', en: 'Cho Marlar' },
    { mm: 'ရွှေရည်လွင်', en: 'Shwe Yi Lwin' },
    { mm: 'ဖူးပွင့်ခိုင်', en: 'Phoo Pwint Khine' },
    { mm: 'ဆုလာဘ်မွန်', en: 'Su Latt Mon' },
    { mm: 'နန်းမိုခမ်း', en: 'Nang Mo Kham' },
    { mm: 'ဧကရီ', en: 'Eikari' },
    { mm: 'သက်ထားစံ', en: 'Thet Htar San' },
    { mm: 'မြတ်သီတာ', en: 'Myat Thidar' },
    { mm: 'လင်းလက်ကြယ်', en: 'Lin Let Kyal' },
  ],
  matureGravellyMale: [
    { mm: 'ဘစိုင်း', en: 'Ba Sai' },
    { mm: 'ဦးကျော်ဇေယျ', en: 'U Kyaw Zeya' },
    { mm: 'ဦးတင်မောင်ဝင်း', en: 'U Tin Maung Win' },
    { mm: 'ကိုဘမောင်', en: 'Ko Ba Maung' },
    { mm: 'ဦးသိန်းဟန်', en: 'U Thein Han' },
    { mm: 'ဦးမြင့်ဆွေ', en: 'U Myint Swe' },
    { mm: 'ဘထွန်း', en: 'Ba Tun' },
    { mm: 'ဦးအောင်ခိုင်', en: 'U Aung Khine' },
    { mm: 'ကိုစောထွန်း', en: 'Ko Saw Tun' },
    { mm: 'ဦးစိန်ဝင်း', en: 'U Sein Win' },
    { mm: 'ဘမင်း', en: 'Ba Min' },
    { mm: 'ဦးဝင်းမြင့်', en: 'U Win Myint' },
  ],
  middleAgedMale: [
    { mm: 'ကိုမင်းထက်', en: 'Ko Min Htet' },
    { mm: 'ကိုဇော်လင်း', en: 'Ko Zaw Lin' },
    { mm: 'ကိုနေဝင်း', en: 'Ko Nay Win' },
    { mm: 'ကိုစိုးမိုး', en: 'Ko Soe Moe' },
    { mm: 'ကိုရဲမြင့်', en: 'Ko Ye Myint' },
    { mm: 'ကိုထွန်းအောင်', en: 'Ko Tun Aung' },
    { mm: 'ကိုသက်နိုင်', en: 'Ko Thet Naing' },
    { mm: 'ကိုအောင်မြတ်', en: 'Ko Aung Myat' },
    { mm: 'ကိုကျော်စွာ', en: 'Ko Kyaw Swar' },
    { mm: 'ကိုမျိုးမင်း', en: 'Ko Myo Min' },
    { mm: 'ကိုဖြိုးဝေ', en: 'Ko Phyo Wai' },
    { mm: 'ကိုလင်းထွဋ်', en: 'Ko Lin Htut' },
  ],
  youngMale: [
    { mm: 'မောင်ကောင်းထက်', en: 'Mg Kaung Htet' },
    { mm: 'သုတအောင်', en: 'Thuta Aung' },
    { mm: 'ခန့်ညားမောင်', en: 'Khant Nyar Maung' },
    { mm: 'မင်းခန့်', en: 'Min Khant' },
    { mm: 'ညီညီထွန်း', en: 'Nyi Nyi Tun' },
    { mm: 'ဇွဲမာန်', en: 'Zwe Man' },
    { mm: 'ထက်မြက်', en: 'Htet Myat' },
    { mm: 'ကောင်းစံ', en: 'Kaung San' },
    { mm: 'ရဲရင့်', en: 'Ye Yint' },
    { mm: 'လင်းခန့်', en: 'Lin Khant' },
    { mm: 'ပြည့်စုံ', en: 'Pyae Sone' },
    { mm: 'စွမ်းထက်', en: 'Swan Htet' },
  ],
};

export const CHARACTER_NAMES_STORAGE_KEY = 'gemini-voice-library:burmese-character-names';

export function getVoiceArchetype(voice: Voice): VoiceArchetype {
  const isFemale = voice.analysis.gender === 'Female';
  const traits = [...voice.characteristics, ...voice.analysis.characteristics]
    .join(' ')
    .toLowerCase();

  if (isFemale) {
    if (traits.includes('mature') || traits.includes('sophisticated')) {
      return 'matureFemale';
    }
    if (traits.includes('young adult') || traits.includes('youthful')) {
      return 'youngFemale';
    }
    if (voice.pitch === 'Middle' && traits.includes('professional') && !traits.includes('breezy')) {
      return 'matureFemale';
    }
    return 'adultFemale';
  }

  // Male archetypes
  if (
    traits.includes('gravelly') ||
    traits.includes('deep') ||
    traits.includes('breathy') ||
    traits.includes('30s-40s') ||
    (voice.pitch === 'Lower' && traits.includes('resonant')) ||
    (voice.pitch === 'Lower middle' && traits.includes('resonant'))
  ) {
    return 'matureGravellyMale';
  }

  if (traits.includes('young adult') || traits.includes('youthful')) {
    return 'youngMale';
  }

  return 'middleAgedMale';
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateBurmeseNameMap(
  voices: Voice[],
  randomize: boolean = false,
  previousMap?: Record<string, BurmeseCharacterName>
): Record<string, BurmeseCharacterName> {
  const pools: Record<VoiceArchetype, BurmeseCharacterName[]> = {
    matureFemale: randomize
      ? shuffleArray(ARCHETYPE_POOLS.matureFemale)
      : [...ARCHETYPE_POOLS.matureFemale],
    adultFemale: randomize
      ? shuffleArray(ARCHETYPE_POOLS.adultFemale)
      : [...ARCHETYPE_POOLS.adultFemale],
    youngFemale: randomize
      ? shuffleArray(ARCHETYPE_POOLS.youngFemale)
      : [...ARCHETYPE_POOLS.youngFemale],
    matureGravellyMale: randomize
      ? shuffleArray(ARCHETYPE_POOLS.matureGravellyMale)
      : [...ARCHETYPE_POOLS.matureGravellyMale],
    middleAgedMale: randomize
      ? shuffleArray(ARCHETYPE_POOLS.middleAgedMale)
      : [...ARCHETYPE_POOLS.middleAgedMale],
    youngMale: randomize
      ? shuffleArray(ARCHETYPE_POOLS.youngMale)
      : [...ARCHETYPE_POOLS.youngMale],
  };

  // Prioritize iconic defaults (Gacrux -> မအေးအေးဝင်း, Algenib -> ဘစိုင်း) when non-random
  const orderedVoices = randomize
    ? voices
    : [...voices].sort((a, b) => {
        const priority = (n: string) => (n === 'Gacrux' || n === 'Algenib' ? 0 : 1);
        return priority(a.name) - priority(b.name);
      });

  const usedNames = new Set<string>();
  const result: Record<string, BurmeseCharacterName> = {};

  for (const voice of orderedVoices) {
    const archetype = getVoiceArchetype(voice);
    const pool = pools[archetype];

    let chosen = pool.find(
      (candidate) =>
        !usedNames.has(candidate.mm) &&
        (!randomize || !previousMap || previousMap[voice.name]?.mm !== candidate.mm)
    );

    if (!chosen) {
      chosen = pool.find((candidate) => !usedNames.has(candidate.mm)) || pool[0];
    }

    usedNames.add(chosen.mm);
    result[voice.name] = chosen;
  }

  return result;
}

export function loadBurmeseNameMap(voices: Voice[]): Record<string, BurmeseCharacterName> {
  const defaults = generateBurmeseNameMap(voices, false);
  try {
    const raw = localStorage.getItem(CHARACTER_NAMES_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return defaults;

    const merged: Record<string, BurmeseCharacterName> = { ...defaults };
    for (const voice of voices) {
      const entry = parsed[voice.name];
      if (
        entry &&
        typeof entry === 'object' &&
        typeof entry.mm === 'string' &&
        typeof entry.en === 'string' &&
        entry.mm.trim().length > 0
      ) {
        merged[voice.name] = { mm: entry.mm, en: entry.en };
      }
    }
    return merged;
  } catch {
    return defaults;
  }
}
