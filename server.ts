/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import JSZip from "jszip";
import { VOICE_DATA } from "./constants";
import { getBurmeseDefaultSampleSpec } from "./burmeseSamples";
import type { Voice } from "./types";

const VOICE_BY_NAME = new Map(VOICE_DATA.map((v) => [v.name, v]));

class BoundedMap<K, V> extends Map<K, V> {
  maxEntries: number;
  constructor(maxEntries: number) {
    super();
    this.maxEntries = maxEntries;
  }
  set(key: K, value: V): this {
    if (this.has(key)) {
      this.delete(key);
    } else if (this.size >= this.maxEntries) {
      const oldest = this.keys().next().value;
      if (oldest !== undefined) this.delete(oldest);
    }
    return super.set(key, value);
  }
}


function stripHttpOptions(val: any): any {
  if (!val || typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(stripHttpOptions);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    if (
      k === "httpOptions" ||
      k === "http_options" ||
      k === "__proto__" ||
      k === "constructor" ||
      k === "prototype" ||
      k === "cachedContent" ||
      k === "cached_content" ||
      k === "fileSearch" ||
      k === "file_search" ||
      k === "corpora" ||
      k === "semanticRetriever" ||
      k === "semantic_retriever"
    ) continue;
    if ((k === "fileData" || k === "file_data") && v && typeof v === "object") {
      const rawU = (v as any).fileUri ?? (v as any).file_uri;
      const u = typeof rawU === "string" ? rawU.trim() : "";
      if (!/^https:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\//i.test(u)) continue;
    }
    out[k] = stripHttpOptions(v);
  }
  return out;
}


const MODEL_UPGRADES: Record<string, string> = {
  "gemini-2.5-flash": "gemini-4-hydrogen",
  "gemini-2.5-pro": "gemini-4-argon",
  "gemini-3-flash-preview": "gemini-4-hydrogen",
  "gemini-3-pro-preview": "gemini-4-argon",
  "gemini-2.0-flash": "gemini-4-hydrogen",
  "gemini-2.0-flash-exp": "gemini-4-hydrogen",
  "gemini-2.5-pro-preview-tts": "gemini-3.8-flash-lite-tts",
  "gemini-2.5-flash-preview-tts": "gemini-3.8-flash-lite-tts",
};

const ALLOWED_MODEL_RE = /^(?!.*\.\.)(?:models\/)?(?:gemini-|imagen-|veo-|lyria-|learnlm-|text-embedding-|gemini-embedding-)[a-zA-Z0-9._-]+$/;

function resolveModel(model?: string): string {
  const candidate = !model ? "gemini-4-hydrogen" : MODEL_UPGRADES[model] || model;
  if (!ALLOWED_MODEL_RE.test(candidate)) {
    throw new Error(`Disallowed model: ${candidate}`);
  }
  return candidate;
}

const aqEndpointModeCache = new BoundedMap<string, "gemini" | "vertex">(200);

const AI_REQUEST_TIMEOUT_MS = 120_000;
const AUTH_FETCH_TIMEOUT_MS = 30_000;

const MODEL_FALLBACKS: Record<string, string[]> = {
  "gemini-4-hydrogen": ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"],
  "gemini-4-neon": ["gemini-2.5-pro", "gemini-2.5-flash"],
  "gemini-4-argon": ["gemini-2.5-pro", "gemini-2.5-flash"],
  "gemini-4-carbon": ["gemini-2.5-pro", "gemini-2.5-flash"],
  "gemini-3.8-flash-lite-tts": ["gemini-2.5-flash-preview-tts"],
  "gemini-3.8-flash-tts": ["gemini-2.5-flash-preview-tts"],
};

function isValidGeminiKeyFormat(apiKey: string): boolean {
  const trimmed = apiKey.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  return trimmed.startsWith("AIza") || trimmed.startsWith("AQ.");
}

function createAiClient(apiKey: string, vertexai = false) {
  return new GoogleGenAI({
    apiKey,
    ...(vertexai ? { vertexai: true } : { apiVersion: "v1beta" }),
    httpOptions: {
      timeout: AI_REQUEST_TIMEOUT_MS,
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function getClientApiKey(req: any): string {
  const userApiKey =
    typeof req.headers?.["x-gemini-api-key"] === "string"
      ? req.headers["x-gemini-api-key"].trim()
      : "";
  return userApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY || "";
}

function hasUserSuppliedApiKey(req: any): boolean {
  return (
    typeof req.headers?.["x-gemini-api-key"] === "string" &&
    req.headers["x-gemini-api-key"].trim().length > 0
  );
}

function isAuthOrKeyEndpointError(error: any): boolean {
  const status = typeof error?.status === "number" ? error.status : 0;
  const msg = String(error?.message || "");
  return (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    msg.includes("API_KEY_INVALID") ||
    msg.includes("API key not valid") ||
    msg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
    msg.includes("UNAUTHENTICATED") ||
    msg.includes("API keys are not supported")
  );
}

function isModelNotFoundError(error: any): boolean {
  const status = typeof error?.status === "number" ? error.status : 0;
  const msg = String(error?.message || "");
  return (
    status === 404 ||
    msg.includes("NOT_FOUND") ||
    msg.includes("was not found") ||
    msg.includes("not found for API version") ||
    msg.includes("is not supported for generateContent")
  );
}

function isTimeoutError(error: any): boolean {
  const status = typeof error?.status === "number" ? error.status : 0;
  const name = String(error?.name || "");
  const msg = String(error?.message || "");
  return (
    status === 408 ||
    status === 504 ||
    name === "TimeoutError" ||
    name === "AbortError" ||
    /timed out|timeout|ETIMEDOUT|ESOCKETTIMEDOUT|DEADLINE_EXCEEDED/i.test(msg)
  );
}

function isTransientUnavailableError(error: any): boolean {
  const status = typeof error?.status === "number" ? error.status : 0;
  const msg = String(error?.message || "");
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    isTimeoutError(error) ||
    msg.includes('"code":503') ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("high demand") ||
    msg.includes("temporarily unavailable") ||
    /ECONNRESET|ECONNREFUSED|EAI_AGAIN|ENOTFOUND|fetch failed|network/i.test(msg)
  );
}

function assertValidApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!isValidGeminiKeyFormat(trimmed)) {
    const err: any = new Error(
      "Personal Gemini API key required. Please enter a valid Google AI Studio API key (starting with 'AQ.' or 'AIza')."
    );
    err.status = 401;
    throw err;
  }
  return trimmed;
}

async function runWithApiKeyClient<T>(
  rawApiKey: string,
  fn: (ai: GoogleGenAI, vertexai: boolean) => Promise<T>
): Promise<T> {
  const apiKey = assertValidApiKey(rawApiKey);
  const cachedMode = apiKey.startsWith("AQ.") ? aqEndpointModeCache.get(apiKey) : "gemini";

  if (cachedMode === "vertex") {
    try {
      return await fn(createAiClient(apiKey, true), true);
    } catch (err: any) {
      if (isAuthOrKeyEndpointError(err)) {
        const geminiResult = await fn(createAiClient(apiKey, false), false);
        aqEndpointModeCache.set(apiKey, "gemini");
        return geminiResult;
      }
      throw err;
    }
  }

  try {
    const result = await fn(createAiClient(apiKey, false), false);
    if (apiKey.startsWith("AQ.")) {
      aqEndpointModeCache.set(apiKey, "gemini");
    }
    return result;
  } catch (err: any) {
    if (apiKey.startsWith("AQ.") && isAuthOrKeyEndpointError(err)) {
      const vertexResult = await fn(createAiClient(apiKey, true), true);
      aqEndpointModeCache.set(apiKey, "vertex");
      return vertexResult;
    }
    throw err;
  }
}

async function runWithModelFallback<T>(
  rawApiKey: string,
  primaryModel: string,
  fn: (ai: GoogleGenAI, model: string, vertexai: boolean) => Promise<T>
): Promise<T> {
  const candidates = [primaryModel, ...(MODEL_FALLBACKS[primaryModel] || [])];
  const retryDelaysMs = [900, 2000];
  let lastError: any;

  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
      try {
        return await runWithApiKeyClient(rawApiKey, (ai, isVertex) => fn(ai, model, isVertex));
      } catch (err: any) {
        lastError = err;
        if (isTransientUnavailableError(err) && attempt < retryDelaysMs.length) {
          const jitter = Math.floor(Math.random() * 250);
          await new Promise((r) => setTimeout(r, retryDelaysMs[attempt] + jitter));
          continue;
        }
        const canFallbackModel =
          i < candidates.length - 1 &&
          (isModelNotFoundError(err) || isTransientUnavailableError(err));
        if (canFallbackModel) {
          break;
        }
        throw err;
      }
    }
  }
  throw lastError;
}

