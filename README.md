﻿# mmnext-voice-studio

Voice library web application — Google Sign-In, AI voice casting via Gemini, real-time audio visualization, Burmese character name mapping, and Firebase-powered cloud sync for favorites and casting history.

## Features (ချက်)

- **Google Sign-In** auth မှိုလွင်ကွေးရန်
- Voice selection နှင့် customization
- Real-time audio visualization (wave, bars, mirror variant)
- Burmese character name mapping (မြန်မာဘာအမဝ် Mapping)
- Casting history နှင့် favorites
- Dark mode support
- English / Myanmar i18n language switching
- Pitch detection
- Firestore security rules (owner isolation, email verification gate)

## Tech Stack (ဘာသာပြန်)

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + TypeScript |
| Backend | Express (server.ts) |
| Database/Auth | Firebase Auth & Firestore |
| AI | Gemini AI (via genai proxy) |
| Styling | Tailwind CSS + Lucide React + Framer Motion |
| Audio | Web Audio API (pitch detection, visualizer) |
| Charts | Recharts |
| Build | esbuild, tsx |

## Project Structure

mmnext-voice-studio/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── server.ts                 # Express backend + AI proxy routes
├── firebase.ts               # Firebase init, Auth, Firestore helpers
├── firebase-applet-config.json
├── firestore.rules           # Firestore security rules
├── firestore.rules.test.ts   # Security rules tests
├── genaiProxy.ts             # Gemini AI proxy client
├── types.ts                  # TypeScript interfaces
├── burmeseNames.ts           # Burmese character name mapping logic
├── burmeseSamples.ts         # Burmese script samples
├── constants.ts              # Limits and ID patterns
├── i18n.tsx                  # English/Myanmar i18n
├── index.css                 # Global styles (dark mode support)
├── index.html
├── index.tsx                 # Entry point
├── App.tsx                   # Root app component
├── declarations.d.ts
├── public/
│   └── favicon.ico
├── utils/
│   └── pitchDetection.ts     # Pitch detection utility
└── components/
    ├── AiResultCard.tsx
    ├── AiTtsPreview.tsx
    ├── ApiKeyModal.tsx
    ├── AudioVisualizer.tsx
    ├── AudioVisualizerBar.tsx
    ├── Carousel3D.tsx
    ├── CompareView.tsx
    ├── ControlBar.tsx
    ├── FavoritesDrawer.tsx
    ├── FilterBar.tsx
    ├── FirebaseErrorBoundary.tsx
    ├── FirebaseProvider.tsx
    ├── GridView.tsx
    ├── LoginModal.tsx
    ├── MobileSidebar.tsx
    ├── PitchDistributionModal.tsx
    ├── PitchFrequencyPanel.tsx
    ├── PitchRangeFilter.tsx
    ├── ShareVoiceModal.tsx
    ├── TtsScriptBar.tsx
    ├── VoiceCard.tsx
    └── VoiceFinder.tsx

## Installation

### 1. Repository ကိုကို clone လုပ်ပါ

```bash
git clone https://github.com/thihakyaw-leo/mmnext-voice-studio.git
cd mmnext-voice-studio
```

### 2. Dependencies install လုပ်ပါ

```bash
pnpm install
```

### 3. Firebase Configuration

`firebase-applet-config.json` ဖိုင်မှာ Firebase project config တွေကို စက်ထက်ပ/config/ ချိန်ပေးချೆင်:

- apiKey
- authDomain
- projectId
- firestoreDatabaseId
- storageBucket
- messagingSenderId
- appId
- measurementId

.env example ဖိုင်ကိုပြီး .env file ရေးနိုင်ပါ environment variable ချိန်ပေးချೆင်:

```bash
cp .env.example .env
```

.env ဖိုင်နဲ့ MY_GEMINI_API_KEY replace လုပ်ပါ:

```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 4. Development Server

```bash
pnpm dev
```

Server runs on http://localhost:5173

### 5. Production Build

```bash
pnpm build
```

Build creates dist folder and server.cjs:

```bash
pnpm start
```

## Firebase Security Rules

Firestore Security Rules (မြန်မာဘာအချက်):

firestore.rules ဖိုင်မှာ Firestore security rules v2 ရေးထားပါ:

- **Owner isolation** — /users/{userId} owner-only read/write access
- **Email verification gate** — verified email users only require auth
- **Path/payload sync** — favorites/customNames voiceName field must match path parameter
- **Immutable fields** — userId, createdAt cannot be updated
- **Timestamp enforcement** — createdAt, updatedAt must be set to request.time
- **Ghost field prevention** — keys().hasAll() / keys().hasOnly() reject unexpected fields
- **Size limits** — ID, voice name, prompt, system instruction, sample text have limits

Testing:

Firestore rules tests are in firestore.rules.test.ts

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| dev | pnpm dev | Start local development server |
| build | pnpm build | Vite build + esbuild server bundle |
| start | pnpm start | Start production server |
| preview | pnpm preview | Preview production build |
| lint | pnpm lint | TypeScript type checking (tsc --noEmit) |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| GEMINI_API_KEY | Gemini AI API key | Yes |

## Contributing

Contributing (မြန်မာဘာအချက်):

1. Fork the repository
2. Create a feature branch (git checkout -b feature/your-feature)
3. Commit your changes (git commit -m 'Add some feature')
4. Push to the branch (git push origin feature/your-feature)
5. Open a Pull Request

## License

MIT License — see LICENSE file for details.

---

**mmnext-voice-studio** — Voice library web application with Firebase + React + TypeScript.