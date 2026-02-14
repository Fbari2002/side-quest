export const SAVED_QUESTS_KEY = "sidequest.saved";

export type Energy = "low" | "medium" | "high";
export type Social = "solo" | "social";

export type QuestData = {
  title: string;
  vibe: string;
  steps: [string, string, string] | string[];
  twist: string;
  completion: string;
  soundtrack_query: string;
};

export type QuestInput = {
  mood: string;
  time_available: string;
  energy: Energy;
  social: Social;
  chaos: number;
  noSpend: boolean;
  lowSensory: boolean;
};

export type SavedQuestEntry = {
  id: string;
  savedAt: number;
  quest: QuestData;
  input?: QuestInput;
};

type SaveInput = {
  quest: QuestData;
  input?: QuestInput;
};

type SaveResult = {
  saved: boolean;
  entry?: SavedQuestEntry;
};

export function getSaved(): SavedQuestEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SAVED_QUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry): entry is SavedQuestEntry => isSavedQuestEntry(entry))
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export function saveQuest(entry: SaveInput): SaveResult {
  const existing = getSaved();
  if (isDuplicate(entry, existing)) {
    return { saved: false };
  }

  const nextEntry: SavedQuestEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: Date.now(),
    quest: entry.quest,
    input: entry.input,
  };

  const next = [nextEntry, ...existing];
  writeSaved(next);

  return { saved: true, entry: nextEntry };
}

export function deleteQuest(id: string): void {
  const next = getSaved().filter((entry) => entry.id !== id);
  writeSaved(next);
}

export function getQuestById(id: string): SavedQuestEntry | null {
  const entry = getSaved().find((item) => item.id === id);
  return entry || null;
}

export function isDuplicate(entry: SaveInput, existing: SavedQuestEntry[]): boolean {
  const title = normalize(entry.quest.title);
  const steps = normalizeSteps(entry.quest.steps);

  return existing.slice(0, 10).some((item) => {
    return normalize(item.quest.title) === title && normalizeSteps(item.quest.steps) === steps;
  });
}

export function findSavedIdByQuest(
  quest: QuestData,
  existing: SavedQuestEntry[] = getSaved(),
): string | null {
  const title = normalize(quest.title);
  const steps = normalizeSteps(quest.steps);

  const match = existing.find((item) => {
    return normalize(item.quest.title) === title && normalizeSteps(item.quest.steps) === steps;
  });

  return match?.id ?? null;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeSteps(steps: string[] | [string, string, string]): string {
  return steps.map((step) => step.trim().toLowerCase()).join("|");
}

function writeSaved(entries: SavedQuestEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_QUESTS_KEY, JSON.stringify(entries));
}

function isSavedQuestEntry(value: unknown): value is SavedQuestEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SavedQuestEntry>;
  if (typeof item.id !== "string") return false;
  if (typeof item.savedAt !== "number") return false;
  if (!item.quest || typeof item.quest !== "object") return false;

  const quest = item.quest as Partial<QuestData>;
  if (typeof quest.title !== "string") return false;
  if (typeof quest.vibe !== "string") return false;
  if (!Array.isArray(quest.steps) || quest.steps.length < 1) return false;
  if (typeof quest.twist !== "string") return false;
  if (typeof quest.completion !== "string") return false;
  if (typeof quest.soundtrack_query !== "string") return false;

  return true;
}
