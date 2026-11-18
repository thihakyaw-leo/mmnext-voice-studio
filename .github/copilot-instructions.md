# Copilot Instructions - mmnext-voice-studio

## Build, Test, and Lint Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Starts development server with `tsx server.ts` |
| `pnpm build` | Builds the project: `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` |
| `pnpm start` | Starts production server with `node dist/server.cjs` |
| `pnpm preview` | Previews the production build with `vite preview` |
| `pnpm lint` | Runs TypeScript type checking as linting: `tsc --noEmit` |
| `pnpm test` | No test script configured - add tests in `src/` and configure in `package.json` |

## High-Level Architecture

This is a **voice library web application** with the following key layers:

1. **Frontend** (React + Vite + TypeScript)
   - `App.tsx` - Root component with Firebase provider
   - `index.tsx` - Entry point with ReactDOM.render
   - `components/` - React UI components (AudioVisualizer, VoiceCard, Carousel3D, etc.)
   - `i18n.tsx` - Internationalization support (English/Myanmar language switching)
   - `index.css` - Global styles with dark mode support

2. **Backend** (Firebase + Node/Express)
   - `server.ts` - Express server with Firebase Auth integration
   - `firebase.ts` - Firebase initialization, Firestore services, Auth helpers
   - Firestore collections: `users`, `users/{uid}/favorites`, `users/{uid}/customNames`, `users/{uid}/castingHistory`
   - Google Authentication via Firebase Auth popup

3. **Data Layer**
   - `types.ts` - TypeScript interfaces: `Voice`, `VoiceAnalysis`, `FilterState`, `AiRecommendation`
   - `burmeseNames.ts` - Burmese character name mappings by voice archetype
   - `burmeseSamples.ts` - Default Burmese script samples per voice
   - `constants.ts` - Length limits and ID patterns

4. **Key Flows**
   - User signs in with Google popup (`signInWithGooglePopup`)
   - `ensureUserWorkspace` creates/updates user preferences in Firestore
   - `subscribeUserData` subscribes to user prefs, favorites, custom names, and casting history
   - `generateBurmeseNameMap` maps voices to Burmese character names
   - Audio visualizer renders real-time frequency data on canvas

## Key Conventions

- **TypeScript strict mode**: `noEmit: true` in `tsconfig.json`, `jsx: "react-jsx"`
- **Firebase patterns**: All Firestore operations go through `firebase.ts` helpers
- **ID safety**: Use `isSafeId()` validation from `firebase.ts` for any user-generated IDs
- **Visualizer variants**: `'wave'`, `'bars'`, `'mirror'` - set via `visualizerVariant` prop
- **Language codes**: `'en'` or `'mm'` for English/Myanmar
- **Dark mode**: Controlled by `document.documentElement.classList.contains('dark')`
- **Component props**: Most components accept optional `className` and style overrides
- **Error handling**: Use `FirebaseErrorBoundary` for wrapping components that use Firebase
- **Favorites**: Stored in `users/{uid}/favorites/{voiceName}` as individual documents
- **Casting history**: Limited to 20 most recent entries in `users/{uid}/castingHistory`

## Important Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root app component with Firebase provider |
| `src/index.tsx` | Entry point |
| `src/firebase.ts` | Firebase init, Auth, Firestore operations |
| `src/types.ts` | Type definitions |
| `src/burmeseNames.ts` | Burmese name mapping logic |
| `src/burmeseSamples.ts` | Default Burmese script samples |
| `src/components/AudioVisualizer.tsx` | Real-time audio visualizer |
| `src/components/FirebaseErrorBoundary.tsx` | Firebase error handling |
| `src/components/FirebaseProvider.tsx` | Firebase context provider |
| `src/server.ts` | Express server |
| `vite.config.ts` | Vite config with React plugin |
| `eslint.config.js` | ESLint config with Firebase security rules |

## MCP Servers

No MCP servers appear necessary for this project type. The project is a full-stack web application with React/Firebase that doesn't require browser automation, database introspection, or other specialized MCP capabilities.

---

*Generated for the mmnext-voice-studio project. This file helps future Copilot sessions understand the codebase conventions, build commands, and architectural patterns.*