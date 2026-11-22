/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BurmeseCharacterName {
  mm: string;
  en: string;
}

export const CHARACTER_NAMES_STORAGE_KEY = 'gemini-voice-library:burmese-character-names';

// Legacy preset dummy names used strictly to detect and purge stale auto-seeded
// placeholder records from previous browser storage / Firestore sessions.
const LEGACY_PRESET_PAIRS = new Set<string>([
  'မအေးအေးဝင်း|Ma Aye Aye Win',
  'ဒေါ်ခင်မြင့်|Daw Khin Myint',
  'မသီတာဦး|Ma Thidar Oo',
  'ဒေါ်စန်းစန်းမြင့်|Daw San San Myint',
  'မတင်တင်လှ|Ma Tin Tin Hla',
  'ဒေါ်မြင့်မြင့်သန်း|Daw Myint Myint Than',
  'မချိုချိုဝင်း|Ma Cho Cho Win',
  'ဒေါ်နုနုရီ|Daw Nu Nu Yi',
  'မဝင်းဝင်းမော်|Ma Win Win Maw',
  'ဒေါ်သန်းသန်းဌေး|Daw Than Than Htay',
  'မေသဇင်|May Thazin',
  'ခင်ဝင့်ဝါ|Khin Wint Wah',
  'နွယ်နီအောင်|Nwe Ni Aung',
  'သီရိမောင်|Thiri Maung',
  'မမိုးမြတ်|Ma Moe Myat',
  'စုမြတ်နိုး|Su Myat Noe',
  'ဖြူစင်သန့်|Phyu Sin Thant',
  'ကြည်ပြာဝင်း|Kyi Pyar Win',
  'မေသူဇာ|May Thu Zar',
  'ရတနာမင်း|Yadanar Min',
  'သံစဉ်ချို|Than Zin Cho',
  'မေမြတ်နိုး|May Myat Noe',
  'ယွန်းမီမီ|Yoon Mi Mi',
  'နှင်းဝတ်ရည်|Hnin Wut Yi',
  'ပန်းအိဖြူ|Pan Ei Phyu',
  'ချိုမာလာ|Cho Marlar',
  'ရွှေရည်လွင်|Shwe Yi Lwin',
  'ဖူးပွင့်ခိုင်|Phoo Pwint Khine',
  'ဆုလာဘ်မွန်|Su Latt Mon',
  'နန်းမိုခမ်း|Nang Mo Kham',
  'ဧကရီ|Eikari',
  'သက်ထားစံ|Thet Htar San',
  'မြတ်သီတာ|Myat Thidar',
  'လင်းလက်ကြယ်|Lin Let Kyal',
  'ဘစိုင်း|Ba Sai',
  'ဦးကျော်ဇေယျ|U Kyaw Zeya',
  'ဦးတင်မောင်ဝင်း|U Tin Maung Win',
  'ကိုဘမောင်|Ko Ba Maung',
  'ဦးသိန်းဟန်|U Thein Han',
  'ဦးမြင့်ဆွေ|U Myint Swe',
  'ဘထွန်း|Ba Tun',
  'ဦးအောင်ခိုင်|U Aung Khine',
  'ကိုစောထွန်း|Ko Saw Tun',
  'ဦးစိန်ဝင်း|U Sein Win',
  'ဘမင်း|Ba Min',
  'ဦးဝင်းမြင့်|U Win Myint',
  'ကိုမင်းထက်|Ko Min Htet',
  'ကိုဇော်လင်း|Ko Zaw Lin',
  'ကိုနေဝင်း|Ko Nay Win',
  'ကိုစိုးမိုး|Ko Soe Moe',
  'ကိုရဲမြင့်|Ko Ye Myint',
  'ကိုထွန်းအောင်|Ko Tun Aung',
  'ကိုသက်နိုင်|Ko Thet Naing',
  'ကိုအောင်မြတ်|Ko Aung Myat',
  'ကိုကျော်စွာ|Ko Kyaw Swar',
  'ကိုမျိုးမင်း|Ko Myo Min',
  'ကိုဖြိုးဝေ|Ko Phyo Wai',
  'ကိုလင်းထွဋ်|Ko Lin Htut',
  'မောင်ကောင်းထက်|Mg Kaung Htet',
  'သုတအောင်|Thuta Aung',
  'ခန့်ညားမောင်|Khant Nyar Maung',
  'မင်းခန့်|Min Khant',
  'ညီညီထွန်း|Nyi Nyi Tun',
  'ဇွဲမာန်|Zwe Man',
  'ထက်မြက်|Htet Myat',
  'ကောင်းစံ|Kaung San',
  'ရဲရင့်|Ye Yint',
  'လင်းခန့်|Lin Khant',
  'ပြည့်စုံ|Pyae Sone',
  'စွမ်းထက်|Swan Htet',
]);

export function isLegacySeededCharacterMap(
  entries: [string, BurmeseCharacterName][]
): boolean {
  if (entries.length < 10) return false;
  return entries.every(([, val]) =>
    LEGACY_PRESET_PAIRS.has(`${val.mm.trim()}|${val.en.trim()}`)
  );
}
