import { NextResponse } from "next/server";
import OpenAI from "openai";
import offlineQuestCatalog from "@/lib/offline-quests.json";
import { selectOfflineQuest } from "@/lib/questHelpers";

export const dynamic = "force-dynamic";

type Energy = "low" | "medium" | "high";
type Social = "solo" | "social";

type GenerateInput = {
  mood: string;
  time_available: string;
  energy: Energy;
  social: Social;
  chaos: number;
  noSpend: boolean;
  lowSensory: boolean;
};

type Quest = {
  title: string;
  vibe: string;
  steps: [string, string, string];
  twist: string;
  completion: string;
  soundtrack_query: string;
};

type OfflineQuest = Quest & {
  fallback_for: string[];
};

const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const offlineQuests = offlineQuestCatalog as OfflineQuest[];
const recentTitles: string[] = [];
const GENERATION_TIMEOUT_MS = 7_000;
const API_COOLDOWN_MS = 15 * 60 * 1_000;

let apiDownUntil = 0;
let lastQuotaErrorAt = 0;

const questSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    vibe: { type: "string" },
    steps: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 3,
    },
    twist: { type: "string" },
    completion: { type: "string" },
    soundtrack_query: { type: "string" },
  },
  required: ["title", "vibe", "steps", "twist", "completion", "soundtrack_query"],
};

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const headers = responseHeaders(requestId);
  const isDev = process.env.NODE_ENV !== "production";

  try {
    const input = (await req.json()) as GenerateInput;
    const validationError = validateInput(input);
    if (validationError) {
      headers.set("X-Generation-Path", "validation-error");
      headers.set("X-Mode", "online");
      return NextResponse.json({ error: validationError }, { status: 400, headers });
    }

    if (!process.env.OPENAI_API_KEY) {
      if (process.env.NODE_ENV === "production") {
        headers.set("X-Generation-Path", "missing-key");
        headers.set("X-Mode", "online");
        return NextResponse.json({ error: "error" }, { status: 500, headers });
      }

      const quest = selectOfflineFallback(input, requestId, "missing-api-key");
      rememberTitle(quest.title);
      headers.set("X-Generation-Path", "offline-fallback-missing-key");
      headers.set("X-Mode", "offline");
      return NextResponse.json(quest, { headers });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await generateQuestWithCircuitBreaker(openai, input, requestId);
    rememberTitle(result.quest.title);

    if (isDev) {
      console.info(`[/api/generate][${requestId}] generation path: ${result.path}`);
    }

    headers.set("X-Generation-Path", result.path);
    headers.set("X-Mode", result.mode);
    return NextResponse.json(result.quest, { headers });
  } catch {
    headers.set("X-Mode", "online");
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers });
  }
}

function validateInput(input: GenerateInput): string | null {
  if (!input || typeof input !== "object") return "Invalid payload.";
  if (!input.mood?.trim()) return "mood is required.";
  if (!input.time_available?.trim()) return "time_available is required.";
  if (!["low", "medium", "high"].includes(input.energy)) return "Invalid energy.";
  if (!["solo", "social"].includes(input.social)) return "Invalid social value.";
  if (typeof input.chaos !== "number" || input.chaos < 0 || input.chaos > 10) return "Invalid chaos.";
  if (typeof input.noSpend !== "boolean") return "Invalid noSpend.";
  if (typeof input.lowSensory !== "boolean") return "Invalid lowSensory.";
  return null;
}

