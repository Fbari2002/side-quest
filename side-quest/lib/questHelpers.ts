export function weightedRandom(items: { item: any; weight: number }[]) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const { item, weight } of items) {
    acc += weight;
    if (r <= acc) return item;
  }
  return items[items.length - 1].item;
}

export function scoreQuest(quest: any, input: any) {
  let score = 0;
  const { mood, energy, social, chaos, lowSensory } = input;
  const tags = quest.fallback_for || [];

  if (tags.includes(energy)) score += 3;
  if (tags.includes("social") && social === "social") score += 2;
  if (tags.includes("calm") && (energy === "low" || lowSensory)) score += 2;
  if (tags.includes("chaotic") && chaos >= 7) score += 2;
  if (tags.includes("energetic") && energy === "high") score += 2;
  if (mood?.match(/curious|bored|restless|explore/i) && tags.includes("curious")) score += 1;
  if (mood?.match(/creative|idea|make|draw/i) && tags.includes("creative")) score += 1;
  if (mood?.match(/overwhelmed|sad|tired|thoughtful/i) && tags.includes("reflective")) score += 1;
  if (lowSensory && tags.includes("chaotic")) score -= 3;

  return score;
}

export function selectOfflineQuest(catalog: any[], input: any) {
  const scored = catalog.map((q) => ({
    item: q,
    weight: Math.max(scoreQuest(q, input), 0),
  }));
  const viable = scored.filter((q) => q.weight > 0);
  const pool = viable.length > 0 ? viable : scored.map((q) => ({ item: q.item, weight: 1 }));
  return weightedRandom(pool);
}