function unwrapGoogleErrorMessage(rawMessage: string): { code?: number; message: string } {
  const trimmed = rawMessage.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const errObj = parsed?.error || parsed;
      if (typeof errObj?.message === "string" && errObj.message.trim()) {
        return {
          code: typeof errObj.code === "number" ? errObj.code : undefined,
          message: errObj.message.trim(),
        };
      }
    } catch {
      // Ignore JSON parse failure
    }
  }
  return { message: rawMessage };
}

function formatApiError(error: any, fallbackMessage: string): { status: number; message: string } {
  const rawMessage = String(error?.message || fallbackMessage);
  const unwrapped = unwrapGoogleErrorMessage(rawMessage);
  const cleanMessage = unwrapped.message || fallbackMessage;
  const status =
    typeof error?.status === "number" && error.status >= 400
      ? error.status
      : typeof unwrapped.code === "number" && unwrapped.code >= 400
      ? unwrapped.code
      : isTimeoutError(error)
      ? 504
      : rawMessage.includes("429") || rawMessage.includes("RESOURCE_EXHAUSTED")
      ? 429
      : rawMessage.includes("503") || rawMessage.includes("UNAVAILABLE") || rawMessage.includes("high demand")
      ? 503
      : 500;

  if (status === 429) {
    return {
      status: 429,
      message: "Rate limit or quota exceeded for your Gemini API key. Please wait a moment and try again, or check your Google AI Studio quota/billing.",
    };
  }

  if (status === 503) {
    return {
      status: 503,
      message: "The AI model is temporarily experiencing high demand. Please wait a few seconds and try again.",
    };
  }

  if (status === 504 || status === 408) {
    return {
      status: 504,
      message: "Request timed out while waiting for Google AI. Please try again.",
    };
  }

  return { status, message: cleanMessage };
}

