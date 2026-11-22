/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { Voice } from './types';
import { getCharacterAttireProfile } from './characterProfiles';

// Raw data from the user request
const rawData = [
    {
      "name": "Zephyr",
      "pitch": "Higher",
      "characteristics": ["Bright"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Zephyr.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/l8ohk0ehyuwd",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium-High",
        "characteristics": ["Enthusiastic", "Young Adult", "Clear Articulation", "Upbeat", "General American Accent"]
      }
    },
    {
      "name": "Puck",
      "pitch": "Middle",
      "characteristics": ["Upbeat"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Puck.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/pjb8nmxvv87i",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium",
        "characteristics": ["Young Adult", "Casual", "Energetic", "Approachable", "American Accent"]
      }
    },
    {
      "name": "Charon",
      "pitch": "Lower",
      "characteristics": ["Informative"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Charon.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/eht4pbht6w16",
      "analysis": {
        "gender": "Male",
        "pitch": "Low",
        "characteristics": ["Deep", "American accent", "Calm", "Resonant", "Professional"]
      }
    },
    {
      "name": "Kore",
      "pitch": "Middle",
      "characteristics": ["Firm"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Kore.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/5gsff9mzdklz",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium-High",
        "characteristics": ["Enthusiastic", "Bright", "Young Adult", "Clear", "Optimistic"]
      }
    },
    {
      "name": "Fenrir",
      "pitch": "Lower middle",
      "characteristics": ["Excitable"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Fenrir.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/kbtpe6yz1777",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-Low",
        "characteristics": ["Warm", "Inquisitive", "Clear articulation", "Mid-30s", "Friendly"]
      }
    },
    {
      "name": "Leda",
      "pitch": "Higher",
      "characteristics": ["Youthful"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Leda.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/brhw8ewgkz3q",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium-High",
        "characteristics": ["Youthful", "Inquisitive", "Bright", "Articulate", "Energetic"]
      }
    },
    {
      "name": "Orus",
      "pitch": "Lower middle",
      "characteristics": ["Firm"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Orus.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/lyp5xb51dqrp",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-Low",
        "characteristics": ["Inquisitive", "Casual", "Clear articulation", "American accent", "Young adult"]
      }
    },
    {
      "name": "Aoede",
      "pitch": "Middle",
      "characteristics": ["Breezy"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Aoede.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/0g78kvx54r5y",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium-High",
        "characteristics": ["Inquisitive", "Professional", "Clear articulation", "Engaging", "Optimistic"]
      }
    },
    {
      "name": "Callirrhoe",
      "pitch": "Middle",
      "characteristics": ["Easy-going"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Callirrhoe.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/z4d483ugdfl3",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium-High",
        "characteristics": ["Friendly", "Professional", "Inquisitive", "Clear", "Engaging"]
      }
    },
    {
      "name": "Autonoe",
      "pitch": "Middle",
      "characteristics": ["Bright"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Autonoe.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/6p49p29lx87v",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium-High",
        "characteristics": ["Warm", "Inquisitive", "Articulate", "Professional", "Encouraging"]
      }
    },
    {
      "name": "Enceladus",
      "pitch": "Lower",
      "characteristics": ["Breathy"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Enceladus.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/idr4pg60rus1",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-Low",
        "characteristics": ["Energetic", "Confident", "Warm", "Motivating", "Clear"]
      }
    },
    {
      "name": "Iapetus",
      "pitch": "Lower middle",
      "characteristics": ["Clear"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Iapetus.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/9dbnvhqx1pm6",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-Low",
        "characteristics": ["Confident", "Professional", "American Accent", "Inviting", "Resonant"]
      }
    },
    {
      "name": "Umbriel",
      "pitch": "Lower middle",
      "characteristics": ["Easy-going"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Umbriel.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/m503ad9dvwdr",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-Low",
        "characteristics": ["Resonant", "Inquisitive", "Confident", "Clear Articulation", "Adult (30s-40s)"]
      }
    },
    {
      "name": "Algieba",
      "pitch": "Lower",
      "characteristics": ["Smooth"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Algieba.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/wukcuqg2ht20",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-Low",
        "characteristics": ["Enthusiastic", "Warm", "Articulate", "Confident", "General American Accent"]
      }
    },
    {
      "name": "Despina",
      "pitch": "Middle",
      "characteristics": ["Smooth"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Despina.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/cwkb7of0eo8k",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium-High",
        "characteristics": ["Energetic", "Inquisitive", "Warm", "Clear", "Young Adult"]
      }
    },
    {
      "name": "Erinome",
      "pitch": "Middle",
      "characteristics": ["Clear"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Erinome.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/5d33lah5mgyn",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium",
        "characteristics": ["Confident", "Inquisitive", "Professional", "Articulate", "Sophisticated"]
      }
    },
    {
      "name": "Algenib",
      "pitch": "Lower",
      "characteristics": ["Gravelly"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Algenib.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/gtoedjsrfdyv",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-Low",
        "characteristics": ["Mid-30s", "Inquisitive", "Smooth", "Calm", "General American Accent"]
      }
    },
    {
      "name": "Rasalgethi",
      "pitch": "Middle",
      "characteristics": ["Informative"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Rasalgethi.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/g2sakseigjxf",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-High",
        "characteristics": ["Young Adult", "Energetic", "Inquisitive", "Clear Articulation", "General American Accent"]
      }
    },
    {
      "name": "Laomedeia",
      "pitch": "Higher",
      "characteristics": ["Upbeat"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Laomedeia.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/rf0bd4ccuwe5",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium-High",
        "characteristics": ["Young Adult", "Inquisitive", "Warm", "Clear", "Approachable"]
      }
    },
    {
      "name": "Achernar",
      "pitch": "Higher",
      "characteristics": ["Soft"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Achernar.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/si9idhunuhl7",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium-High",
        "characteristics": ["Warm", "Inviting", "Professional", "Clear", "Optimistic"]
      }
    },
    {
      "name": "Alnilam",
      "pitch": "Lower middle",
      "characteristics": ["Firm"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Alnilam.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/v1jxtnndr4a8",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-High",
        "characteristics": ["Young Adult", "Energetic", "Optimistic", "Clear Articulation", "American Accent"]
      }
    },
    {
      "name": "Schedar",
      "pitch": "Lower middle",
      "characteristics": ["Even"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Schedar.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/k80e0tzz69bm",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium",
        "characteristics": ["Young Adult", "Energetic", "Casual", "American Accent", "Approachable"]
      }
    },
    {
      "name": "Gacrux",
      "pitch": "Middle",
      "characteristics": ["Mature"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Gacrux.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/y27p0f291okv",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium",
        "characteristics": ["Warm", "Inquisitive", "Clear articulation", "Engaging", "Young adult"]
      }
    },
    {
      "name": "Pulcherrima",
      "pitch": "Middle",
      "characteristics": ["Forward"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Pulcherrima.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/90hmlsqpuflo",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-High",
        "characteristics": ["Energetic", "Youthful", "Optimistic", "Clear", "Inviting"]
      }
    },
    {
      "name": "Achird",
      "pitch": "Lower middle",
      "characteristics": ["Friendly"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Achird.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/xowubdv0dj6l",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-Low",
        "characteristics": ["Warm", "Inquisitive", "Professional", "Articulate", "Mid-30s"]
      }
    },
    {
      "name": "Zubenelgenubi",
      "pitch": "Lower middle",
      "characteristics": ["Casual"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Zubenelgenubi.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/doh1fjcgze3d",
      "analysis": {
        "gender": "Male",
        "pitch": "Low",
        "characteristics": ["deep", "resonant", "sophisticated", "confident", "articulate"]
      }
    },
    {
      "name": "Vindemiatrix",
      "pitch": "Middle",
      "characteristics": ["Gentle"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Vindemiatrix.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/61crfv4pato0",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium-High",
        "characteristics": ["Young adult", "Warm", "Inquisitive", "Clear enunciation", "Smooth"]
      }
    },
    {
      "name": "Sadachbia",
      "pitch": "Lower",
      "characteristics": ["Lively"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Sadachbia.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/5e3wo1zq9wqy",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-Low",
        "characteristics": ["Resonant", "Inquisitive", "Professional", "Clear articulation", "American accent"]
      }
    },
    {
      "name": "Sadaltager",
      "pitch": "Middle",
      "characteristics": ["Knowledgeable"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Sadaltager.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/nqounelpnqsk",
      "analysis": {
        "gender": "Male",
        "pitch": "Medium-Low",
        "characteristics": ["Professional", "Inquisitive", "Articulate", "Approachable", "Calm"]
      }
    },
    {
      "name": "Sulafat",
      "pitch": "Middle",
      "characteristics": ["Warm"],
      "audioSampleUrl": "https://gstatic.com/aistudio/voices/samples/Sulafat.wav",
      "fileUri": "https://generativelanguage.googleapis.com/v1beta/files/2y1in981v1rz",
      "analysis": {
        "gender": "Female",
        "pitch": "Medium-High",
        "characteristics": ["Warm", "Enthusiastic", "Clear articulation", "Young adult", "Professional"]
      }
    }
  ];

// Enhance data with 3D realistic character profiles in authentic Myanmar traditional attire
export const VOICE_DATA: Voice[] = rawData.map((voice) => {
  const profile = getCharacterAttireProfile(voice.name);
  return {
    ...voice,
    imageUrl: profile.imagePath,
    characterProfile: profile,
  };
});