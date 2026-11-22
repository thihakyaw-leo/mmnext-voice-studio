# MMNext AI Voice Studio

An enterprise-grade Burmese voice library, text-to-speech studio, and AI voice casting application powered by Google Gemini, Firebase Auth/Firestore, and React 19.

## Key Features

- **Route-Based Studio Architecture**:
  - `/login`: Secure Google sign-in workspace with scrollable layout and Light/Dark theme toggle.
  - `/:userid/home`: Authenticated user studio workspace preserving deep links (`?voice=...`, `?compare=...`).
  - `/privacy-policy`: Dedicated data privacy and security policy path.
  - `/terms`: Workspace terms of service and usage guidelines path.
  - `/storage`: High-fidelity audio storage, waveform capabilities, and workspace partitions path.
- **Theme & Appearance**: Full support for Light and Dark modes with automatic persistence in `localStorage` and Firestore user preferences.
- **Gemini AI Integration**: AI Casting Director, custom voice persona generation, and live Burmese text-to-speech (TTS) synthesis.
- **Real-Time Audio & Visualization**: Interactive 3D voice carousel, grid view, side-by-side comparison, and multiple visualizer variants (Wave, Bars, Mirror).
- **Firebase Cloud Sync**: Secure synchronization of favorites, custom character names, transcripts, and preferences with strict owner isolation rules.
- **Google Drive Integration**: Import/export scripts and backup workflows directly to Google Drive.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + TypeScript |
| Backend | Express (`server.ts` with Vite middleware & API proxy) |
| Database & Auth | Firebase Auth & Firestore (`ai-studio-mmnextvoicestudi-f3d949fe-55a2-404e-ba17-157f2ee9f729`) |
| AI | Google GenAI SDK (`@google/genai`) |
| Styling | Tailwind CSS + Lucide React + Framer Motion |
| Audio | Web Audio API (real-time pitch detection & frequency spectrum) |

## Project Structure

```text
mmnext-voice-studio/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── server.ts                 # Express backend & AI proxy routes
├── firebase.ts               # Firebase SDK, Auth & Firestore sync helpers
├── firebase-applet-config.json # Firebase project configuration
├── firestore.rules           # Firestore security rules (Eight Pillars)
├── firestore.rules.test.ts   # Security rules unit tests
├── types.ts                  # TypeScript interfaces
├── burmeseNames.ts           # Burmese character name mapping
├── burmeseSamples.ts         # Burmese script samples
├── constants.ts              # Voice data catalog
├── i18n.tsx                  # English / Myanmar bilingual support
├── index.css                 # Global styles, dark mode & cinematic themes
├── index.tsx                 # React entry point
├── App.tsx                   # Root component & routing controller
├── components/
│   ├── AiResultCard.tsx
│   ├── AiTtsPreview.tsx
│   ├── ApiKeyModal.tsx
│   ├── AudioVisualizer.tsx
│   ├── Carousel3D.tsx
│   ├── CompareView.tsx
│   ├── FavoritesDrawer.tsx
│   ├── FilterBar.tsx
│   ├── GoogleDriveModal.tsx
│   ├── LegalPages.tsx        # /privacy-policy, /terms, /storage pages
│   ├── LoginModal.tsx        # Secure sign-in shell
│   ├── MobileSidebar.tsx
│   ├── PitchDistributionModal.tsx
│   ├── PitchFrequencyPanel.tsx
│   ├── ShareVoiceModal.tsx
│   └── VoiceCard.tsx
└── utils/
    ├── googleDrive.ts        # Google Drive API helpers
    ├── googlePicker.ts       # Google Drive Picker integration
    └── pitchDetection.ts     # Voice pitch detection utility
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Set your Gemini API key:

```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 3. Run Development Server

```bash
npm run dev
```

The application runs at `http://localhost:3000`.

### 4. Production Build

```bash
npm run build
npm start
```

## License

Apache-2.0 License — see LICENSE file for details.