function serializeGenerateContentResponse(r: any) {
  return {
    candidates: r?.candidates,
    promptFeedback: r?.promptFeedback,
    usageMetadata: r?.usageMetadata,
    modelVersion: r?.modelVersion,
    responseId: r?.responseId,
    text: r?.text,
    functionCalls: r?.functionCalls,
    data: r?.data,
    executableCode: r?.executableCode,
    codeExecutionResult: r?.codeExecutionResult,
  };
}

const chats = new BoundedMap<string, any>(200);
const videoOps = new BoundedMap<string, { op: any; ownerKey: string }>(100);
const verifiedTokenCache = new BoundedMap<
  string,
  { uid: string; email?: string; expiresAtMs: number }
>(500);

function readFirebaseAppletConfig(): { apiKey: string; projectId: string } {
  const envKey = typeof process.env.FIREBASE_WEB_API_KEY === "string" ? process.env.FIREBASE_WEB_API_KEY.trim() : "";
  const envProjectId = typeof process.env.FIREBASE_PROJECT_ID === "string" ? process.env.FIREBASE_PROJECT_ID.trim() : "";
  try {
    const cfgPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(cfgPath)) {
      const parsed = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      return {
        apiKey: envKey || (typeof parsed?.apiKey === "string" ? parsed.apiKey.trim() : ""),
        projectId: envProjectId || (typeof parsed?.projectId === "string" ? parsed.projectId.trim() : ""),
      };
    }
  } catch {
    // Ignore config read errors
  }
  return { apiKey: envKey, projectId: envProjectId };
}

const { apiKey: FIREBASE_WEB_API_KEY, projectId: FIREBASE_PROJECT_ID } = readFirebaseAppletConfig();

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function getJwtExpMs(token: string): number {
  const payload = decodeJwtPayload(token);
  if (typeof payload?.exp === "number" && Number.isFinite(payload.exp)) {
    return payload.exp * 1000;
  }
  return Date.now() + 60_000;
}

async function verifyFirebaseIdToken(
  token: string
): Promise<{ uid: string; email?: string } | null> {
  if (!token || !FIREBASE_WEB_API_KEY) return null;

  const cached = verifiedTokenCache.get(token);
  const now = Date.now();
  if (cached && cached.expiresAtMs > now + 5000) {
    return { uid: cached.uid, email: cached.email };
  }

  const payload = decodeJwtPayload(token);
  if (FIREBASE_PROJECT_ID && payload) {
    if (
      payload.aud !== FIREBASE_PROJECT_ID ||
      payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
    ) {
      return null;
    }
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
          FIREBASE_WEB_API_KEY
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
          signal: AbortSignal.timeout(AUTH_FETCH_TIMEOUT_MS),
        }
      );
      if (!resp.ok) {
        if (resp.status >= 500 && attempt === 0) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        return null;
      }
      const data: any = await resp.json().catch(() => null);
      const user = Array.isArray(data?.users) ? data.users[0] : null;
      if (!user?.localId || user.disabled || user.emailVerified === false) return null;

      const expMs = Math.min(getJwtExpMs(token), now + 5 * 60 * 1000);
      const entry = {
        uid: String(user.localId),
        email: typeof user.email === "string" ? user.email : undefined,
        expiresAtMs: expMs,
      };
      verifiedTokenCache.set(token, entry);
      return { uid: entry.uid, email: entry.email };
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function requireAuthenticatedUser(req: any, res: any, next: any) {
  const authHeader =
    typeof req.headers?.authorization === "string" ? req.headers.authorization.trim() : "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return res.status(401).json({
      error: "Authentication required. Please sign in with Google to continue.",
    });
  }

  const verified = await verifyFirebaseIdToken(token);
  if (!verified) {
    return res.status(401).json({
      error: "Invalid or expired session. Please sign in with Google again.",
    });
  }

  req.authUser = verified;
  next();
}

// --- Gemini Daily Free Limit Manager (Midnight Pacific Time reset) ---
const GEMINI_DAILY_FREE_LIMIT = Math.max(
  1,
  Number(process.env.GEMINI_DAILY_FREE_LIMIT) || 200
);
const GEMINI_USER_DAILY_LIMIT = Math.max(
  1,
  Number(process.env.GEMINI_USER_DAILY_LIMIT) || 40
);
const QUOTA_FILE_PATH = path.join(os.tmpdir(), "mmnext-gemini-daily-quota.json");

interface DailyQuotaState {
  date: string;
  globalUsed: number;
  byUser: Record<string, number>;
  upstreamExhausted: boolean;
}

function getPacificDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function loadDailyQuotaState(): DailyQuotaState {
  const today = getPacificDateKey();
  try {
    if (fs.existsSync(QUOTA_FILE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(QUOTA_FILE_PATH, "utf8"));
      if (parsed && parsed.date === today && typeof parsed.globalUsed === "number") {
        return {
          date: today,
          globalUsed: Math.max(0, parsed.globalUsed),
          byUser: parsed.byUser && typeof parsed.byUser === "object" ? parsed.byUser : {},
          upstreamExhausted: Boolean(parsed.upstreamExhausted),
        };
      }
    }
  } catch {
    // Ignore corrupt quota file and reset for today
  }
  return { date: today, globalUsed: 0, byUser: {}, upstreamExhausted: false };
}

