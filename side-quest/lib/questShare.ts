import type { QuestData } from "@/lib/savedQuests";

export function formatQuestForShare(quest: Partial<QuestData>): string {
  const title = safeLine(quest.title, "Untitled Quest");
  const vibe = safeLine(quest.vibe, "Mysterious");
  const twist = safeLine(quest.twist, "A tiny surprise appears.");
  const completion = safeLine(quest.completion, "When you feel complete, mark it done.");
  const soundtrackQuery = safeLine(quest.soundtrack_query, "cinematic cozy mystery lofi");

  const rawSteps = Array.isArray(quest.steps) ? quest.steps : [];
  const steps = rawSteps
    .map((step) => safeLine(step, ""))
    .filter(Boolean)
    .slice(0, 3);

  while (steps.length < 3) {
    steps.push("Take one small mindful action.");
  }

  return [
    `SideQuest: ${title}`,
    `Vibe: ${vibe}`,
    `1) ${steps[0]}`,
    `2) ${steps[1]}`,
    `3) ${steps[2]}`,
    `Plot twist: ${twist}`,
    `To complete: ${completion}`,
    `🎧 https://open.spotify.com/search/${encodeURIComponent(soundtrackQuery)}`,
  ].join("\n");
}

export function safeLine(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim();
  return cleaned || fallback;
}