async function generateQuestWithCircuitBreaker(
  openai: OpenAI,
  input: GenerateInput,
  requestId: string,
): Promise<{ quest: Quest; path: string; mode: "offline" | "online" }> {
  if (Date.now() < apiDownUntil) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[circuit-breaker] offline until ${new Date(apiDownUntil).toISOString()}`);
    }
    return {
      quest: selectOfflineFallback(input, requestId, "circuit-breaker-open"),
      path: "circuit-breaker-open",
      mode: "offline",
    };
  }

  try {
    const timedResult = await withTimeout(
      generateQuestOnline(openai, input, requestId),
      GENERATION_TIMEOUT_MS,
    );

    if (timedResult.path === "fallback") {
      return { ...timedResult, mode: "offline" };
    }

    return { ...timedResult, mode: "online" };
  } catch (error) {
    if (isQuotaOrRateError(error)) {
      lastQuotaErrorAt = Date.now();
      apiDownUntil = lastQuotaErrorAt + API_COOLDOWN_MS;

      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[circuit-breaker] offline until ${new Date(apiDownUntil).toISOString()} after quota/rate-limit at ${new Date(lastQuotaErrorAt).toISOString()}`,
        );
      }

      return {
        quest: selectOfflineFallback(input, requestId, "quota-or-rate-limit"),
        path: "quota-or-rate-limit",
        mode: "offline",
      };
    }

    if (isTimeoutError(error)) {
      return {
        quest: selectOfflineFallback(input, requestId, "openai-timeout"),
        path: "openai-timeout",
        mode: "offline",
      };
    }

    return {
      quest: selectOfflineFallback(input, requestId, "openai-request-failed"),
      path: "openai-request-failed",
      mode: "offline",
    };
  }
}

async function generateQuestOnline(
  openai: OpenAI,
  input: GenerateInput,
  requestId: string,
): Promise<{ quest: Quest; path: "primary" | "repair" | "fallback" }> {
  const firstAttempt = await createStructuredQuest(openai, generationPrompt(input), requestId, "primary");
  if (firstAttempt.quest) {
    return { quest: firstAttempt.quest, path: "primary" };
  }
  if (firstAttempt.error) {
    throw firstAttempt.error;
  }

  const secondAttempt = await createStructuredQuest(
    openai,
    repairPrompt(firstAttempt.raw || "No valid JSON received."),
    requestId,
    "repair",
  );
  if (secondAttempt.quest) {
    return { quest: secondAttempt.quest, path: "repair" };
  }
  if (secondAttempt.error) {
    throw secondAttempt.error;
  }

  return {
    quest: selectOfflineFallback(input, requestId, "openai-failure-or-parse"),
    path: "fallback",
  };
}