let dailyQuotaState: DailyQuotaState = loadDailyQuotaState();

function saveDailyQuotaState(): void {
  try {
    fs.writeFileSync(QUOTA_FILE_PATH, JSON.stringify(dailyQuotaState), "utf8");
  } catch {
    // Ignore disk persistence errors
  }
}

function ensureCurrentQuotaDay(): DailyQuotaState {
  const today = getPacificDateKey();
  if (dailyQuotaState.date !== today) {
    dailyQuotaState = { date: today, globalUsed: 0, byUser: {}, upstreamExhausted: false };
    saveDailyQuotaState();
  }
  return dailyQuotaState;
}

function getQuotaSnapshot(uid: string) {
  const state = ensureCurrentQuotaDay();
  const userUsed = Math.max(0, Number(state.byUser[uid] || 0));
  const globalRemaining = Math.max(0, GEMINI_DAILY_FREE_LIMIT - state.globalUsed);
  const userRemaining = Math.max(0, GEMINI_USER_DAILY_LIMIT - userUsed);
  const exhausted = state.upstreamExhausted || globalRemaining <= 0 || userRemaining <= 0;

  return {
    date: state.date,
    globalLimit: GEMINI_DAILY_FREE_LIMIT,
    globalUsed: state.globalUsed,
    globalRemaining,
    userLimit: GEMINI_USER_DAILY_LIMIT,
    userUsed,
    userRemaining,
    upstreamExhausted: state.upstreamExhausted,
    exhausted,
  };
}

function tryConsumeDailyQuota(uid: string): { ok: boolean; error?: string } {
  const state = ensureCurrentQuotaDay();
  const userUsed = Number(state.byUser[uid] || 0);

  if (state.upstreamExhausted) {
    return {
      ok: false,
      error:
        "Gemini Daily Free Limit has been reached for today. Cached voices still play; live AI/TTS resets at midnight PT.",
    };
  }
  if (state.globalUsed >= GEMINI_DAILY_FREE_LIMIT) {
    return {
      ok: false,
      error: `Studio's Gemini Daily Free Limit (${GEMINI_DAILY_FREE_LIMIT}/day) has been reached. Resets at midnight PT.`,
    };
  }
  if (userUsed >= GEMINI_USER_DAILY_LIMIT) {
    return {
      ok: false,
      error: `Your daily free Gemini limit (${GEMINI_USER_DAILY_LIMIT}/day) has been reached. Resets at midnight PT.`,
    };
  }

  state.globalUsed += 1;
  state.byUser[uid] = userUsed + 1;
  saveDailyQuotaState();
  return { ok: true };
}

function markUpstreamQuotaExhausted(): void {
  const state = ensureCurrentQuotaDay();
  state.upstreamExhausted = true;
  saveDailyQuotaState();
}

function isUpstreamQuotaError(error: any): boolean {
  const status = typeof error?.status === "number" ? error.status : 0;
  const msg = String(error?.message || "");
  return status === 429 || msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
}

