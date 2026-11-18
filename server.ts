/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import JSZip from "jszip";
import { VOICE_DATA } from "./constants";

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

function createAiClient(apiKey: string) {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function formatApiError(error: any, fallbackMessage: string): { status: number; message: string } {
  const rawMessage = String(error?.message || fallbackMessage);
  const status =
    typeof error?.status === "number" && error.status >= 400
      ? error.status
      : rawMessage.includes("429") || rawMessage.includes("RESOURCE_EXHAUSTED")
      ? 429
      : 500;

  if (status === 429) {
    return {
      status: 429,
      message: "Rate limit or quota exceeded. Please wait a moment and try again, or check your API key plan in Settings > Secrets.",
    };
  }

  return { status, message: rawMessage };
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

const sampleAudioCache = new BoundedMap<string, { buffer: Buffer; contentType: string }>(40);

async function fetchVoiceSampleBuffer(voice: {
  name: string;
  audioSampleUrl: string;
}): Promise<{ buffer: Buffer; contentType: string }> {
  const cached = sampleAudioCache.get(voice.name);
  if (cached) return cached;

  const response = await fetch(voice.audioSampleUrl, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch sample for ${voice.name} (${response.status})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "audio/wav";
  const entry = { buffer, contentType };
  sampleAudioCache.set(voice.name, entry);
  return entry;
}

  app.get("/api/voice-sample/:voiceName", async (req, res): Promise<any> => {
    try {
      const rawName = typeof req.params?.voiceName === "string" ? req.params.voiceName.trim() : "";
      const voice = VOICE_BY_NAME.get(rawName);
      if (!voice) {
        return res.status(404).json({ error: "Voice sample not found." });
      }

      const entry = await fetchVoiceSampleBuffer(voice);
      res.setHeader("Content-Type", entry.contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(entry.buffer);
    } catch (error: any) {
      console.error("[Backend] /api/voice-sample error:", error);
      return res.status(502).json({
        error: error?.message || "Failed to load voice sample.",
      });
    }
  });

  app.post("/api/favorites-zip", async (req, res): Promise<any> => {
    try {
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
      const results = await Promise.all(
        targetVoices.map(async (voice) => {
          const entry = await fetchVoiceSampleBuffer(voice);
          return { name: voice.name, buffer: entry.buffer };
        })
      );

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
      return res.status(502).json({
        error: error?.message || "Failed to bundle favorited audio samples.",
      });
    }
  });

  app.post("/api/tts", async (req, res): Promise<any> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "API key is not configured. Please add your GEMINI_API_KEY in Settings > Secrets.",
        });
      }

      const rawText = typeof req.body?.text === "string" ? req.body.text.trim() : "";
      const voiceName = typeof req.body?.voiceName === "string" ? req.body.voiceName.trim() : "";
      const style = typeof req.body?.style === "string" ? req.body.style.trim() : "";

      if (!rawText) {
        return res.status(400).json({ error: "Text is required for speech generation." });
      }
      if (!voiceName) {
        return res.status(400).json({ error: "Voice name is required." });
      }

      const text = rawText.slice(0, 2500);
      const ai = createAiClient(apiKey);

      const part: any = { text };
      if (style) {
        part.speechMetadata = { style };
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
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
        return res.status(502).json({ error: "No audio data was returned by the TTS model." });
      }

      const rawBuffer = Buffer.from(base64Audio, "base64");
      const wavBuffer = ensureWavBuffer(rawBuffer, inlineData?.mimeType);

      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Cache-Control", "no-store");
      return res.send(wavBuffer);
    } catch (error: any) {
      console.error("[Backend] /api/tts error:", error);
      const { status, message } = formatApiError(error, "Failed to generate speech.");
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/generate-content", async (req, res): Promise<any> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "API key is not configured. Please add your GEMINI_API_KEY in Settings > Secrets.",
        });
      }
      const ai = createAiClient(apiKey);
      const params = { ...req.body, model: resolveModel(req.body?.model) };
      const response = await ai.models.generateContent(params);
      return res.json(serializeGenerateContentResponse(response));
    } catch (error: any) {
      console.error("[Backend] /api/generate-content error:", error);
      const { status, message } = formatApiError(error, "Failed to generate content.");
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/generate-content-stream", async (req, res): Promise<any> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "API key is not configured. Please add your GEMINI_API_KEY in Settings > Secrets.",
        });
      }
      const ai = createAiClient(apiKey);
      const params = { ...req.body, model: resolveModel(req.body?.model) };
      const stream = await ai.models.generateContentStream(params);
      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      for await (const chunk of stream) {
        res.write(JSON.stringify(serializeGenerateContentResponse(chunk)) + "\n");
      }
      res.end();
    } catch (error: any) {
      console.error("[Backend] /api/generate-content-stream error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message || "Failed to stream content." });
      }
      res.end();
    }
  });

  app.post("/api/chat-message", async (req, res): Promise<any> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "API key is not configured. Please add your GEMINI_API_KEY in Settings > Secrets.",
        });
      }
      const { sessionId, model, config, history, message, msgConfig } = req.body || {};
      const ai = createAiClient(apiKey);
      const chatKey = sessionId ? `${getClientKey(req)}:${String(sessionId).slice(0, 128)}` : "";
      let chat = chatKey ? chats.get(chatKey) : undefined;
      if (!chat) {
        chat = ai.chats.create({
          model: resolveModel(model),
          config,
          history,
        });
        if (chatKey) chats.set(chatKey, chat);
      }
      const response = await chat.sendMessage({ message, config: msgConfig });
      return res.json(serializeGenerateContentResponse(response));
    } catch (error: any) {
      console.error("[Backend] /api/chat-message error:", error);
      const { status, message } = formatApiError(error, "Failed to send chat message.");
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/chat-stream", async (req, res): Promise<any> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "API key is not configured. Please add your GEMINI_API_KEY in Settings > Secrets.",
        });
      }
      const { sessionId, model, config, history, message, msgConfig } = req.body || {};
      const ai = createAiClient(apiKey);
      const chatKey = sessionId ? `${getClientKey(req)}:${String(sessionId).slice(0, 128)}` : "";
      let chat = chatKey ? chats.get(chatKey) : undefined;
      if (!chat) {
        chat = ai.chats.create({
          model: resolveModel(model),
          config,
          history,
        });
        if (chatKey) chats.set(chatKey, chat);
      }
      const stream = await chat.sendMessageStream({ message, config: msgConfig });
      res.setHeader("Content-Type", "application/x-ndjson");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      for await (const chunk of stream) {
        res.write(JSON.stringify(serializeGenerateContentResponse(chunk)) + "\n");
      }
      res.end();
    } catch (error: any) {
      console.error("[Backend] /api/chat-stream error:", error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message || "Failed to stream chat message." });
      }
      res.end();
    }
  });

  app.post("/api/generate-images", async (req, res): Promise<any> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "API key is not configured. Please add your GEMINI_API_KEY in Settings > Secrets.",
        });
      }
      const ai = createAiClient(apiKey);
      const response = await ai.models.generateImages({ ...req.body, model: resolveModel(req.body?.model || "imagen-3.0-generate-002") });
      return res.json(response);
    } catch (error: any) {
      console.error("[Backend] /api/generate-images error:", error);
      const { status, message } = formatApiError(error, "Failed to generate images.");
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/generate-videos", async (req, res): Promise<any> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "API key is not configured. Please add your GEMINI_API_KEY in Settings > Secrets.",
        });
      }
      const ai = createAiClient(apiKey);
      const body = { ...req.body };
      delete body.video;
      if (body.video && typeof body.video === 'object') { const c = { ...body.video }; delete c.uri; delete c.videoUri; body.video = Object.keys(c).length ? c : undefined; }
      delete body.source;
      body.model = resolveModel(body.model || "veo-3.1-fast-generate-preview");
      const op = await ai.models.generateVideos(body);
      if (op.name) {
        videoOps.set(op.name, { op, ownerKey: getClientKey(req) });
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
      const { status, message } = formatApiError(error, "Failed to start video generation.");
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/videos-operation", async (req, res): Promise<any> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: "API key is not configured. Please add your GEMINI_API_KEY in Settings > Secrets.",
        });
      }
      const ai = createAiClient(apiKey);
      const opName = req.body?.operation?.name;
      const storedOp = opName ? videoOps.get(opName) : undefined;
      if (!storedOp) {
        return res.status(404).json({ error: "Video operation not found on server." });
      }
      const op = await ai.operations.getVideosOperation({ operation: storedOp.op });
      if (op.name) {
        videoOps.set(op.name, { op, ownerKey: getClientKey(req) });
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
      server: { middlewareMode: true },
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Backend] Server running on http://localhost:${PORT}`);
  });
}

startServer();
