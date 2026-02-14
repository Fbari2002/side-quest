import { NextResponse } from "next/server";
import OpenAI from "openai";

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

const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const questSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    vibe: { type: "string" },
    steps: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { type: "string" },
    },
    twist: { type: "string" },
    completion: { type: "string" },
    soundtrack_query: { type: "string" },
  },
  required: ["title", "vibe", "steps", "twist", "completion", "soundtrack_query"],
};

export async function POST(req: Request) {
  try {
    const input = (await req.json()) as GenerateInput;
    const validationError = validateInput(input);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(fallbackQuest(input));
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const quest = await generateQuest(openai, input);
    return NextResponse.json(quest);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
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

async function generateQuest(openai: OpenAI, input: GenerateInput): Promise<Quest> {
  const firstAttempt = await createStructuredQuest(openai, generationPrompt(input));
  if (firstAttempt.quest) return firstAttempt.quest;

  const secondAttempt = await createStructuredQuest(
    openai,
    repairPrompt(firstAttempt.raw || "No valid JSON received."),
  );
  if (secondAttempt.quest) return secondAttempt.quest;

  return fallbackQuest(input);
}

async function createStructuredQuest(
  openai: OpenAI,
  prompt: string,
): Promise<{ quest: Quest | null; raw: string }> {
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
          content:
            "You generate safe, legal SideQuest adventures. Output must match schema and be concise.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = (response.output_text || "").trim();
    const parsed = parseQuest(raw);
    return { quest: parsed, raw };
  } catch {
    return { quest: null, raw: "" };
  }
}

function generationPrompt(input: GenerateInput): string {
  return `Generate one SideQuest in strict JSON.

Rules:
- Exactly 3 steps, each under 20 words
- Respect time_available and energy
- If social is "solo", no required interactions
- If noSpend is true, no paid suggestions
- If lowSensory is true, avoid crowds, loud/bright places, intense social
- Safe and legal only
- Lightly address user as "Main Character" without cringe

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

  const steps = baseSteps
    .filter((step) => step.split(/\s+/).length < 20)
    .slice(0, 3);

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

function extractFirstJsonObject(text: string): string | null {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

function normalizeLine(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function fallbackQuest(input: GenerateInput): Quest {
  const sensoryLine = input.lowSensory
    ? "Choose a quiet, low-light spot and keep sounds gentle."
    : "Choose a comfortable place that matches your mood.";
  const socialLine =
    input.social === "social"
      ? "Invite one trusted person for ten calm minutes."
      : "Keep it solo with no required interactions.";
  const spendLine = input.noSpend ? "Use what you already have. Spend nothing." : "Optional: bring a small cozy treat.";

  return {
    title: "Main Character: Tiny Mystery Route",
    vibe: `A ${input.mood} energy quest tuned for ${input.time_available}.`,
    steps: [
      sensoryLine,
      `${socialLine} ${spendLine}`.trim(),
      "Take a short walk, capture one photo, then write one clue sentence.",
    ],
    twist: "Treat the photo as a clue from your future self, Main Character.",
    completion: "Quest complete when you save the clue and summarize the moment in one sentence.",
    soundtrack_query: "cinematic cozy mystery lofi",
  };
}