function getClientKey(req: any): string {
  const raw = req?.headers?.["x-client-id"];
  if (typeof raw === "string" && /^[a-zA-Z0-9_-]{8,128}$/.test(raw.trim())) {
    return `cid:${raw.trim()}`;
  }
  const xffParts = String(req?.headers?.["x-forwarded-for"] || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const xff = xffParts.length >= 2 ? xffParts[xffParts.length - 2] : (xffParts[0] || "");
  return `ip:${xff || req?.ip || req?.socket?.remoteAddress || "unknown"}`;
}

function ensureWavBuffer(rawBuffer: Buffer, mimeType?: string): Buffer {
  // Check if buffer already has RIFF/WAVE header (Gemini 3.8 unary TTS returns complete WAV)
  if (
    rawBuffer.length >= 12 &&
    rawBuffer.toString("ascii", 0, 4) === "RIFF" &&
    rawBuffer.toString("ascii", 8, 12) === "WAVE"
  ) {
    return rawBuffer;
  }

  // Fallback for raw PCM (24kHz, mono, 16-bit LE)
  let sampleRate = 24000;
  if (mimeType) {
    const rateMatch = mimeType.match(/rate=(\d+)/i);
    if (rateMatch) {
      const parsed = Number(rateMatch[1]);
      if (Number.isFinite(parsed) && parsed > 0) sampleRate = parsed;
    }
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + rawBuffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(rawBuffer.length, 40);

  return Buffer.concat([header, rawBuffer]);
}

async function startServer() {
  const app = express();
  app.set("trust proxy", 2);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use((req, _res, next) => {
    if (req.body && typeof req.body === "object") {
      req.body = stripHttpOptions(req.body);
    }
    next();
  });

  for (const dir of ["examples", "assets", "public"]) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      app.use(`/${dir}`, express.static(dirPath));
    }
  }

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/quota", requireAuthenticatedUser, (req: any, res) => {
    const uid = req.authUser.uid;
    res.setHeader("Cache-Control", "no-store");
    return res.json(getQuotaSnapshot(uid));
  });

  app.post("/api/validate-api-key", requireAuthenticatedUser, async (req: any, res): Promise<any> => {
    try {
      const candidate =
        typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : getClientApiKey(req);
      if (!isValidGeminiKeyFormat(candidate)) {
        return res.status(400).json({
          error: "Gemini API keys must start with 'AQ.' or 'AIza' and contain no spaces.",
        });
      }

      // 1. Check Gemini Developer API (generativelanguage.googleapis.com) at zero token cost (with retry)
      let glResp: Response | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          glResp = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1",
            {
              method: "GET",
              headers: {
                "x-goog-api-key": candidate,
                "User-Agent": "aistudio-build",
              },
              signal: AbortSignal.timeout(AUTH_FETCH_TIMEOUT_MS),
            }
          );
          if (glResp.ok || (glResp.status < 500 && glResp.status !== 429)) {
            break;
          }
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 700));
          }
        } catch (fetchErr) {
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 700));
            continue;
          }
          throw fetchErr;
        }
      }

      if (glResp?.ok) {
        if (candidate.startsWith("AQ.")) {
          aqEndpointModeCache.set(candidate, "gemini");
        }
        return res.json({ valid: true, mode: "gemini" });
      }

      const glErrorText = glResp ? await glResp.text().catch(() => "") : "";
      let glMessage = glErrorText;
      try {
        const parsed = JSON.parse(glErrorText);
        glMessage = parsed?.error?.message || glErrorText;
      } catch {}

      // 2. If AQ. key was rejected by generativelanguage, test Vertex AI Express Mode models sequentially
      if (candidate.startsWith("AQ.")) {
        const probeModels = ["gemini-4-hydrogen", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
        let lastVertexErr: any;
        for (const probeModel of probeModels) {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              await createAiClient(candidate, true).models.generateContent({
                model: probeModel,
                contents: "ok",
                config: { maxOutputTokens: 1 },
              });
              aqEndpointModeCache.set(candidate, "vertex");
              return res.json({ valid: true, mode: "vertex", model: probeModel });
            } catch (vertexErr: any) {
              lastVertexErr = vertexErr;
              const vStatus = typeof vertexErr?.status === "number" ? vertexErr.status : 0;
              const vMsg = String(vertexErr?.message || "");
              if (vStatus === 429 || vMsg.includes("RESOURCE_EXHAUSTED")) {
                aqEndpointModeCache.set(candidate, "vertex");
                return res.json({ valid: true, mode: "vertex", model: probeModel });
              }
              if (isTransientUnavailableError(vertexErr) && attempt === 0) {
                await new Promise((r) => setTimeout(r, 750));
                continue;
              }
              if (isModelNotFoundError(vertexErr) || isTransientUnavailableError(vertexErr)) {
                break;
              }
              const formatted = formatApiError(
                vertexErr,
                glMessage ||
                  "Google rejected this AQ. API key on both Gemini API and Vertex AI Express Mode."
              );
              return res.status(400).json({ error: formatted.message });
            }
          }
        }
        const formatted = formatApiError(
          lastVertexErr,
          glMessage ||
            "Google rejected this AQ. API key on both Gemini API and Vertex AI Express Mode. Please verify the key is active in Google AI Studio."
        );
        return res.status(400).json({ error: formatted.message });
      }

      return res.status(400).json({
        error: glMessage || "API key not valid. Please check your key in Google AI Studio.",
      });
    } catch (error: any) {
      console.error("[Backend] /api/validate-api-key error:", error);
      const { status, message } = formatApiError(error, "Failed to validate API key.");
      return res.status(status).json({ error: message });
    }
  });

const sampleAudioCache = new BoundedMap<string, { buffer: Buffer; contentType: string }>(40);
const pendingSampleRequests = new Map<string, Promise<{ buffer: Buffer; contentType: string }>>();
const BURMESE_SAMPLE_CACHE_DIR = path.join(os.tmpdir(), "mmnext-burmese-samples-v1");

try {
  fs.mkdirSync(BURMESE_SAMPLE_CACHE_DIR, { recursive: true });
} catch {
  // Ignore temp directory creation failures and fall back to memory cache
}

async function synthesizeBurmeseVoiceWav(
  voiceName: string,
  text: string,
  style?: string,
  reqApiKey?: string
): Promise<Buffer> {
  const rawApiKey = reqApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY || "";

  return await runWithModelFallback(rawApiKey, "gemini-3.8-flash-lite-tts", async (ai, model) => {
    const part: any = { text };
    if (style && model.startsWith("gemini-3.8-")) {
      part.speechMetadata = { style };
    }
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [part],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p?.inlineData?.data
    )?.inlineData;
    const base64Audio = inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data was returned by the TTS model.");
    }

    const rawBuffer = Buffer.from(base64Audio, "base64");
    return ensureWavBuffer(rawBuffer, inlineData?.mimeType);
  });
}

