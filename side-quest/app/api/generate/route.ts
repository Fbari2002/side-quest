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
      return NextResponse.json({ error: validationError }, { status: 400, headers });
    }

    if (!process.env.OPENAI_API_KEY) {
      if (process.env.NODE_ENV === "production") {
        headers.set("X-Generation-Path", "missing-key");
        return NextResponse.json({ error: "error" }, { status: 500, headers });
      }

      const quest = selectOfflineFallback(input, requestId, "missing-api-key");
      rememberTitle(quest.title);
      headers.set("X-Generation-Path", "offline-fallback-missing-key");
      return NextResponse.json(quest, { headers });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await generateQuest(openai, input, requestId);
    rememberTitle(result.quest.title);

    if (isDev) {
      console.info(`[/api/generate][${requestId}] generation path: ${result.path}`);
    }

    headers.set("X-Generation-Path", result.path);
    return NextResponse.json(result.quest, { headers });
  } catch {
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

async function generateQuest(
  openai: OpenAI,
  input: GenerateInput,
  requestId: string,
): Promise<{ quest: Quest; path: "primary" | "repair" | "fallback" }> {
  const firstAttempt = await createStructuredQuest(
    openai,
    generationPrompt(input, requestId),
    requestId,
    "primary",
  );
  if (firstAttempt.quest) {
    return { quest: firstAttempt.quest, path: "primary" };
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
): Promise<{ quest: Quest | null; raw: string }> {
  const isDev = process.env.NODE_ENV !== "production";

  try {
    const response = await openai.responses.create({
      model,
      temperature: 0.8,
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
    return { quest: null, raw: "" };
  }
}

function generationPrompt(input: GenerateInput, requestId: string): string {
  return `Generate one SideQuest in strict JSON.

Rules:
- Exactly 3 steps, each under 20 words
- Respect time_available and energy
- If social is "solo", no required interactions
- If noSpend is true, no paid suggestions
- If lowSensory is true, avoid crowds, loud/bright places, intense social
- Safe and legal only
- Lightly address user as "Main Character" without cringe
- Use this variation token to diversify phrasing: ${requestId}

Input:
${JSON.stringify(input)}`;
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

  const { fallback_for: _fallback, ...questData } = selected;
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
