/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CharacterAttireProfile {
  voiceName: string;
  imagePath: string;
  title: {
    mm: string;
    en: string;
  };
  attireCategory: {
    mm: string;
    en: string;
  };
  upperAttire: {
    mm: string;
    en: string;
  };
  lowerAttire: {
    mm: string;
    en: string;
  };
  accessories: {
    mm: string;
    en: string;
  };
  personaRole: {
    mm: string;
    en: string;
  };
  suitableProjects: {
    mm: string[];
    en: string[];
  };
}

export const CHARACTER_PORTRAITS = {
  femaleBright: '/assets/characters/myanmar_female_bright_1795349645647.jpg',
  femaleGraceful: '/assets/characters/myanmar_female_graceful_1795349646453.jpg',
  femaleMature: '/assets/characters/myanmar_female_mature_1795349646761.jpg',
  maleYouthful: '/assets/characters/myanmar_male_youthful_1795349647464.jpg',
  maleScholar: '/assets/characters/myanmar_male_scholar_1795349646325.jpg',
  maleElder: '/assets/characters/myanmar_male_elder_1795349647565.jpg',
};

export const CHARACTER_ATTIRE_PROFILES: Record<string, CharacterAttireProfile> = {
  Zephyr: {
    voiceName: 'Zephyr',
    imagePath: CHARACTER_PORTRAITS.femaleBright,
    title: {
      mm: 'တက်ကြွရွှင်လန်းသော မြန်မာအမျိုးသမီးငယ်',
      en: 'Radiant Modern Myanmar Youth',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ရင်ဖုံးဇာနှင့် လွန်းရာကျော်အချိတ်ထမီ',
      en: 'Traditional Lace Yinphone & Luntaya Acheik Htamein',
    },
    upperAttire: {
      mm: 'ရွှေရောင်ကြယ်သီးတပ်ဆင်ထားသော နို့နှစ်ရောင် ရင်ဖုံးဇာအင်္ကျီ',
      en: 'Tailored warm-ivory lace Yinphone blouse with antique gold buttons',
    },
    lowerAttire: {
      mm: 'မြကျောက်ရောင်နှင့် ရွှေချည်ထိုး မန္တလေးလွန်းရာကျော် အချိတ်ထမီ',
      en: 'Emerald green and gold woven Luntaya Acheik silk Htamein',
    },
    accessories: {
      mm: 'စပယ်ပန်းကုံးဆင် မြန်မာဆံထုံးမြင့်၊ ရွှေဆွဲကြိုးနှင့် ပါးကွက်သနပ်ခါး',
      en: 'High Myanmar Hsatone bun with white jasmine garland, gold pendant, golden Thanakha',
    },
    personaRole: {
      mm: 'ကြည်လင်တက်ကြွပြီး အကောင်းမြင်စိတ်အပြည့်ပါသော အသံ။ လူငယ်အစီအစဉ်များ၊ ကြော်ငြာများနှင့် အားပေးစကားများအတွက် သင့်တော်သည်။',
      en: 'Bright, energetic, and optimistic voice. Ideal for youth programs, commercials, and uplifting narration.',
    },
    suitableProjects: {
      mm: ['ရုပ်သံကြော်ငြာ', 'လူငယ်အစီအစဉ်', 'Vlog & ဆိုရှယ်မီဒီယာ', 'အားပေးစကား'],
      en: ['TV Commercials', 'Youth Programs', 'Vlog & Social', 'Inspirational'],
    },
  },

  Puck: {
    voiceName: 'Puck',
    imagePath: CHARACTER_PORTRAITS.maleYouthful,
    title: {
      mm: 'ဖော်ရွေသွက်လက်သော မြန်မာလူငယ်',
      en: 'Approachable Energetic Youth',
    },
    attireCategory: {
      mm: 'ခေတ်ပေါ်ပင်နီအင်္ကျီနှင့် ရိုးရာတိုက်ပုံ၊ ပိုးပုဆိုး',
      en: 'Contemporary Pinni Shirt, Taikpon Jacket & Silk Paso',
    },
    upperAttire: {
      mm: 'လည်ထောင်ကော်လာပါ နို့နှစ်ရောင် ပင်နီအင်္ကျီနှင့် အစိမ်းရင့်ရောင် တိုက်ပုံ',
      en: 'Crisp warm-ivory collarless Pinni shirt with tailored forest-green Taikpon jacket',
    },
    lowerAttire: {
      mm: 'မြကျောက်ရောင်နှင့် ရွှေဝါရောင် အကွက်စိပ် ပိုးပုဆိုး',
      en: 'Finely woven silk Paso longyi in subtle jade and gold check pattern',
    },
    accessories: {
      mm: 'သပ်ရပ်သောဆံပင်ပုံစံ၊ ရွှေလက်ကောက်နှင့် ခေတ်မီရိုးရာဟန်ပန်',
      en: 'Neat modern hairstyle with gold wrist ornament and warm engaging demeanor',
    },
    personaRole: {
      mm: 'ပေါ့ပေါ့ပါးပါးနှင့် အားမာန်ပါသော အသံ။ အသံလွှင့်အစီအစဉ်များ၊ မိတ်ဆက်စကားပြောနှင့် ပေါ့ပေါ့ပါးပါး စကားစမြည်အတွက် အထူးသင့်တော်သည်။',
      en: 'Casual, energetic, and engaging voice. Perfect for podcasts, casual conversational narration, and explainer videos.',
    },
    suitableProjects: {
      mm: ['ပေါ့ဒ်ကတ်စ်', 'နည်းပညာမိတ်ဆက်', 'ဂိမ်းဇာတ်ကောင်', 'ရှင်းလင်းချက်'],
      en: ['Podcasts', 'Tech Reviews', 'Game Characters', 'Explainer Videos'],
    },
  },

  Charon: {
    voiceName: 'Charon',
    imagePath: CHARACTER_PORTRAITS.maleElder,
    title: {
      mm: 'အေးဆေးတည်ငြိမ်သော မြန်မာပညာရှင်ကြီး',
      en: 'Distinguished Senior Scholar',
    },
    attireCategory: {
      mm: 'မဟာဆန်သော ပိုးခေါင်းပေါင်း၊ ကတ္တီပါတိုက်ပုံနှင့် ရတနာအချိတ်ပုဆိုး',
      en: 'Regal Silk Gaung Baung, Velvet Taikpon & Royal Acheik Paso',
    },
    upperAttire: {
      mm: 'ရှန်ပိန်ရောင်ပိုးခေါင်းပေါင်း၊ အဖြူရောင်ရင်စေ့ရှပ်နှင့် သစ်တောစိမ်း ကတ္တီပါတိုက်ပုံ',
      en: 'Champagne-ivory silk Gaung Baung headwrap with deep forest-emerald velvet Taikpon',
    },
    lowerAttire: {
      mm: 'ရွှေချည်ထိုး ရှေးဟောင်းမန္တလေးအချိတ် ပိုးပုဆိုး',
      en: 'Ornate antique-gold and emerald Mandalay Acheik silk Paso',
    },
    accessories: {
      mm: 'ကျောက်မျက်လက်စွပ်၊ အစဉ်အလာ မြန်မာ့ရိုးရာခေါင်းပေါင်းစတိုင်',
      en: 'Gemstone signet ring and authoritative traditional Myanmar formal demeanor',
    },
    personaRole: {
      mm: 'လေးနက်တည်ငြိမ်ပြီး အခမ်းအနားဆန်သော အသံဩဇာ။ မှတ်တမ်းရုပ်ရှင်၊ သမိုင်းကြောင်းနှင့် တရားဝင်ကြေညာချက်များအတွက် အကောင်းဆုံးဖြစ်သည်။',
      en: 'Deep, resonant, authoritative voice. Exceptional for documentaries, historical narrations, and formal proclamations.',
    },
    suitableProjects: {
      mm: ['မှတ်တမ်းရုပ်ရှင်', 'သမိုင်းဇာတ်လမ်း', 'အခမ်းအနားကြေညာ', 'အသံစာအုပ်ကြီးများ'],
      en: ['Documentaries', 'Historical Epics', 'Formal Announcements', 'Classic Audiobooks'],
    },
  },

  Kore: {
    voiceName: 'Kore',
    imagePath: CHARACTER_PORTRAITS.femaleBright,
    title: {
      mm: 'အကောင်းမြင်စိတ်ပြည့်ဝသော ယဉ်ကျေးမှုတင်ဆက်သူ',
      en: 'Optimistic Cultural Presenter',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ရင်ဖုံးဇာနှင့် လွန်းရာကျော်အချိတ်ထမီ',
      en: 'Traditional Lace Yinphone & Luntaya Acheik Htamein',
    },
    upperAttire: {
      mm: 'ရွှေရောင်ကြယ်သီးတပ် နို့နှစ်ရောင် ရင်ဖုံးဇာအင်္ကျီ',
      en: 'Tailored warm-ivory lace Yinphone blouse with antique gold buttons',
    },
    lowerAttire: {
      mm: 'မြကျောက်ရောင်နှင့် ရွှေချည်ထိုး မန္တလေးလွန်းရာကျော် အချိတ်ထမီ',
      en: 'Emerald green and gold woven Luntaya Acheik silk Htamein',
    },
    accessories: {
      mm: 'စပယ်ပန်းကုံးဆင် မြန်မာဆံထုံး၊ ရွှေဆွဲကြိုးနှင့် ပါးကွက်သနပ်ခါး',
      en: 'Classic high Myanmar Hsatone bun with jasmine garland and natural Thanakha',
    },
    personaRole: {
      mm: 'ပြတ်သားကြည်လင်ပြီး စိတ်အားထက်သန်သော အသံ။ ယဉ်ကျေးမှုအစီအစဉ်များ၊ ပညာပေးသင်ခန်းစာများနှင့် အသံစာအုပ်များအတွက် သင့်တော်သည်။',
      en: 'Firm, articulate, and enthusiastic tone. Suited for educational media, cultural narrations, and audiobooks.',
    },
    suitableProjects: {
      mm: ['ပညာပေးအစီအစဉ်', 'အသံစာအုပ်', 'ယဉ်ကျေးမှုမိတ်ဆက်', 'အွန်လိုင်းသင်တန်း'],
      en: ['Educational Media', 'Audiobooks', 'Cultural Guides', 'E-Learning'],
    },
  },

  Fenrir: {
    voiceName: 'Fenrir',
    imagePath: CHARACTER_PORTRAITS.maleScholar,
    title: {
      mm: 'နွေးထွေးဖော်ရွေသော သမိုင်းဇာတ်ကြောင်းပြောသူ',
      en: 'Warm Heritage Storyteller',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ပိုးတိုက်ပုံနှင့် ရွှေချည်ထိုးအချိတ်ပုဆိုး',
      en: 'Heritage Silk Taikpon & Woven Acheik Paso',
    },
    upperAttire: {
      mm: 'ရွှေကြယ်သီးတပ် ရင်စေ့ရှပ်အင်္ကျီနှင့် ကျောက်စိမ်းရင့်ရောင် ပိုးတိုက်ပုံ',
      en: 'Tailored dark emerald silk Taikpon jacket with warm-ivory collarless shirt',
    },
    lowerAttire: {
      mm: 'မန္တလေးအချိတ် ရွှေရောင်နှင့် အစိမ်းရောင်စပ် ပိုးပုဆိုး',
      en: 'Heritage Mandalay Acheik silk Paso with gold and green patterns',
    },
    accessories: {
      mm: 'ရွှေလက်စွပ်၊ သပ်ရပ်ကြည်လင်သော စကားပြောဟန်',
      en: 'Gold signet ring with composed, friendly, trustworthy expression',
    },
    personaRole: {
      mm: 'နွေးထွေး၍ စူးစမ်းလိုစိတ်ကို နှိုးဆွပေးသော လေသံ။ ဝတ္ထုရှည်များ၊ ခရီးသွားအစီအစဉ်များနှင့် မိတ်ဆွေသဖွယ် စကားပြောဆိုမှုများအတွက် အကောင်းဆုံးဖြစ်သည်။',
      en: 'Warm, inquisitive, and friendly tone in mid-30s vocal register. Perfect for travelogues, dramatic novels, and audio storytelling.',
    },
    suitableProjects: {
      mm: ['ခရီးသွားမှတ်တမ်း', 'ဝတ္ထုရှည်များ', 'ဇာတ်လမ်းပြောပြခြင်း', 'မိတ်ဆွေစကား'],
      en: ['Travelogues', 'Literary Fiction', 'Storytelling', 'Audio Guides'],
    },
  },

  Leda: {
    voiceName: 'Leda',
    imagePath: CHARACTER_PORTRAITS.femaleBright,
    title: {
      mm: 'နုပျိုလန်းဆန်းသော ပုံပြင်ဖတ်သူ',
      en: 'Youthful Fairy-Tale Narrator',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ရင်ဖုံးဇာနှင့် လွန်းရာကျော်အချိတ်ထမီ',
      en: 'Traditional Lace Yinphone & Luntaya Acheik Htamein',
    },
    upperAttire: {
      mm: 'ရွှေရောင်ကြယ်သီးတပ် နို့နှစ်ရောင် ရင်ဖုံးဇာအင်္ကျီ',
      en: 'Warm-ivory lace Yinphone blouse with delicate gold buttons',
    },
    lowerAttire: {
      mm: 'မြကျောက်ရောင်နှင့် ရွှေချည်ထိုး မန္တလေးလွန်းရာကျော် အချိတ်ထမီ',
      en: 'Emerald green and gold woven Luntaya Acheik silk Htamein',
    },
    accessories: {
      mm: 'စပယ်ပန်းကုံးဆင် မြန်မာဆံထုံး၊ ရွှေဆွဲကြိုးနှင့် ပါးကွက်သနပ်ခါး',
      en: 'High Myanmar Hsatone bun with jasmine garland and golden Thanakha',
    },
    personaRole: {
      mm: 'နုပျိုကြည်လင်ပြီး တက်ကြွသော အသံလေး။ ကလေးပုံပြင်များ၊ စိတ်ကူးယဉ်ဇာတ်လမ်းများနှင့် အန်နီမေးရှင်းများအတွက် အထူးသင့်တော်သည်။',
      en: 'Youthful, bright, and articulate voice. Ideal for children tales, animation dubbing, and fantasy stories.',
    },
    suitableProjects: {
      mm: ['ကလေးပုံပြင်', 'အန်နီမေးရှင်း', 'ကာတွန်းဇာတ်ကောင်', 'သင်ကြားရေး'],
      en: ['Children Stories', 'Animation', 'Cartoon Characters', 'Early Learning'],
    },
  },

  Orus: {
    voiceName: 'Orus',
    imagePath: CHARACTER_PORTRAITS.maleYouthful,
    title: {
      mm: 'ခေတ်မီမြန်မာလူငယ် သဘာဝအသံ',
      en: 'Contemporary Natural Presenter',
    },
    attireCategory: {
      mm: 'ခေတ်ပေါ်ပင်နီအင်္ကျီနှင့် ရိုးရာတိုက်ပုံ၊ ပိုးပုဆိုး',
      en: 'Contemporary Pinni Shirt, Taikpon Jacket & Silk Paso',
    },
    upperAttire: {
      mm: 'လည်ထောင်ကော်လာပါ နို့နှစ်ရောင် ပင်နီအင်္ကျီနှင့် အစိမ်းရင့်ရောင် တိုက်ပုံ',
      en: 'Warm-ivory collarless Pinni shirt with forest-green Taikpon jacket',
    },
    lowerAttire: {
      mm: 'မြကျောက်ရောင်နှင့် ရွှေဝါရောင် အကွက်စိပ် ပိုးပုဆိုး',
      en: 'Silk Paso longyi in subtle jade and gold check pattern',
    },
    accessories: {
      mm: 'သပ်ရပ်သောဆံပင်ပုံစံ၊ ရွှေလက်ကောက်နှင့် ခေတ်မီရိုးရာဟန်ပန်',
      en: 'Neat modern hairstyle with gold wrist ornament and warm engaging demeanor',
    },
    personaRole: {
      mm: 'တိကျပြတ်သားပြီး သဘာဝကျသော စကားပြောဟန်။ အင်တာဗျူးများ၊ သတင်းအချက်အလက်မျှဝေခြင်းနှင့် ဗဟုသုတအစီအစဉ်များအတွက် သင့်တော်သည်။',
      en: 'Inquisitive, casual, and clearly articulated young adult voice. Great for interviews, informative videos, and news.',
    },
    suitableProjects: {
      mm: ['အင်တာဗျူး', 'ဗဟုသုတအစီအစဉ်', 'သတင်းတို', 'ကြော်ငြာ'],
      en: ['Interviews', 'Informational Shows', 'Short News', 'Advertisements'],
    },
  },

  Aoede: {
    voiceName: 'Aoede',
    imagePath: CHARACTER_PORTRAITS.femaleGraceful,
    title: {
      mm: 'ဆွဲဆောင်မှုရှိသော သတင်းတင်ဆက်သူ',
      en: 'Engaging Broadcast Anchor',
    },
    attireCategory: {
      mm: 'ကျောက်စိမ်းရောင် ရင်စေ့ပိုးအင်္ကျီနှင့် ရွှေချည်ထိုးပဝါ၊ အချိတ်ထမီ',
      en: 'Jade-Emerald Silk Yinzi, Embroidered Pawa & Acheik Htamein',
    },
    upperAttire: {
      mm: 'ရွှေရောင်ကြယ်သီးတပ် ကျောက်စိမ်းစိမ်း ရင်စေ့ပိုးအင်္ကျီလက်ရှည်',
      en: 'Deep jade-emerald silk Yinzi jacket-blouse with antique gold clasp buttons',
    },
    lowerAttire: {
      mm: 'ရွှေချည်ရွှေနန်းဆင် မန္တလေးအချိတ် ပိုးထမီ',
      en: 'Patterned Mandalay Acheik silk Htamein with gold embroidery',
    },
    accessories: {
      mm: 'ပုခုံးထက်မှ ရွှေချည်ထိုးပဝါ၊ ရွှေဆံထိုးနှင့် ပုလဲနားကပ်',
      en: 'Gold-embroidered champagne Pawa shawl, antique gold hairpin, pearl drop earrings',
    },
    personaRole: {
      mm: 'ပေါ့ပါးလွတ်လပ်ပြီး နားထောင်သူကို ဆွဲဆောင်နိုင်သော ကျွမ်းကျင်အသံ။ ရုပ်သံသတင်း၊ အခမ်းအနားအစီအစဉ်များနှင့် ကြော်ငြာများအတွက် သင့်တော်သည်။',
      en: 'Breezy, engaging, and highly professional delivery. Superb for broadcast news, corporate hosting, and public announcements.',
    },
    suitableProjects: {
      mm: ['ရုပ်သံသတင်း', 'အခမ်းအနားတင်ဆက်မှု', 'စီးပွားရေးကြော်ငြာ', 'ကုမ္ပဏီမိတ်ဆက်'],
      en: ['Broadcast News', 'Live Hosting', 'Commercials', 'Corporate Videos'],
    },
  },

  Callirrhoe: {
    voiceName: 'Callirrhoe',
    imagePath: CHARACTER_PORTRAITS.femaleGraceful,
    title: {
      mm: 'ဖော်ရွေနွေးထွေးသော အစီအစဉ်မှူး',
      en: 'Warm Friendly Host',
    },
    attireCategory: {
      mm: 'ကျောက်စိမ်းရောင် ရင်စေ့ပိုးအင်္ကျီနှင့် ရွှေချည်ထိုးပဝါ၊ အချိတ်ထမီ',
      en: 'Jade-Emerald Silk Yinzi, Embroidered Pawa & Acheik Htamein',
    },
    upperAttire: {
      mm: 'ရွှေရောင်ကြယ်သီးတပ် ကျောက်စိမ်းစိမ်း ရင်စေ့ပိုးအင်္ကျီလက်ရှည်',
      en: 'Deep jade-emerald silk Yinzi jacket-blouse with antique gold clasp buttons',
    },
    lowerAttire: {
      mm: 'ရွှေချည်ရွှေနန်းဆင် မန္တလေးအချိတ် ပိုးထမီ',
      en: 'Patterned Mandalay Acheik silk Htamein with gold embroidery',
    },
    accessories: {
      mm: 'ပုခုံးထက်မှ ရွှေချည်ထိုးပဝါ၊ ရွှေဆံထိုးနှင့် ပုလဲနားကပ်',
      en: 'Gold-embroidered champagne Pawa shawl, antique gold hairpin, pearl drop earrings',
    },
    personaRole: {
      mm: 'သက်တောင့်သက်သာရှိပြီး ရင်းနှီးနွေးထွေးသော လေသံ။ ဖောက်သည်ဝန်ဆောင်မှု၊ လူနေမှုဘဝအစီအစဉ်များနှင့် စကားဝိုင်းများအတွက် သင့်တော်သည်။',
      en: 'Easy-going, warm, and highly relatable voice. Ideal for customer support IVR, lifestyle shows, and friendly chat apps.',
    },
    suitableProjects: {
      mm: ['ဖောက်သည်ဝန်ဆောင်မှု', 'လူနေမှုဘဝအစီအစဉ်', 'မိုဘိုင်းအက်ပ်အသံ', 'ဆွေးနွေးခန်း'],
      en: ['Customer Support IVR', 'Lifestyle Shows', 'Mobile App Voice', 'Talk Shows'],
    },
  },

  Autonoe: {
    voiceName: 'Autonoe',
    imagePath: CHARACTER_PORTRAITS.femaleGraceful,
    title: {
      mm: 'ကြည်လင်တောက်ပသော လမ်းညွှန်ပြောဆိုသူ',
      en: 'Articulate Cultural Guide',
    },
    attireCategory: {
      mm: 'ကျောက်စိမ်းရောင် ရင်စေ့ပိုးအင်္ကျီနှင့် ရွှေချည်ထိုးပဝါ၊ အချိတ်ထမီ',
      en: 'Jade-Emerald Silk Yinzi, Embroidered Pawa & Acheik Htamein',
    },
    upperAttire: {
      mm: 'ရွှေရောင်ကြယ်သီးတပ် ကျောက်စိမ်းစိမ်း ရင်စေ့ပိုးအင်္ကျီလက်ရှည်',
      en: 'Deep jade-emerald silk Yinzi jacket-blouse with antique gold clasp buttons',
    },
    lowerAttire: {
      mm: 'ရွှေချည်ရွှေနန်းဆင် မန္တလေးအချိတ် ပိုးထမီ',
      en: 'Patterned Mandalay Acheik silk Htamein with gold embroidery',
    },
    accessories: {
      mm: 'ပုခုံးထက်မှ ရွှေချည်ထိုးပဝါ၊ ရွှေဆံထိုးနှင့် ပုလဲနားကပ်',
      en: 'Gold-embroidered champagne Pawa shawl, antique gold hairpin, pearl drop earrings',
    },
    personaRole: {
      mm: 'ကြည်လင်တောက်ပပြီး အားပေးအားမြှောက်ပြုသော အသံ။ ပြတိုက်လမ်းညွှန်၊ ခရီးသွားအသံဖိုင်များနှင့် သင်ကြားရေးအတွက် သင့်တော်သည်။',
      en: 'Bright, encouraging, and clear voice. Superb for museum audio guides, tourist navigation, and inspirational lectures.',
    },
    suitableProjects: {
      mm: ['ပြတိုက်လမ်းညွှန်', 'ခရီးသွားအသံဖိုင်', 'သင်ကြားရေးအသံ', 'လှုံ့ဆော်မှုအစီအစဉ်'],
      en: ['Museum Audio Guides', 'Travel Audio', 'Educational Lectures', 'Motivational'],
    },
  },

  Enceladus: {
    voiceName: 'Enceladus',
    imagePath: CHARACTER_PORTRAITS.maleScholar,
    title: {
      mm: 'ခွန်အားနှင့် ယုံကြည်မှုပြည့်ဝသော လူငယ်ခေါင်းဆောင်',
      en: 'Confident Motivational Speaker',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ပိုးတိုက်ပုံနှင့် ရွှေချည်ထိုးအချိတ်ပုဆိုး',
      en: 'Heritage Silk Taikpon & Woven Acheik Paso',
    },
    upperAttire: {
      mm: 'ရွှေကြယ်သီးတပ် ရင်စေ့ရှပ်အင်္ကျီနှင့် ကျောက်စိမ်းရင့်ရောင် ပိုးတိုက်ပုံ',
      en: 'Dark emerald silk Taikpon jacket with warm-ivory collarless shirt',
    },
    lowerAttire: {
      mm: 'မန္တလေးအချိတ် ရွှေရောင်နှင့် အစိမ်းရောင်စပ် ပိုးပုဆိုး',
      en: 'Heritage Mandalay Acheik silk Paso with gold and green patterns',
    },
    accessories: {
      mm: 'ရွှေလက်စွပ်၊ သပ်ရပ်ကြည်လင်သော စကားပြောဟန်',
      en: 'Gold signet ring with composed, friendly, trustworthy expression',
    },
    personaRole: {
      mm: 'ခွန်အားပြည့်ဝပြီး ယုံကြည်စိတ်ချရသော အသံဩဇာ။ စိတ်ဓာတ်ခွန်အားဖြည့်စကားများ၊ စီးပွားရေးစီမံခန့်ခွဲမှုနှင့် ကြော်ငြာများအတွက် သင့်တော်သည်။',
      en: 'Energetic, confident, and warm male voice. Exceptional for leadership speeches, fitness audio, and business campaigns.',
    },
    suitableProjects: {
      mm: ['ခေါင်းဆောင်မှုသင်တန်း', 'စီးပွားရေးလှုံ့ဆော်မှု', 'အားကစားအစီအစဉ်', 'ကြော်ငြာ'],
      en: ['Leadership Training', 'Business Motivation', 'Fitness Coaching', 'Advertisements'],
    },
  },

  Iapetus: {
    voiceName: 'Iapetus',
    imagePath: CHARACTER_PORTRAITS.maleScholar,
    title: {
      mm: 'တည်ငြိမ်ရင့်ကျက်သော သတင်းတာဝန်ခံ',
      en: 'Resonant Professional Narrator',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ပိုးတိုက်ပုံနှင့် ရွှေချည်ထိုးအချိတ်ပုဆိုး',
      en: 'Heritage Silk Taikpon & Woven Acheik Paso',
    },
    upperAttire: {
      mm: 'ရွှေကြယ်သီးတပ် ရင်စေ့ရှပ်အင်္ကျီနှင့် ကျောက်စိမ်းရင့်ရောင် ပိုးတိုက်ပုံ',
      en: 'Tailored dark emerald silk Taikpon jacket with warm-ivory collarless shirt',
    },
    lowerAttire: {
      mm: 'မန္တလေးအချိတ် ရွှေရောင်နှင့် အစိမ်းရောင်စပ် ပိုးပုဆိုး',
      en: 'Heritage Mandalay Acheik silk Paso with gold and green patterns',
    },
    accessories: {
      mm: 'ရွှေလက်စွပ်၊ သပ်ရပ်ကြည်လင်သော စကားပြောဟန်',
      en: 'Gold signet ring with composed, friendly, trustworthy expression',
    },
    personaRole: {
      mm: 'ရှင်းလင်းပြတ်သားပြီး ယုံကြည်မှုအပြည့်ရှိသော အသံ။ သတင်းတင်ဆက်မှု၊ စီးပွားရေးရှင်းတမ်းများနှင့် စာပေအသံစာအုပ်များအတွက် သင့်တော်သည်။',
      en: 'Clear, resonant, and confident tone. Best for corporate annual reports, investigative journalism, and audiobooks.',
    },
    suitableProjects: {
      mm: ['သတင်းတင်ဆက်မှု', 'စီးပွားရေးရှင်းတမ်း', 'စာပေအသံစာအုပ်', 'မှတ်တမ်း'],
      en: ['Journalism', 'Corporate Reports', 'Audiobooks', 'Documentaries'],
    },
  },

  Umbriel: {
    voiceName: 'Umbriel',
    imagePath: CHARACTER_PORTRAITS.maleElder,
    title: {
      mm: 'ရင့်ကျက်လေးနက်သော ဝါရင့်အကြံပေး',
      en: 'Authoritative Senior Counselor',
    },
    attireCategory: {
      mm: 'မဟာဆန်သော ပိုးခေါင်းပေါင်း၊ ကတ္တီပါတိုက်ပုံနှင့် ရတနာအချိတ်ပုဆိုး',
      en: 'Regal Silk Gaung Baung, Velvet Taikpon & Royal Acheik Paso',
    },
    upperAttire: {
      mm: 'ရှန်ပိန်ရောင်ပိုးခေါင်းပေါင်း၊ အဖြူရောင်ရင်စေ့ရှပ်နှင့် သစ်တောစိမ်း ကတ္တီပါတိုက်ပုံ',
      en: 'Champagne-ivory silk Gaung Baung headwrap with deep forest-emerald velvet Taikpon',
    },
    lowerAttire: {
      mm: 'ရွှေချည်ထိုး ရှေးဟောင်းမန္တလေးအချိတ် ပိုးပုဆိုး',
      en: 'Ornate antique-gold and emerald Mandalay Acheik silk Paso',
    },
    accessories: {
      mm: 'ကျောက်မျက်လက်စွပ်၊ အစဉ်အလာ မြန်မာ့ရိုးရာခေါင်းပေါင်းစတိုင်',
      en: 'Gemstone signet ring and authoritative traditional Myanmar formal demeanor',
    },
    personaRole: {
      mm: 'သက်တောင့်သက်သာရှိပြီး အတွေ့အကြုံရင့်ကျက်သော အသံ။ အတွေးအမြင်ဆောင်းပါးများ၊ ဥပဒေနှင့် ငွေကြေးအကြံပေးချက်များအတွက် သင့်တော်သည်။',
      en: 'Resonant, composed, and trustworthy adult voice. Ideal for philosophical essays, legal overviews, and financial counsel.',
    },
    suitableProjects: {
      mm: ['အတွေးအမြင်ဆောင်းပါး', 'ငွေကြေးအကြံပေးချက်', 'အထ္ထုပ္ပတ္တိ', 'တရားဝင်အစီရင်ခံစာ'],
      en: ['Essays & Commentary', 'Financial Guidance', 'Biographies', 'Official Reports'],
    },
  },

  Algieba: {
    voiceName: 'Algieba',
    imagePath: CHARACTER_PORTRAITS.maleScholar,
    title: {
      mm: 'စိတ်အားထက်သန်သော စကားပြောပညာရှင်',
      en: 'Enthusiastic Articulate Orator',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ပိုးတိုက်ပုံနှင့် ရွှေချည်ထိုးအချိတ်ပုဆိုး',
      en: 'Heritage Silk Taikpon & Woven Acheik Paso',
    },
    upperAttire: {
      mm: 'ရွှေကြယ်သီးတပ် ရင်စေ့ရှပ်အင်္ကျီနှင့် ကျောက်စိမ်းရင့်ရောင် ပိုးတိုက်ပုံ',
      en: 'Tailored dark emerald silk Taikpon jacket with warm-ivory collarless shirt',
    },
    lowerAttire: {
      mm: 'မန္တလေးအချိတ် ရွှေရောင်နှင့် အစိမ်းရောင်စပ် ပိုးပုဆိုး',
      en: 'Heritage Mandalay Acheik silk Paso with gold and green patterns',
    },
    accessories: {
      mm: 'ရွှေလက်စွပ်၊ သပ်ရပ်ကြည်လင်သော စကားပြောဟန်',
      en: 'Gold signet ring with composed, friendly, trustworthy expression',
    },
    personaRole: {
      mm: 'ချောမွေ့နွေးထွေးပြီး စိတ်အားထက်သန်သော လေသံ။ ဟောပြောပွဲများ၊ စာပေဆွေးနွေးပွဲများနှင့် စိတ်လှုပ်ရှားဖွယ် ဇာတ်ကြောင်းများအတွက် သင့်တော်သည်။',
      en: 'Smooth, warm, and articulate oratorical voice. Great for public speaking, cultural panels, and passionate storytelling.',
    },
    suitableProjects: {
      mm: ['ဟောပြောပွဲ', 'စာပေဆွေးနွေးပွဲ', 'လှုံ့ဆော်မှုစကား', 'ဝတ္ထုဇာတ်ကြောင်း'],
      en: ['Keynote Addresses', 'Literary Panels', 'Inspirational Talks', 'Narrative Fiction'],
    },
  },

  Despina: {
    voiceName: 'Despina',
    imagePath: CHARACTER_PORTRAITS.femaleGraceful,
    title: {
      mm: 'နူးညံ့ချောမွေ့သော ညနေခင်းဇာတ်ကြောင်းသူ',
      en: 'Gentle Melodic Storyteller',
    },
    attireCategory: {
      mm: 'ကျောက်စိမ်းရောင် ရင်စေ့ပိုးအင်္ကျီနှင့် ရွှေချည်ထိုးပဝါ၊ အချိတ်ထမီ',
      en: 'Jade-Emerald Silk Yinzi, Embroidered Pawa & Acheik Htamein',
    },
    upperAttire: {
      mm: 'ရွှေရောင်ကြယ်သီးတပ် ကျောက်စိမ်းစိမ်း ရင်စေ့ပိုးအင်္ကျီလက်ရှည်',
      en: 'Deep jade-emerald silk Yinzi jacket-blouse with antique gold clasp buttons',
    },
    lowerAttire: {
      mm: 'ရွှေချည်ရွှေနန်းဆင် မန္တလေးအချိတ် ပိုးထမီ',
      en: 'Patterned Mandalay Acheik silk Htamein with gold embroidery',
    },
    accessories: {
      mm: 'ပုခုံးထက်မှ ရွှေချည်ထိုးပဝါ၊ ရွှေဆံထိုးနှင့် ပုလဲနားကပ်',
      en: 'Gold-embroidered champagne Pawa shawl, antique gold hairpin, pearl drop earrings',
    },
    personaRole: {
      mm: 'နူးညံ့ချောမွေ့ပြီး တက်ကြွနွေးထွေးသော အသံလေး။ အနုပညာအစီအစဉ်များ၊ သီချင်းမိတ်ဆက်နှင့် အပန်းဖြေဇာတ်လမ်းများအတွက် သင့်တော်သည်။',
      en: 'Gentle, melodious, and warmly engaging female voice. Suited for poetry, relaxing bedtime content, and musical introductions.',
    },
    suitableProjects: {
      mm: ['ကဗျာရွတ်ဆိုခြင်း', 'အပန်းဖြေဇာတ်လမ်း', 'အနုပညာမိတ်ဆက်', 'တေးဂီတအစီအစဉ်'],
      en: ['Poetry Recitals', 'Relaxation Stories', 'Art Features', 'Music Hosting'],
    },
  },

  Erinome: {
    voiceName: 'Erinome',
    imagePath: CHARACTER_PORTRAITS.femaleMature,
    title: {
      mm: 'ခန့်ညားထည်ဝါသော ယဉ်ကျေးမှုထိန်းသိမ်းသူ',
      en: 'Sophisticated Heritage Custodian',
    },
    attireCategory: {
      mm: 'မင်းခမ်းတော်ဝင် ပိုးဘရိုကိတ်အင်္ကျီနှင့် ရွှေချည်ထိုးအချိတ်ထမီ၊ ပဝါပါး',
      en: 'Royal Silk Brocade Eingyi, Gold Acheik Htamein & Golden Pawa',
    },
    upperAttire: {
      mm: 'ရွှေချည်ထိုး အနားကွပ်ပါ မြကျောက်ရောင် ပိုးဘရိုကိတ်အင်္ကျီ',
      en: 'Regal deep emerald-teal brocade Eingyi blouse with delicate gold embroidery',
    },
    lowerAttire: {
      mm: 'ရှေးမူမပျက် ရွှေချည်ထိုး မန္တလေးအချိတ် ပိုးထမီ',
      en: 'Antique gold and ivory silk Mandalay Acheik Htamein',
    },
    accessories: {
      mm: 'ရွှေဘီးကုတ်တော်ဝင်အဆင်တန်ဆာ၊ ပုလဲလည်ဆွဲနှင့် ပယင်းနားကပ်',
      en: 'Ornate gold comb hair ornament, classic pearl necklace, and translucent golden Pawa',
    },
    personaRole: {
      mm: 'ရှင်းလင်းတိကျပြီး ရင့်ကျက်တည်ငြိမ်သော မဟာဆန်သောအသံ။ နိုင်ငံတကာသံတမန်ရေးရာ၊ သမိုင်းဝင်စာပေနှင့် အဆင့်မြင့်ကြော်ငြာများအတွက် အထူးသင့်တော်သည်။',
      en: 'Confident, sophisticated, articulate female tone. Ideal for diplomatic addresses, luxury branding, and historical retrospectives.',
    },
    suitableProjects: {
      mm: ['သံတမန်အစီရင်ခံစာ', 'သမိုင်းဝင်စာပေ', 'အဆင့်မြင့်အမှတ်တံဆိပ်', 'ဂန္ထဝင်အသံစာအုပ်'],
      en: ['Diplomatic Reports', 'Historical Literature', 'Luxury Branding', 'Classic Audiobooks'],
    },
  },

  Algenib: {
    voiceName: 'Algenib',
    imagePath: CHARACTER_PORTRAITS.maleScholar,
    title: {
      mm: 'လေးနက်တည်ငြိမ်သော ပုံပြင်ဆရာ',
      en: 'Calm Resonant Storyteller',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ပိုးတိုက်ပုံနှင့် ရွှေချည်ထိုးအချိတ်ပုဆိုး',
      en: 'Heritage Silk Taikpon & Woven Acheik Paso',
    },
    upperAttire: {
      mm: 'ရွှေကြယ်သီးတပ် ရင်စေ့ရှပ်အင်္ကျီနှင့် ကျောက်စိမ်းရင့်ရောင် ပိုးတိုက်ပုံ',
      en: 'Tailored dark emerald silk Taikpon jacket with warm-ivory collarless shirt',
    },
    lowerAttire: {
      mm: 'မန္တလေးအချိတ် ရွှေရောင်နှင့် အစိမ်းရောင်စပ် ပိုးပုဆိုး',
      en: 'Heritage Mandalay Acheik silk Paso with gold and green patterns',
    },
    accessories: {
      mm: 'ရွှေလက်စွပ်၊ သပ်ရပ်ကြည်လင်သော စကားပြောဟန်',
      en: 'Gold signet ring with composed, friendly, trustworthy expression',
    },
    personaRole: {
      mm: 'အေးဆေးတည်ငြိမ်ပြီး အနည်းငယ်သြဇာပါသော ယောကျ်ားပီသသည့်အသံ။ ဝတ္ထုရှည်များ၊ စုံထောက်ဇာတ်လမ်းများနှင့် လျှို့ဝှက်ဆန်းကြယ်အစီအစဉ်များအတွက် သင့်တော်သည်။',
      en: 'Calm, smooth, slightly gravelly mid-30s male timbre. Great for mystery thrillers, investigative podcasts, and nighttime listening.',
    },
    suitableProjects: {
      mm: ['စုံထောက်ဇာတ်လမ်း', 'လျှို့ဝှက်ဆန်းကြယ်', 'ညဉ့်နက်အစီအစဉ်', 'အသံဇာတ်လမ်းတွဲ'],
      en: ['Detective Fiction', 'Mystery Podcasts', 'Late Night Audio', 'Audio Dramas'],
    },
  },

  Rasalgethi: {
    voiceName: 'Rasalgethi',
    imagePath: CHARACTER_PORTRAITS.maleYouthful,
    title: {
      mm: 'ဗဟုသုတကြွယ်ဝသော လူငယ်သုတေသီ',
      en: 'Knowledgeable Young Researcher',
    },
    attireCategory: {
      mm: 'ခေတ်ပေါ်ပင်နီအင်္ကျီနှင့် ရိုးရာတိုက်ပုံ၊ ပိုးပုဆိုး',
      en: 'Contemporary Pinni Shirt, Taikpon Jacket & Silk Paso',
    },
    upperAttire: {
      mm: 'လည်ထောင်ကော်လာပါ နို့နှစ်ရောင် ပင်နီအင်္ကျီနှင့် အစိမ်းရင့်ရောင် တိုက်ပုံ',
      en: 'Warm-ivory collarless Pinni shirt with forest-green Taikpon jacket',
    },
    lowerAttire: {
      mm: 'မြကျောက်ရောင်နှင့် ရွှေဝါရောင် အကွက်စိပ် ပိုးပုဆိုး',
      en: 'Silk Paso longyi in subtle jade and gold check pattern',
    },
    accessories: {
      mm: 'သပ်ရပ်သောဆံပင်ပုံစံ၊ ရွှေလက်ကောက်နှင့် ခေတ်မီရိုးရာဟန်ပန်',
      en: 'Neat modern hairstyle with gold wrist ornament and warm engaging demeanor',
    },
    personaRole: {
      mm: 'တက်ကြွရှင်းလင်းပြီး ဗဟုသုတမျှဝေရန် အသင့်ဖြစ်နေသော အသံ။ သိပ္ပံနည်းပညာ၊ သုတရသအစီအစဉ်များနှင့် ပညာရေးမိတ်ဆက်များအတွက် အထူးသင့်တော်သည်။',
      en: 'Informative, energetic, and articulate young adult delivery. Ideal for science podcasts, tech tutorials, and educational media.',
    },
    suitableProjects: {
      mm: ['သိပ္ပံနှင့်နည်းပညာ', 'ပညာပေးဗီဒီယို', 'သုတအစီအစဉ်', 'ရှင်းလင်းချက်'],
      en: ['Science & Tech', 'Educational Videos', 'Documentaries', 'Tutorials'],
    },
  },

  Laomedeia: {
    voiceName: 'Laomedeia',
    imagePath: CHARACTER_PORTRAITS.femaleBright,
    title: {
      mm: 'ရွှင်လန်းတက်ကြွသော အနုပညာရှင်',
      en: 'Upbeat Cheerful Artist',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ရင်ဖုံးဇာနှင့် လွန်းရာကျော်အချိတ်ထမီ',
      en: 'Traditional Lace Yinphone & Luntaya Acheik Htamein',
    },
    upperAttire: {
      mm: 'ရွှေရောင်ကြယ်သီးတပ် နို့နှစ်ရောင် ရင်ဖုံးဇာအင်္ကျီ',
      en: 'Warm-ivory lace Yinphone blouse with delicate gold buttons',
    },
    lowerAttire: {
      mm: 'မြကျောက်ရောင်နှင့် ရွှေချည်ထိုး မန္တလေးလွန်းရာကျော် အချိတ်ထမီ',
      en: 'Emerald green and gold woven Luntaya Acheik silk Htamein',
    },
    accessories: {
      mm: 'စပယ်ပန်းကုံးဆင် မြန်မာဆံထုံး၊ ရွှေဆွဲကြိုးနှင့် ပါးကွက်သနပ်ခါး',
      en: 'High Myanmar Hsatone bun with jasmine garland and golden Thanakha',
    },
    personaRole: {
      mm: 'ရွှင်လန်းတက်ကြွပြီး ခင်မင်ရင်းနှီးလွယ်သော အသံလေး။ မနက်ခင်းအစီအစဉ်များ၊ ဖျော်ဖြေရေးသတင်းများနှင့် အလှအပဗလော့ဂ်များအတွက် အထူးသင့်တော်သည်။',
      en: 'Upbeat, warm, and approachable young adult female voice. Superb for morning shows, entertainment news, and lifestyle vlogs.',
    },
    suitableProjects: {
      mm: ['မနက်ခင်းအစီအစဉ်', 'ဖျော်ဖြေရေးသတင်း', 'အလှအပဗလော့ဂ်', 'ပျော်စရာပုံပြင်'],
      en: ['Morning Shows', 'Entertainment News', 'Beauty Vlogs', 'Fun Tales'],
    },
  },

  Achernar: {
    voiceName: 'Achernar',
    imagePath: CHARACTER_PORTRAITS.femaleBright,
    title: {
      mm: 'နူးညံ့သိမ်မွေ့သော စိတ်ခွန်အားပေးသူ',
      en: 'Gentle Inspiring Mentor',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ရင်ဖုံးဇာနှင့် လွန်းရာကျော်အချိတ်ထမီ',
      en: 'Traditional Lace Yinphone & Luntaya Acheik Htamein',
    },
    upperAttire: {
      mm: 'ရွှေရောင်ကြယ်သီးတပ် နို့နှစ်ရောင် ရင်ဖုံးဇာအင်္ကျီ',
      en: 'Tailored warm-ivory lace Yinphone blouse with antique gold buttons',
    },
    lowerAttire: {
      mm: 'မြကျောက်ရောင်နှင့် ရွှေချည်ထိုး မန္တလေးလွန်းရာကျော် အချိတ်ထမီ',
      en: 'Emerald green and gold woven Luntaya Acheik silk Htamein',
    },
    accessories: {
      mm: 'စပယ်ပန်းကုံးဆင် မြန်မာဆံထုံး၊ ရွှေဆွဲကြိုးနှင့် ပါးကွက်သနပ်ခါး',
      en: 'High Myanmar Hsatone bun with jasmine garland and golden Thanakha',
    },
    personaRole: {
      mm: 'နူးညံ့သိမ်မွေ့ပြီး ဖိတ်ခေါ်နွေးထွေးသော အသံ။ စိတ်ဓာတ်ခွန်အားဖြည့်စကား၊ သဘာဝတရားခံစားချက်နှင့် တရားရှုမှတ်ခြင်းဆိုင်ရာ အသံလမ်းညွှန်များအတွက် သင့်တော်သည်။',
      en: 'Soft, inviting, professional, and optimistic tone. Perfect for mindfulness meditation, mental wellness audio, and gentle narration.',
    },
    suitableProjects: {
      mm: ['စိတ်ဓာတ်ခွန်အား', 'တရားရှုမှတ်ခြင်း', 'အေးချမ်းမှုအသံ', 'ကဗျာ'],
      en: ['Mindfulness', 'Meditation Guides', 'Wellness Audio', 'Poetry'],
    },
  },

  Alnilam: {
    voiceName: 'Alnilam',
    imagePath: CHARACTER_PORTRAITS.maleYouthful,
    title: {
      mm: 'ခိုင်မာပြတ်သားသော လူငယ်အစီအစဉ်မှူး',
      en: 'Firm Dynamic Presenter',
    },
    attireCategory: {
      mm: 'ခေတ်ပေါ်ပင်နီအင်္ကျီနှင့် ရိုးရာတိုက်ပုံ၊ ပိုးပုဆိုး',
      en: 'Contemporary Pinni Shirt, Taikpon Jacket & Silk Paso',
    },
    upperAttire: {
      mm: 'လည်ထောင်ကော်လာပါ နို့နှစ်ရောင် ပင်နီအင်္ကျီနှင့် အစိမ်းရင့်ရောင် တိုက်ပုံ',
      en: 'Warm-ivory collarless Pinni shirt with forest-green Taikpon jacket',
    },
    lowerAttire: {
      mm: 'မြကျောက်ရောင်နှင့် ရွှေဝါရောင် အကွက်စိပ် ပိုးပုဆိုး',
      en: 'Silk Paso longyi in subtle jade and gold check pattern',
    },
    accessories: {
      mm: 'သပ်ရပ်သောဆံပင်ပုံစံ၊ ရွှေလက်ကောက်နှင့် ခေတ်မီရိုးရာဟန်ပန်',
      en: 'Neat modern hairstyle with gold wrist ornament and warm engaging demeanor',
    },
    personaRole: {
      mm: 'ခိုင်မာပြတ်သားပြီး အကောင်းမြင်စိတ်ပြည့်ဝသော လေသံ။ အားကစားပွဲတင်ဆက်မှု၊ စီးပွားရေးပြိုင်ပွဲများနှင့် နည်းပညာကြော်ငြာများအတွက် သင့်တော်သည်။',
      en: 'Firm, energetic, and optimistic tone. Ideal for sports commentary, competitive debates, and tech launch videos.',
    },
    suitableProjects: {
      mm: ['အားကစားတင်ဆက်မှု', 'နည်းပညာမိတ်ဆက်', 'စီးပွားရေးပြိုင်ပွဲ', 'ကြော်ငြာ'],
      en: ['Sports Commentary', 'Tech Launches', 'Business Debates', 'Commercials'],
    },
  },

  Schedar: {
    voiceName: 'Schedar',
    imagePath: CHARACTER_PORTRAITS.maleYouthful,
    title: {
      mm: 'ပေါ့ပေါ့ပါးပါး ဖော်ရွေသော မိတ်ဆွေ',
      en: 'Casual Friendly Companion',
    },
    attireCategory: {
      mm: 'ခေတ်ပေါ်ပင်နီအင်္ကျီနှင့် ရိုးရာတိုက်ပုံ၊ ပိုးပုဆိုး',
      en: 'Contemporary Pinni Shirt, Taikpon Jacket & Silk Paso',
    },
    upperAttire: {
      mm: 'လည်ထောင်ကော်လာပါ နို့နှစ်ရောင် ပင်နီအင်္ကျီနှင့် အစိမ်းရင့်ရောင် တိုက်ပုံ',
      en: 'Warm-ivory collarless Pinni shirt with forest-green Taikpon jacket',
    },
    lowerAttire: {
      mm: 'မြကျောက်ရောင်နှင့် ရွှေဝါရောင် အကွက်စိပ် ပိုးပုဆိုး',
      en: 'Silk Paso longyi in subtle jade and gold check pattern',
    },
    accessories: {
      mm: 'သပ်ရပ်သောဆံပင်ပုံစံ၊ ရွှေလက်ကောက်နှင့် ခေတ်မီရိုးရာဟန်ပန်',
      en: 'Neat modern hairstyle with gold wrist ornament and warm engaging demeanor',
    },
    personaRole: {
      mm: 'ညီညာမျှတပြီး ပေါ့ပေါ့ပါးပါး ပြောဆိုတတ်သော အသံ။ အသံအကူလက်ထောက်၊ နေ့စဉ်စကားစမြည်နှင့် ခရီးသွားလမ်းညွှန်အတွက် သင့်တော်သည်။',
      en: 'Even, approachable, and casual tone. Perfect for virtual voice assistants, daily conversational dialogs, and navigation guides.',
    },
    suitableProjects: {
      mm: ['AI အသံအကူ', 'ခရီးသွားလမ်းညွှန်', 'နေ့စဉ်စကားဝိုင်း', 'အမေးအဖြေ'],
      en: ['Virtual Assistants', 'Navigation Guides', 'Casual Chat', 'Q&A Audio'],
    },
  },

  Gacrux: {
    voiceName: 'Gacrux',
    imagePath: CHARACTER_PORTRAITS.femaleMature,
    title: {
      mm: 'နွေးထွေးရင့်ကျက်သော ယဉ်ကျေးမှုဆရာမကြီး',
      en: 'Dignified Cultural Scholar',
    },
    attireCategory: {
      mm: 'မင်းခမ်းတော်ဝင် ပိုးဘရိုကိတ်အင်္ကျီနှင့် ရွှေချည်ထိုးအချိတ်ထမီ၊ ပဝါပါး',
      en: 'Royal Silk Brocade Eingyi, Gold Acheik Htamein & Golden Pawa',
    },
    upperAttire: {
      mm: 'ရွှေချည်ထိုး အနားကွပ်ပါ မြကျောက်ရောင် ပိုးဘရိုကိတ်အင်္ကျီ',
      en: 'Regal deep emerald-teal brocade Eingyi blouse with delicate gold embroidery',
    },
    lowerAttire: {
      mm: 'ရှေးမူမပျက် ရွှေချည်ထိုး မန္တလေးအချိတ် ပိုးထမီ',
      en: 'Antique gold and ivory silk Mandalay Acheik Htamein',
    },
    accessories: {
      mm: 'ရွှေဘီးကုတ်တော်ဝင်အဆင်တန်ဆာ၊ ပုလဲလည်ဆွဲနှင့် ပယင်းနားကပ်',
      en: 'Ornate gold comb hair ornament, classic pearl necklace, and translucent golden Pawa',
    },
    personaRole: {
      mm: 'နွေးထွေးရင့်ကျက်ပြီး ရှင်းလင်းပြတ်သားသော အသံဩဇာ။ မြန်မာ့ရိုးရာယဉ်ကျေးမှု ဇာတ်လမ်းများ၊ အထ္ထုပ္ပတ္တိများနှင့် ပညာပေးဆောင်းပါးများအတွက် အထူးသင့်တော်သည်။',
      en: 'Warm, mature, articulate, and deeply engaging delivery. Superb for cultural documentaries, biographical retrospectives, and classic narrations.',
    },
    suitableProjects: {
      mm: ['ယဉ်ကျေးမှုဇာတ်လမ်း', 'အထ္ထုပ္ပတ္တိ', 'ပညာပေးဆောင်းပါး', 'ရိုးရာစာပေ'],
      en: ['Cultural History', 'Biographies', 'Educational Articles', 'Classical Literature'],
    },
  },

  Pulcherrima: {
    voiceName: 'Pulcherrima',
    imagePath: CHARACTER_PORTRAITS.maleYouthful,
    title: {
      mm: 'တက်ကြွနုပျိုသော ကလေးပုံပြင်ဖတ်သူ',
      en: 'Lively Youth Storyteller',
    },
    attireCategory: {
      mm: 'ခေတ်ပေါ်ပင်နီအင်္ကျီနှင့် ရိုးရာတိုက်ပုံ၊ ပိုးပုဆိုး',
      en: 'Contemporary Pinni Shirt, Taikpon Jacket & Silk Paso',
    },
    upperAttire: {
      mm: 'လည်ထောင်ကော်လာပါ နို့နှစ်ရောင် ပင်နီအင်္ကျီနှင့် အစိမ်းရင့်ရောင် တိုက်ပုံ',
      en: 'Warm-ivory collarless Pinni shirt with forest-green Taikpon jacket',
    },
    lowerAttire: {
      mm: 'မြကျောက်ရောင်နှင့် ရွှေဝါရောင် အကွက်စိပ် ပိုးပုဆိုး',
      en: 'Silk Paso longyi in subtle jade and gold check pattern',
    },
    accessories: {
      mm: 'သပ်ရပ်သောဆံပင်ပုံစံ၊ ရွှေလက်ကောက်နှင့် ခေတ်မီရိုးရာဟန်ပန်',
      en: 'Neat modern hairstyle with gold wrist ornament and warm engaging demeanor',
    },
    personaRole: {
      mm: 'တက်ကြွနုပျိုပြီး ဖိတ်ခေါ်နွေးထွေးသော အသံ။ ကာတွန်းဇာတ်လမ်းများ၊ ဂိမ်းအသံများနှင့် လူငယ်ကြော်ငြာများအတွက် သင့်တော်သည်။',
      en: 'Energetic, youthful, optimistic, and clear tone. Excellent for comic audiobooks, gaming characters, and youth commercials.',
    },
    suitableProjects: {
      mm: ['ကာတွန်းဇာတ်လမ်း', 'ဂိမ်းအသံ', 'လူငယ်ကြော်ငြာ', 'ပုံပြင်ဖတ်ခြင်း'],
      en: ['Comic Dramas', 'Game Voiceover', 'Youth Commercials', 'Storytime'],
    },
  },

  Achird: {
    voiceName: 'Achird',
    imagePath: CHARACTER_PORTRAITS.maleScholar,
    title: {
      mm: 'စိတ်ချယုံကြည်ရသော ဝါရင့်မိတ်ဆွေ',
      en: 'Trustworthy Mid-Career Professional',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ပိုးတိုက်ပုံနှင့် ရွှေချည်ထိုးအချိတ်ပုဆိုး',
      en: 'Heritage Silk Taikpon & Woven Acheik Paso',
    },
    upperAttire: {
      mm: 'ရွှေကြယ်သီးတပ် ရင်စေ့ရှပ်အင်္ကျီနှင့် ကျောက်စိမ်းရင့်ရောင် ပိုးတိုက်ပုံ',
      en: 'Tailored dark emerald silk Taikpon jacket with warm-ivory collarless shirt',
    },
    lowerAttire: {
      mm: 'မန္တလေးအချိတ် ရွှေရောင်နှင့် အစိမ်းရောင်စပ် ပိုးပုဆိုး',
      en: 'Heritage Mandalay Acheik silk Paso with gold and green patterns',
    },
    accessories: {
      mm: 'ရွှေလက်စွပ်၊ သပ်ရပ်ကြည်လင်သော စကားပြောဟန်',
      en: 'Gold signet ring with composed, friendly, trustworthy expression',
    },
    personaRole: {
      mm: 'ဖော်ရွေနွေးထွေးပြီး အလုပ်အကိုင်ပိုင်းဆိုင်ရာ တိကျခိုင်မာသော အသံ။ လုပ်ငန်းခွင်သင်တန်းများ၊ စီးပွားရေးဆွေးနွေးချက်များနှင့် အသံလမ်းညွှန်များအတွက် သင့်တော်သည်။',
      en: 'Warm, professional, articulate mid-30s voice. Best for corporate workplace training, business consulting, and narrative guides.',
    },
    suitableProjects: {
      mm: ['လုပ်ငန်းခွင်သင်တန်း', 'စီးပွားရေးဆွေးနွေးချက်', 'အသံလမ်းညွှန်', 'မှတ်တမ်း'],
      en: ['Corporate Training', 'Business Panels', 'Audio Guides', 'Documentaries'],
    },
  },

  Zubenelgenubi: {
    voiceName: 'Zubenelgenubi',
    imagePath: CHARACTER_PORTRAITS.maleElder,
    title: {
      mm: 'ဩဇာညောင်းသော ရိုးရာစာဆိုပညာရှင်',
      en: 'Authoritative Classical Bard',
    },
    attireCategory: {
      mm: 'မဟာဆန်သော ပိုးခေါင်းပေါင်း၊ ကတ္တီပါတိုက်ပုံနှင့် ရတနာအချိတ်ပုဆိုး',
      en: 'Regal Silk Gaung Baung, Velvet Taikpon & Royal Acheik Paso',
    },
    upperAttire: {
      mm: 'ရှန်ပိန်ရောင်ပိုးခေါင်းပေါင်း၊ အဖြူရောင်ရင်စေ့ရှပ်နှင့် သစ်တောစိမ်း ကတ္တီပါတိုက်ပုံ',
      en: 'Champagne-ivory silk Gaung Baung headwrap with deep forest-emerald velvet Taikpon',
    },
    lowerAttire: {
      mm: 'ရွှေချည်ထိုး ရှေးဟောင်းမန္တလေးအချိတ် ပိုးပုဆိုး',
      en: 'Ornate antique-gold and emerald Mandalay Acheik silk Paso',
    },
    accessories: {
      mm: 'ကျောက်မျက်လက်စွပ်၊ အစဉ်အလာ မြန်မာ့ရိုးရာခေါင်းပေါင်းစတိုင်',
      en: 'Gemstone signet ring and authoritative traditional Myanmar formal demeanor',
    },
    personaRole: {
      mm: 'အလွန်နက်ရှိုင်းပြီး ခန့်ညားတည်ကြည်သော အသံဩဇာ။ မြန်မာရာဇဝင်ဇာတ်လမ်းများ၊ တရားဓမ္မဆိုင်ရာ အကြောင်းအရာများနှင့် ရုပ်ရှင်ဇာတ်ကားကြီးများ၏ အဖွင့်ဇာတ်ကြောင်းအတွက် သင့်တော်သည်။',
      en: 'Deep, resonant, sophisticated, and authoritative low-pitch voice. Ideal for historical epics, philosophical discourses, and cinematic trailers.',
    },
    suitableProjects: {
      mm: ['ရာဇဝင်ဇာတ်လမ်းကြီးများ', 'ရုပ်ရှင်အဖွင့်ဇာတ်ကြောင်း', 'တရားဓမ္မအစီအစဉ်', 'ကဗျာလင်္ကာ'],
      en: ['Historical Epics', 'Cinematic Trailers', 'Philosophical Discourses', 'Epic Poetry'],
    },
  },

  Vindemiatrix: {
    voiceName: 'Vindemiatrix',
    imagePath: CHARACTER_PORTRAITS.femaleGraceful,
    title: {
      mm: 'ချိုသာညင်သာသော အိပ်ရာဝင်ပုံပြင်ဆရာမ',
      en: 'Soothing Bedtime Storyteller',
    },
    attireCategory: {
      mm: 'ကျောက်စိမ်းရောင် ရင်စေ့ပိုးအင်္ကျီနှင့် ရွှေချည်ထိုးပဝါ၊ အချိတ်ထမီ',
      en: 'Jade-Emerald Silk Yinzi, Embroidered Pawa & Acheik Htamein',
    },
    upperAttire: {
      mm: 'ရွှေရောင်ကြယ်သီးတပ် ကျောက်စိမ်းစိမ်း ရင်စေ့ပိုးအင်္ကျီလက်ရှည်',
      en: 'Deep jade-emerald silk Yinzi jacket-blouse with antique gold clasp buttons',
    },
    lowerAttire: {
      mm: 'ရွှေချည်ရွှေနန်းဆင် မန္တလေးအချိတ် ပိုးထမီ',
      en: 'Patterned Mandalay Acheik silk Htamein with gold embroidery',
    },
    accessories: {
      mm: 'ပုခုံးထက်မှ ရွှေချည်ထိုးပဝါ၊ ရွှေဆံထိုးနှင့် ပုလဲနားကပ်',
      en: 'Gold-embroidered champagne Pawa shawl, antique gold hairpin, pearl drop earrings',
    },
    personaRole: {
      mm: 'ညင်သာနူးညံ့ပြီး စိတ်အေးချမ်းသာဖွယ် အသံ။ အိပ်ရာဝင်ပုံပြင်များ၊ စိတ်အပန်းဖြေတေးသံများနှင့် သဘာဝတရားခံစားချက်များအတွက် သင့်တော်သည်။',
      en: 'Gentle, soothing, and smooth female delivery. Perfect for sleep stories, relaxation apps, and ambient audio narration.',
    },
    suitableProjects: {
      mm: ['အိပ်ရာဝင်ပုံပြင်', 'စိတ်အပန်းဖြေခြင်း', 'ကဗျာရွတ်ဆိုခြင်း', 'ကလေးချော့တေး'],
      en: ['Bedtime Stories', 'Sleep & Relaxation', 'Poetry', 'Lullabies'],
    },
  },

  Sadachbia: {
    voiceName: 'Sadachbia',
    imagePath: CHARACTER_PORTRAITS.maleScholar,
    title: {
      mm: 'သက်ဝင်လှုပ်ရှားသော အားကစားနှင့် ပွဲကြေညာသူ',
      en: 'Lively Event Announcer',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ပိုးတိုက်ပုံနှင့် ရွှေချည်ထိုးအချိတ်ပုဆိုး',
      en: 'Heritage Silk Taikpon & Woven Acheik Paso',
    },
    upperAttire: {
      mm: 'ရွှေကြယ်သီးတပ် ရင်စေ့ရှပ်အင်္ကျီနှင့် ကျောက်စိမ်းရင့်ရောင် ပိုးတိုက်ပုံ',
      en: 'Tailored dark emerald silk Taikpon jacket with warm-ivory collarless shirt',
    },
    lowerAttire: {
      mm: 'မန္တလေးအချိတ် ရွှေရောင်နှင့် အစိမ်းရောင်စပ် ပိုးပုဆိုး',
      en: 'Heritage Mandalay Acheik silk Paso with gold and green patterns',
    },
    accessories: {
      mm: 'ရွှေလက်စွပ်၊ သပ်ရပ်ကြည်လင်သော စကားပြောဟန်',
      en: 'Gold signet ring with composed, friendly, trustworthy expression',
    },
    personaRole: {
      mm: 'သက်ဝင်လှုပ်ရှားပြီး ကြည်လင်တိကျသော အသံဩဇာ။ တိုက်ရိုက်ပွဲကြေညာချက်များ၊ စိတ်လှုပ်ရှားဖွယ် အစီအစဉ်များနှင့် စတိတ်စင်တင်ဆက်မှုများအတွက် သင့်တော်သည်။',
      en: 'Lively, resonant, and articulate male tone. Excellent for live events, sportscasting, and dynamic stage announcements.',
    },
    suitableProjects: {
      mm: ['အားကစားပွဲကြေညာ', 'တိုက်ရိုက်ထုတ်လွှင့်မှု', 'စိတ်လှုပ်ရှားဖွယ်ကြော်ငြာ', 'စတိတ်စင်အစီအစဉ်'],
      en: ['Live Sportscasting', 'Broadcast Commentary', 'Event Announcements', 'Promos'],
    },
  },

  Sadaltager: {
    voiceName: 'Sadaltager',
    imagePath: CHARACTER_PORTRAITS.maleScholar,
    title: {
      mm: 'ဗဟုသုတပြည့်ဝသော သုတေသီပညာရှင်',
      en: 'Calm Scientific Educator',
    },
    attireCategory: {
      mm: 'မြန်မာ့ရိုးရာ ပိုးတိုက်ပုံနှင့် ရွှေချည်ထိုးအချိတ်ပုဆိုး',
      en: 'Heritage Silk Taikpon & Woven Acheik Paso',
    },
    upperAttire: {
      mm: 'ရွှေကြယ်သီးတပ် ရင်စေ့ရှပ်အင်္ကျီနှင့် ကျောက်စိမ်းရင့်ရောင် ပိုးတိုက်ပုံ',
      en: 'Tailored dark emerald silk Taikpon jacket with warm-ivory collarless shirt',
    },
    lowerAttire: {
      mm: 'မန္တလေးအချိတ် ရွှေရောင်နှင့် အစိမ်းရောင်စပ် ပိုးပုဆိုး',
      en: 'Heritage Mandalay Acheik silk Paso with gold and green patterns',
    },
    accessories: {
      mm: 'ရွှေလက်စွပ်၊ သပ်ရပ်ကြည်လင်သော စကားပြောဟန်',
      en: 'Gold signet ring with composed, friendly, trustworthy expression',
    },
    personaRole: {
      mm: 'ဗဟုသုတပြည့်စုံပြီး အေးဆေးတည်ငြိမ်သော အသံ။ သိပ္ပံနည်းပညာ၊ သဘာဝပတ်ဝန်းကျင်နှင့် အထူးပြုသုတေသနရှင်းလင်းချက်များအတွက် အထူးသင့်တော်သည်။',
      en: 'Knowledgeable, calm, and approachable tone. Superb for science tutorials, documentary research, and academic presentations.',
    },
    suitableProjects: {
      mm: ['သိပ္ပံနှင့်သဘာဝ', 'တက္ကသိုလ်သင်ခန်းစာ', 'သုတေသနရှင်းလင်းချက်', 'မှတ်တမ်းဗီဒီယို'],
      en: ['Science & Nature', 'University Lectures', 'Research Summaries', 'Documentary Films'],
    },
  },

  Sulafat: {
    voiceName: 'Sulafat',
    imagePath: CHARACTER_PORTRAITS.femaleMature,
    title: {
      mm: 'နွေးထွေးပျူငှာသော ဧည့်ခံတင်ဆက်သူ',
      en: 'Warm Gracious Ambassador',
    },
    attireCategory: {
      mm: 'မင်းခမ်းတော်ဝင် ပိုးဘရိုကိတ်အင်္ကျီနှင့် ရွှေချည်ထိုးအချိတ်ထမီ၊ ပဝါပါး',
      en: 'Royal Silk Brocade Eingyi, Gold Acheik Htamein & Golden Pawa',
    },
    upperAttire: {
      mm: 'ရွှေချည်ထိုး အနားကွပ်ပါ မြကျောက်ရောင် ပိုးဘရိုကိတ်အင်္ကျီ',
      en: 'Regal deep emerald-teal brocade Eingyi blouse with delicate gold embroidery',
    },
    lowerAttire: {
      mm: 'ရှေးမူမပျက် ရွှေချည်ထိုး မန္တလေးအချိတ် ပိုးထမီ',
      en: 'Antique gold and ivory silk Mandalay Acheik Htamein',
    },
    accessories: {
      mm: 'ရွှေဘီးကုတ်တော်ဝင်အဆင်တန်ဆာ၊ ပုလဲလည်ဆွဲနှင့် ပယင်းနားကပ်',
      en: 'Ornate gold comb hair ornament, classic pearl necklace, and translucent golden Pawa',
    },
    personaRole: {
      mm: 'နွေးထွေးပျူငှာပြီး စိတ်အားထက်သန်သော တော်ဝင်အသံ။ ဟိုတယ်နှင့် ခရီးသွားလုပ်ငန်း၊ ယဉ်ကျေးမှုပွဲတော်များနှင့် ဂုဏ်ပြုနှုတ်ခွန်းဆက်စကားများအတွက် အကောင်းဆုံးဖြစ်သည်။',
      en: 'Warm, gracious, and enthusiastic tone. Premier choice for hospitality, luxury tourism, festival announcements, and welcoming addresses.',
    },
    suitableProjects: {
      mm: ['ဟိုတယ်နှင့်ခရီးသွား', 'ရိုးရာပွဲတော်', 'ဂုဏ်ပြုနှုတ်ခွန်းဆက်', 'အဆင့်မြင့်ဝန်ဆောင်မှု'],
      en: ['Hospitality & Tourism', 'Cultural Festivals', 'Welcome Addresses', 'Luxury Concierge'],
    },
  },
};

export function getCharacterAttireProfile(voiceName: string): CharacterAttireProfile {
  return CHARACTER_ATTIRE_PROFILES[voiceName] || CHARACTER_ATTIRE_PROFILES.Zephyr;
}