async function fetchVoiceSampleBuffer(
  voice: Voice,
  uid?: string,
  reqApiKey?: string,
  isUserKey = false
): Promise<{ buffer: Buffer; contentType: string }> {
  const cached = sampleAudioCache.get(voice.name);
  if (cached) return cached;

  const diskPath = path.join(BURMESE_SAMPLE_CACHE_DIR, `${voice.name}.wav`);
  try {
    if (fs.existsSync(diskPath)) {
      const diskBuf = fs.readFileSync(diskPath);
      if (diskBuf.length > 44) {
        const entry = { buffer: diskBuf, contentType: "audio/wav" };
        sampleAudioCache.set(voice.name, entry);
        return entry;
      }
    }
  } catch {
    // Ignore disk read error and regenerate
  }

  const existingInFlight = pendingSampleRequests.get(voice.name);
  if (existingInFlight) {
    return existingInFlight;
  }

  if (uid && !isUserKey) {
    const quota = tryConsumeDailyQuota(uid);
    if (!quota.ok) {
      const qErr: any = new Error(quota.error);
      qErr.status = 429;
      throw qErr;
    }
  }

  const job = (async () => {
    const { script, style } = getBurmeseDefaultSampleSpec(voice);
    try {
      const wavBuffer = await synthesizeBurmeseVoiceWav(voice.name, script, style, reqApiKey);
      const entry = { buffer: wavBuffer, contentType: "audio/wav" };
      sampleAudioCache.set(voice.name, entry);
      try {
        fs.writeFileSync(diskPath, wavBuffer);
      } catch {
        // Ignore disk cache write errors
      }
      return entry;
    } catch (err) {
      if (!isUserKey && isUpstreamQuotaError(err)) {
        markUpstreamQuotaExhausted();
      }
      throw err;
    }
  })();

  pendingSampleRequests.set(voice.name, job);
  try {
    return await job;
  } finally {
    pendingSampleRequests.delete(voice.name);
  }
}

  app.get("/api/voice-sample/:voiceName", requireAuthenticatedUser, async (req: any, res): Promise<any> => {
    try {
      const rawName = typeof req.params?.voiceName === "string" ? req.params.voiceName.trim() : "";
      const voice = VOICE_BY_NAME.get(rawName);
      if (!voice) {
        return res.status(404).json({ error: "Voice sample not found." });
      }

      const reqApiKey = getClientApiKey(req);
      const entry = await fetchVoiceSampleBuffer(voice, req.authUser.uid, reqApiKey, hasUserSuppliedApiKey(req));
      res.setHeader("Content-Type", entry.contentType);
      res.setHeader("Cache-Control", "private, max-age=86400");
      return res.send(entry.buffer);
    } catch (error: any) {
      console.error("[Backend] /api/voice-sample error:", error);
      const { status, message } = formatApiError(error, "Failed to generate Burmese voice sample.");
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/favorites-zip", requireAuthenticatedUser, async (req: any, res): Promise<any> => {
    try {
      const reqApiKey = getClientApiKey(req);
      const isUserKey = hasUserSuppliedApiKey(req);
      const requestedNames = Array.isArray(req.body?.voiceNames) ? req.body.voiceNames : [];
      const seen = new Set<string>();
      const targetVoices = [];

      for (const rawName of requestedNames) {
        if (typeof rawName !== "string") continue;
        const voice = VOICE_BY_NAME.get(rawName.trim());
        if (voice && !seen.has(voice.name)) {
          seen.add(voice.name);
          targetVoices.push(voice);
        }
      }

      if (targetVoices.length === 0) {
        return res.status(400).json({ error: "No valid favorited voices were provided." });
      }

      const zip = new JSZip();
      const results: { name: string; buffer: Buffer }[] = [];
      const CONCURRENCY = 3;
      for (let i = 0; i < targetVoices.length; i += CONCURRENCY) {
        const batch = targetVoices.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
          batch.map(async (voice) => {
            const entry = await fetchVoiceSampleBuffer(voice, req.authUser.uid, reqApiKey, isUserKey);
            return { name: voice.name, buffer: entry.buffer };
          })
        );
        results.push(...batchResults);
      }

      for (const item of results) {
        zip.file(`${item.name}.wav`, item.buffer);
      }

      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 1 },
      });

      const dateStamp = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="mmnext-favorites-audio-${dateStamp}.zip"`
      );
      res.setHeader("Cache-Control", "no-store");
      return res.send(zipBuffer);
    } catch (error: any) {
      console.error("[Backend] /api/favorites-zip error:", error);
      const { status, message } = formatApiError(
        error,
        "Failed to bundle favorited audio samples."
      );
      return res.status(status === 500 ? 502 : status).json({ error: message });
    }
  });

  app.post("/api/tts", requireAuthenticatedUser, async (req: any, res): Promise<any> => {
    try {
      const isUserKey = hasUserSuppliedApiKey(req);
      const apiKey = assertValidApiKey(getClientApiKey(req));

      const rawText = typeof req.body?.text === "string" ? req.body.text.trim() : "";
      const voiceName = typeof req.body?.voiceName === "string" ? req.body.voiceName.trim() : "";
      const style = typeof req.body?.style === "string" ? req.body.style.trim() : "";

      if (!rawText) {
        return res.status(400).json({ error: "Text is required for speech generation." });
      }
      if (!voiceName) {
        return res.status(400).json({ error: "Voice name is required." });
      }

      if (!isUserKey) {
        const quota = tryConsumeDailyQuota(req.authUser.uid);
        if (!quota.ok) {
          return res.status(429).json({ error: quota.error });
        }
      }

      const text = rawText.slice(0, 2500);
      const hasBurmeseScript = /[\u1000-\u109F]/.test(text);
      const effectiveStyle =
        style ||
        (hasBurmeseScript
          ? "Speak naturally in native Myanmar (Burmese) pronunciation with clear diction."
          : "");
      const wavBuffer = await synthesizeBurmeseVoiceWav(voiceName, text, effectiveStyle || undefined, apiKey);

      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Cache-Control", "no-store");
      return res.send(wavBuffer);
    } catch (error: any) {
      console.error("[Backend] /api/tts error:", error);
      if (!hasUserSuppliedApiKey(req) && isUpstreamQuotaError(error)) {
        markUpstreamQuotaExhausted();
      }
      const { status, message } = formatApiError(error, "Failed to generate speech.");
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/generate-content", requireAuthenticatedUser, async (req: any, res): Promise<any> => {
    try {
      const isUserKey = hasUserSuppliedApiKey(req);
      const apiKey = assertValidApiKey(getClientApiKey(req));
      if (!isUserKey) {
        const quota = tryConsumeDailyQuota(req.authUser.uid);
        if (!quota.ok) {
          return res.status(429).json({ error: quota.error });
        }
      }
      const primaryModel = resolveModel(req.body?.model);
      const response = await runWithModelFallback(apiKey, primaryModel, (ai, model) =>
        ai.models.generateContent({ ...req.body, model })
      );
      return res.json(serializeGenerateContentResponse(response));
    } catch (error: any) {
      console.error("[Backend] /api/generate-content error:", error);
      if (!hasUserSuppliedApiKey(req) && isUpstreamQuotaError(error)) {
        markUpstreamQuotaExhausted();
      }
      const { status, message } = formatApiError(error, "Failed to generate content.");
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/generate-content-stream", requireAuthenticatedUser, async (req: any, res): Promise<any> => {
    try {
      const isUserKey = hasUserSuppliedApiKey(req);
      const apiKey = assertValidApiKey(getClientApiKey(req));
      if (!isUserKey) {
        const quota = tryConsumeDailyQuota(req.authUser.uid);
        if (!quota.ok) {
          return res.status(429).json({ error: quota.error });
        }
      }
      const primaryModel = resolveModel(req.body?.model);
      const stream = await runWithModelFallback(apiKey, primaryModel, (ai, model) =>
        ai.models.generateContentStream({ ...req.body, model })
      );
      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      for await (const chunk of stream) {
        res.write(JSON.stringify(serializeGenerateContentResponse(chunk)) + "\n");
      }
      res.end();
    } catch (error: any) {
      console.error("[Backend] /api/generate-content-stream error:", error);
      if (!hasUserSuppliedApiKey(req) && isUpstreamQuotaError(error)) {
        markUpstreamQuotaExhausted();
      }
      if (!res.headersSent) {
        const { status, message } = formatApiError(error, "Failed to stream content.");
        return res.status(status).json({ error: message });
      }
      res.end();
    }
  });

  app.post("/api/chat-message", requireAuthenticatedUser, async (req: any, res): Promise<any> => {
    try {
      const isUserKey = hasUserSuppliedApiKey(req);
      const apiKey = assertValidApiKey(getClientApiKey(req));
      if (!isUserKey) {
        const quota = tryConsumeDailyQuota(req.authUser.uid);
        if (!quota.ok) {
          return res.status(429).json({ error: quota.error });
        }
      }
      const { sessionId, model, config, history, message, msgConfig } = req.body || {};
      const primaryModel = resolveModel(model);
      const chatKey = sessionId ? `${req.authUser.uid}:${String(sessionId).slice(0, 128)}` : "";
      const response = await runWithModelFallback(apiKey, primaryModel, async (ai, activeModel, isVertex) => {
        const modeKey = chatKey ? `${chatKey}:${activeModel}:${isVertex ? "v" : "g"}` : "";
        let chat = modeKey ? chats.get(modeKey) : undefined;
        if (!chat) {
          chat = ai.chats.create({
            model: activeModel,
            config,
            history,
          });
        }
        const resp = await chat.sendMessage({ message, config: msgConfig });
        if (modeKey) chats.set(modeKey, chat);
        return resp;
      });
      return res.json(serializeGenerateContentResponse(response));
    } catch (error: any) {
      console.error("[Backend] /api/chat-message error:", error);
      if (!hasUserSuppliedApiKey(req) && isUpstreamQuotaError(error)) {
        markUpstreamQuotaExhausted();
      }
      const { status, message } = formatApiError(error, "Failed to send chat message.");
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/chat-stream", requireAuthenticatedUser, async (req: any, res): Promise<any> => {
    try {
      const isUserKey = hasUserSuppliedApiKey(req);
      const apiKey = assertValidApiKey(getClientApiKey(req));
      if (!isUserKey) {
        const quota = tryConsumeDailyQuota(req.authUser.uid);
        if (!quota.ok) {
          return res.status(429).json({ error: quota.error });
        }
      }
      const { sessionId, model, config, history, message, msgConfig } = req.body || {};
      const primaryModel = resolveModel(model);
      const chatKey = sessionId ? `${req.authUser.uid}:${String(sessionId).slice(0, 128)}` : "";
      const stream = await runWithModelFallback(apiKey, primaryModel, async (ai, activeModel, isVertex) => {
        const modeKey = chatKey ? `${chatKey}:${activeModel}:${isVertex ? "v" : "g"}` : "";
        let chat = modeKey ? chats.get(modeKey) : undefined;
        if (!chat) {
          chat = ai.chats.create({
            model: activeModel,
            config,
            history,
          });
        }
        const s = await chat.sendMessageStream({ message, config: msgConfig });
        if (modeKey) chats.set(modeKey, chat);
        return s;
      });
      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      for await (const chunk of stream) {
        res.write(JSON.stringify(serializeGenerateContentResponse(chunk)) + "\n");
      }
      res.end();
    } catch (error: any) {
      console.error("[Backend] /api/chat-stream error:", error);
      if (!hasUserSuppliedApiKey(req) && isUpstreamQuotaError(error)) {
        markUpstreamQuotaExhausted();
      }
      if (!res.headersSent) {
        const { status, message } = formatApiError(error, "Failed to stream chat message.");
        return res.status(status).json({ error: message });
      }
      res.end();
    }
  });

  app.post("/api/generate-images", requireAuthenticatedUser, async (req: any, res): Promise<any> => {
    try {
      const apiKey = assertValidApiKey(getClientApiKey(req));
      const quota = tryConsumeDailyQuota(req.authUser.uid);
      if (!quota.ok) {
        return res.status(429).json({ error: quota.error });
      }
      const response = await runWithApiKeyClient(apiKey, (ai) =>
        ai.models.generateImages({ ...req.body, model: resolveModel(req.body?.model || "imagen-3.0-generate-002") })
      );
      return res.json(response);
    } catch (error: any) {
      console.error("[Backend] /api/generate-images error:", error);
      if (!hasUserSuppliedApiKey(req) && isUpstreamQuotaError(error)) {
        markUpstreamQuotaExhausted();
      }
      const { status, message } = formatApiError(error, "Failed to generate images.");
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/generate-videos", requireAuthenticatedUser, async (req: any, res): Promise<any> => {
    try {
      const apiKey = assertValidApiKey(getClientApiKey(req));
      const quota = tryConsumeDailyQuota(req.authUser.uid);
      if (!quota.ok) {
        return res.status(429).json({ error: quota.error });
      }
      const body = { ...req.body };
      delete body.video;
      if (body.video && typeof body.video === 'object') { const c = { ...body.video }; delete c.uri; delete c.videoUri; body.video = Object.keys(c).length ? c : undefined; }
      delete body.source;
      body.model = resolveModel(body.model || "veo-3.1-fast-generate-preview");
      const op = await runWithApiKeyClient(apiKey, (ai) => ai.models.generateVideos(body));
      if (op.name) {
        videoOps.set(op.name, { op, ownerKey: req.authUser.uid });
      }
      return res.json({
        name: op.name,
        done: op.done,
        metadata: op.metadata,
        error: op.error,
        response: op.response,
      });
    } catch (error: any) {
      console.error("[Backend] /api/generate-videos error:", error);
      if (!hasUserSuppliedApiKey(req) && isUpstreamQuotaError(error)) {
        markUpstreamQuotaExhausted();
      }
      const { status, message } = formatApiError(error, "Failed to start video generation.");
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/videos-operation", requireAuthenticatedUser, async (req: any, res): Promise<any> => {
    try {
      const apiKey = assertValidApiKey(getClientApiKey(req));
      const opName = req.body?.operation?.name;
      const storedOp = opName ? videoOps.get(opName) : undefined;
      if (!storedOp || storedOp.ownerKey !== req.authUser.uid) {
        return res.status(404).json({ error: "Video operation not found on server." });
      }
      const op = await runWithApiKeyClient(apiKey, (ai) =>
        ai.operations.getVideosOperation({ operation: storedOp.op })
      );
      if (op.name) {
        videoOps.set(op.name, { op, ownerKey: req.authUser.uid });
      }
      const responseCopy = op.response ? JSON.parse(JSON.stringify(op.response)) : undefined;
      if (op.done && responseCopy?.generatedVideos) {
        for (const gv of responseCopy.generatedVideos) {
          if (gv.video?.uri) {
            const b64 = Buffer.from(gv.video.uri, "utf-8").toString("base64url");
            gv.video.uri = `/api/video-download?b64=${b64}`;
          }
        }
      }
      return res.json({
        name: op.name,
        done: op.done,
        metadata: op.metadata,
        error: op.error,
        response: responseCopy,
      });
    } catch (error: any) {
      console.error("[Backend] /api/videos-operation error:", error);
      const { status, message } = formatApiError(error, "Failed to poll video operation.");
      return res.status(status).json({ error: message });
    }
  });

  app.get("/api/video-download", (_req, res) => {
    res.status(404).json({ error: "Video download is not enabled for this applet." });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(["/server.cjs", "/server.cjs.map"], (_req: any, res: any) => res.status(404).end());
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Backend] Server running on http://localhost:${PORT}`);
  });
  httpServer.requestTimeout = 300_000;
  httpServer.headersTimeout = 65_000;
  httpServer.keepAliveTimeout = 60_000;
  httpServer.setTimeout(300_000);
}

startServer();