async function createStructuredQuest(
  openai: OpenAI,
  prompt: string,
  requestId: string,
  phase: "primary" | "repair",
): Promise<{ quest: Quest | null; raw: string; error?: unknown }> {
  const isDev = process.env.NODE_ENV !== "production";

  try {
    const response = await openai.responses.create({
      model,
      temperature: 0.8,
      max_output_tokens: 220,
      text: {
        format: {
          type: "json_schema",
          name: "sidequest_v1",
          strict: true,
          schema: questSchema,
        },
      },
      input: [
        {
          role: "system",
          content: "You generate safe, legal SideQuest adventures. Output must match schema and be concise.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw =
      (response.output_text || extractTextFromOutput(response.output as unknown[]) || "").trim();
    const parsed = parseQuest(raw);

    if (isDev && !parsed) {
      console.warn(`[/api/generate][${requestId}] ${phase} parse failed.`);
    }

    return { quest: parsed, raw };
  } catch (error) {
    if (isDev) {
      const message = error instanceof Error ? error.message : "Unknown OpenAI error";
      console.warn(`[/api/generate][${requestId}] ${phase} failed; falling back. ${message}`);
    }
    return { quest: null, raw: "", error };
  }
}

function generationPrompt(input: GenerateInput): string {
  return `Generate one SideQuest JSON.
Rules: 3 steps only; each under 20 words; safe/legal; match time_available and energy; if social=solo require no interaction; if noSpend=true avoid paid suggestions; if lowSensory=true avoid crowds/loud/bright/intense social; lightly use "Main Character".
Input: ${JSON.stringify(input)}`;
}

function repairPrompt(badOutput: string): string {
  return `Repair this into strict JSON matching schema and rules exactly. Return JSON only.\n\n${badOutput}`;
}

function parseQuest(text: string): Quest | null {
  const trimmed = text.trim();
  const candidates = [trimmed, extractFirstJsonObject(trimmed)].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Partial<Quest>;
      const normalized = normalizeQuest(parsed);
      if (normalized) return normalized;
    } catch {
      continue;
    }
  }

  return null;
}

function normalizeQuest(value: Partial<Quest>): Quest | null {
  const title = normalizeLine(value.title);
  const vibe = normalizeLine(value.vibe);
  const twist = normalizeLine(value.twist);
  const completion = normalizeLine(value.completion);
  const soundtrack_query = normalizeLine(value.soundtrack_query);

  const baseSteps = Array.isArray(value.steps)
    ? value.steps.map((step) => (typeof step === "string" ? step.trim() : "")).filter(Boolean)
    : [];

  const steps = baseSteps.filter((step) => step.split(/\s+/).length < 20).slice(0, 3);

  while (steps.length < 3) {
    steps.push("Take one calm breath and note one vivid detail around you.");
  }

  if (!title || !vibe || !twist || !completion || !soundtrack_query) return null;

  return {
    title,
    vibe,
    steps: [steps[0], steps[1], steps[2]],
    twist,
    completion,
    soundtrack_query,
  };
}

function selectOfflineFallback(input: GenerateInput, requestId: string, reason: string): Quest {
  if (!offlineQuests.length) {
    const emergency = emergencyFallback(input);
    if (process.env.NODE_ENV !== "production") {
      console.info(`[/api/generate][${requestId}] offline fallback selected: ${emergency.title} (emergency)`);
    }
    return emergency;
  }

  let selected = selectOfflineQuest(offlineQuests, input) as OfflineQuest;
  let rerolls = 0;

  while (recentTitles.includes(selected.title) && rerolls < 3 && offlineQuests.length > 1) {
    rerolls += 1;
    selected = selectOfflineQuest(offlineQuests, input) as OfflineQuest;
  }

  const questData: Partial<Quest> = {
    title: selected.title,
    vibe: selected.vibe,
    steps: selected.steps,
    twist: selected.twist,
    completion: selected.completion,
    soundtrack_query: selected.soundtrack_query,
  };
  const normalized = normalizeQuest(questData);
  const quest = normalized || emergencyFallback(input);

  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[/api/generate][${requestId}] offline fallback selected: ${quest.title}; reason=${reason}; rerolls=${rerolls}; recent=[${recentTitles.join(", ")}]`,
    );
  }

  return quest;
}

function rememberTitle(title: string): void {
  recentTitles.push(title);
  if (recentTitles.length > 5) {
    recentTitles.shift();
  }
}

function emergencyFallback(input: GenerateInput): Quest {
  return {
    title: "Main Character: Tiny Mystery Route",
    vibe: `A ${input.mood} energy quest tuned for ${input.time_available}.`,
    steps: [
      "Choose one nearby place that feels safe and easy.",
      "Capture one photo and write one clue about this moment.",
      "Save the clue and pick one tiny next action.",
    ],
    twist: "Treat this clue as a message from your future self.",
    completion: "Done when the clue is saved and your next action is written.",
    soundtrack_query: "cinematic cozy mystery lofi",
  };
}

function extractFirstJsonObject(text: string): string | null {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

function normalizeLine(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function responseHeaders(requestId: string): Headers {
  const headers = new Headers();
  headers.set("Cache-Control", "no-store");
  headers.set("X-Request-Id", requestId);
  return headers;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutRef: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutRef = setTimeout(() => reject(new Error("OPENAI_TIMEOUT")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutRef) {
      clearTimeout(timeoutRef);
    }
  }
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.message === "OPENAI_TIMEOUT";
}

function isQuotaOrRateError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const openaiError = error as {
    status?: unknown;
    code?: unknown;
    error?: { code?: unknown };
  };

  const status = typeof openaiError.status === "number" ? openaiError.status : null;
  const topCode = typeof openaiError.code === "string" ? openaiError.code : "";
  const nestedCode =
    openaiError.error && typeof openaiError.error.code === "string" ? openaiError.error.code : "";
  const combined = `${topCode} ${nestedCode}`.toLowerCase();

  return (
    status === 429 ||
    combined.includes("insufficient_quota") ||
    combined.includes("rate_limit")
  );
}

function extractTextFromOutput(output: unknown[]): string {
  if (!Array.isArray(output)) return "";
  const parts: string[] = [];

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) {
        parts.push(text);
      }
    }
  }

  return parts.join("\n");
}
