# Firebase Deployment Guide

This guide walks you through deploying mmnext-voice-studio to Firebase.

## Overview

mmnext-voice-studio is a full-stack application:
- **Frontend**: React + Vite (served as static files)
- **Backend**: Express server (serves API routes + static frontend in production)
- **Database**: Firestore (with security rules)
- **Auth**: Firebase Auth (Google Sign-In)

## Prerequisites

1. **Firebase CLI** installed:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Firebase project** — `mmnext-saas` (already configured in `.firebaserc`)

3. **Environment variables** — Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and set your `GEMINI_API_KEY` and `FIREBASE_WEB_API_KEY`.

   > **Security**: Never commit `.env` to git. It's already in `.gitignore`.

## Files Created/Modified

| File | Purpose |
|------|---------|
| `.firebaserc` | Firebase project ID (`mmnext-saas`) |
| `firebase.json` | Hosting config: public dir = `dist`, API rewrites, SPA fallback |
| `.env.example` | Added `FIREBASE_WEB_API_KEY` variable |
| `.gitignore` | Added `.env`, `.env.local`, `.env.*.local` |

## Deployment Steps

### Step 1: Set Environment Variables

Set the Gemini API key (required for AI features):

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

Or set via Google Cloud Console > App Hosting > Environment variables.

For local development, add to `.env`:
```
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_WEB_API_KEY=your_firebase_web_api_key
```

### Step 2: Build the Project

```bash
npm run build
```

This generates:
- `dist/` — Frontend static assets
- `dist/server.cjs` — Bundled Express backend

### Step 3: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

### Step 4: Deploy to Firebase

**Option A: Firebase App Hosting (Recommended)**

Firebase App Hosting runs the full Node.js/Express backend:

```bash
firebase init apphosting
# Follow prompts, select project mmnext-saas
firebase deploy
```

**Option B: Firebase Hosting (Frontend) + Cloud Run (Backend)**

1. Deploy frontend:
   ```bash
   firebase deploy --only hosting
   ```

2. Deploy backend to Cloud Run:
   ```bash
   gcloud run deploy mmnext-voice-api --source . \
     --platform managed \
     --region asia-southeast1 \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY=your_key
   ```

3. Update frontend API base URL to point to your Cloud Run service.

### Step 5: Verify Deployment

1. Open your Firebase project URL (e.g., `https://mmnext-saas.web.app`)
2. Sign in with Google
3. Test voice selection, favorites, and AI casting features

## Security Notes

1. **Hardcoded API key** — `firebase-applet-config.json` contains a Firebase Web API key. For production, move it to `FIREBASE_WEB_API_KEY` environment variable (server.ts already supports this).

2. **GEMINI_API_KEY** — Required for AI proxy routes. Set via Firebase config or environment variable, never commit to git.

3. **Firestore Security Rules** — Owner-isolation rules are in `firestore.rules`. Deploy them before going live.

## Local Development

```bash
# Start dev server (frontend + backend)
npm run dev

# Start Firestore emulator
firebase emulators:start --only firestore

# Run Firestore security rules tests
npm test
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Ensure `node_modules` is installed: `npm install` |
| API routes return 404 | Check `firebase.json` rewrites point `/api/**` to your backend |
| Auth fails | Verify `FIREBASE_WEB_API_KEY` is set correctly |
| Firestore denied | Deploy security rules: `firebase deploy --only firestore:rules` |
