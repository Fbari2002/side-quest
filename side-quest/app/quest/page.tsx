"use client";

import * as React from "react";
import Link from "next/link";

type Energy = "low" | "medium" | "high";
type Social = "solo" | "social";

type Quest = {
  title: string;
  vibe: string;
  steps: [string, string, string] | string[];
  twist: string;
  completion: string;
  soundtrack_query: string;
};

type FormState = {
  mood: string;
  time_available: string;
  energy: Energy;
  social: Social;
  chaos: number;
  noSpend: boolean;
  lowSensory: boolean;
};

const initialForm: FormState = {
  mood: "curious",
  time_available: "45 minutes",
  energy: "medium",
  social: "solo",
  chaos: 4,
  noSpend: false,
  lowSensory: false,
};

export default function QuestPage() {
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [quest, setQuest] = React.useState<Quest | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [shareMessage, setShareMessage] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShareMessage(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as Quest | { error?: string };

      if (!response.ok || !("title" in data)) {
        const err = "error" in data ? data.error : undefined;
        throw new Error(err || "Could not generate a quest. Please retry.");
      }

      setQuest(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onShareQuest() {
    if (!quest) return;

    const text = formatQuestForShare(quest);

    try {
      if (navigator.share) {
        await navigator.share({
          title: safeLine(quest.title, "SideQuest quest"),
          text,
          url: window.location.href,
        });
        return;
      }

      await navigator.clipboard.writeText(text);
      setShareMessage("Quest copied to clipboard.");
      window.setTimeout(() => setShareMessage(null), 2200);
    } catch {
      setShareMessage("Could not share right now.");
    }
  }

  const spotifyUrl = quest
    ? `https://open.spotify.com/search/${encodeURIComponent(quest.soundtrack_query)}`
    : "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-4 py-6 sm:py-10">
      <Link
        href="/"
        className="inline-flex w-fit items-center text-sm text-[var(--muted)] transition hover:text-[var(--text)]"
      >
        ← Back
      </Link>

      <section className="main-card rounded-3xl p-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">SideQuest</p>
        <h1 className="mt-2 text-2xl font-semibold">Main Character Mode</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Wholesome, mysterious micro-adventures with low overwhelm.
        </p>

        <form className="mt-5" onSubmit={onSubmit}>
          <fieldset disabled={loading} className="space-y-4 disabled:cursor-not-allowed disabled:opacity-80">
            <Labeled label="Mood">
              <input
                className={fieldClass}
                name="mood"
                value={form.mood}
                onChange={(e) => setForm((s) => ({ ...s, mood: e.target.value }))}
                placeholder="cozy, curious, brave"
                required
              />
            </Labeled>

            <Labeled label="Time available">
              <input
                className={fieldClass}
                name="time_available"
                value={form.time_available}
                onChange={(e) => setForm((s) => ({ ...s, time_available: e.target.value }))}
                placeholder="2 hours"
                required
              />
            </Labeled>

            <div className="grid grid-cols-2 gap-3">
              <Labeled label="Energy">
                <select
                  className={fieldClass}
                  value={form.energy}
                  onChange={(e) => setForm((s) => ({ ...s, energy: e.target.value as Energy }))}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
              </Labeled>

              <Labeled label="Mode">
                <select
                  className={fieldClass}
                  value={form.social}
                  onChange={(e) => setForm((s) => ({ ...s, social: e.target.value as Social }))}
                >
                  <option value="solo">solo</option>
                  <option value="social">social</option>
                </select>
              </Labeled>
            </div>

            <Labeled label={`Chaos: ${form.chaos}`}>
              <input
                className="w-full accent-[var(--accent)]"
                type="range"
                min={0}
                max={10}
                value={form.chaos}
                onChange={(e) => setForm((s) => ({ ...s, chaos: Number(e.target.value) }))}
              />
            </Labeled>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className={toggleClass}>
                <input
                  type="checkbox"
                  checked={form.noSpend}
                  onChange={(e) => setForm((s) => ({ ...s, noSpend: e.target.checked }))}
                />
                <span>No spend money</span>
              </label>

              <label className={toggleClass}>
                <input
                  type="checkbox"
                  checked={form.lowSensory}
                  onChange={(e) => setForm((s) => ({ ...s, lowSensory: e.target.checked }))}
                />
                <span>Low sensory</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[linear-gradient(90deg,var(--warm),var(--accent-2),var(--accent))] px-4 py-3 font-semibold text-[#081019] transition duration-300 hover:brightness-105 hover:shadow-[0_0_26px_rgba(246,196,83,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Activating Main Character Mode…" : "Generate quest"}
            </button>
          </fieldset>

          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        </form>
      </section>

      {quest && (
        <section className="main-card result-reveal rounded-3xl p-5 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Quest ready</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">{quest.title}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">{quest.vibe}</p>

          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-[var(--muted)]">Steps</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                {quest.steps.map((step, i) => (
                  <li key={`${step}-${i}`}>{step}</li>
                ))}
              </ol>
            </div>
            <Info label="Plot twist" value={quest.twist} />
            <Info label="To complete" value={quest.completion} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <a
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-3 text-sm font-medium transition hover:border-[var(--accent)]"
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              🎧 Play the vibe
            </a>
            <button
              type="button"
              onClick={onShareQuest}
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-3 text-sm font-medium transition hover:border-[var(--warm)]"
            >
              Share quest
            </button>
          </div>

          {shareMessage && <p className="mt-3 text-xs text-[var(--muted)]">{shareMessage}</p>}
        </section>
      )}
    </main>
  );
}

const fieldClass =
  "w-full rounded-2xl border border-[var(--line)] bg-[#0e1425] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(45,212,191,0.18)] disabled:opacity-70";

const toggleClass =
  "flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-[#0e1425] px-3 py-2";

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--muted)]">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function formatQuestForShare(quest: Partial<Quest>): string {
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

function safeLine(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.trim();
  return cleaned || fallback;
}
