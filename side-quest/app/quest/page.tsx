"use client";

import * as React from "react";
import Link from "next/link";
import { formatQuestForShare, safeLine } from "@/lib/questShare";
import { saveQuest, type Energy, type QuestData, type QuestInput, type Social } from "@/lib/savedQuests";
type Quest = QuestData;

type FormState = QuestInput;

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
  const [generationMode, setGenerationMode] = React.useState<"online" | "offline" | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isRemixing, setIsRemixing] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [questVersion, setQuestVersion] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const { toastMessage, showToast } = useToast(2500);
  const moodInputRef = React.useRef<HTMLInputElement | null>(null);

  const announceText = loading
    ? "Activating Main Character Mode."
    : error || toastMessage || (quest ? "Quest ready." : "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await submitQuest("generate");
  }

  async function submitQuest(mode: "generate" | "remix" = "generate") {
    const requestAt = new Date().toISOString();
    if (process.env.NODE_ENV !== "production") {
      console.info(`[quest] ${mode} clicked at ${requestAt}`);
    }

    setIsRemixing(mode === "remix");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-sidequest-request-at": requestAt,
          "x-sidequest-cache-bust": requestAt,
        },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as Quest | { error?: string };
      const requestId = response.headers.get("x-request-id");
      const generationPath = response.headers.get("x-generation-path");
      const responseMode = response.headers.get("x-mode") === "offline" ? "offline" : "online";

      if (!response.ok || !("title" in data)) {
        const err = "error" in data ? data.error : undefined;
        throw new Error(err || "Could not generate a quest. Please retry.");
      }

      setQuest(data);
      setGenerationMode(responseMode);
      setQuestVersion((value) => value + 1);
      if (showOnboarding) setShowOnboarding(false);
      if (process.env.NODE_ENV !== "production") {
        console.info(
          `[quest] response ${requestId ?? "n/a"} path=${generationPath ?? "n/a"} title: ${data.title}`,
        );
      }
      showToast(responseMode === "offline" ? "Quest ready (offline mode)." : "Quest ready ✨");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsRemixing(false);
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
        showToast("Shared successfully.");
        return;
      }

      await navigator.clipboard.writeText(text);
      showToast("Copied quest to clipboard.");
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Share unavailable. Copied instead.");
      } catch {
        showToast("Share failed. Please try again.");
      }
    }
  }

  function onSaveQuest() {
    if (!quest) return;
    const result = saveQuest({ quest, input: form });
    showToast(result.saved ? "Saved to History ✨" : "Already saved");
  }

  const spotifyUrl = quest
    ? `https://open.spotify.com/search/${encodeURIComponent(quest.soundtrack_query)}`
    : "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-4 py-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex w-fit items-center text-sm text-[var(--muted)] transition hover:text-[var(--text)]"
        >
          ← Back
        </Link>
        <Link
          href="/history"
          aria-label="Open saved quest history"
          className="inline-flex items-center rounded-full border border-[var(--line)] bg-[#0f162a] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
        >
          History
        </Link>
      </div>

      <section className="main-card rounded-3xl p-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">SideQuest</p>
        <h1 className="mt-2 text-2xl font-semibold">Main Character Mode</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Wholesome, mysterious micro-adventures with low overwhelm.
        </p>
        {showOnboarding && (
          <p className="mt-2 inline-flex max-w-[36ch] items-center gap-2 text-xs text-[var(--muted)] sm:text-sm">
            <span
              aria-hidden="true"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--warm)] shadow-[0_0_10px_rgba(246,196,83,0.35)] animate-[pulse_2.8s_ease-in-out_infinite] motion-reduce:animate-none"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="currentColor"
              >
                <path d="M12 2.5 14 8l5.5 2-5.5 2-2 5.5-2-5.5-5.5-2L10 8l2-5.5Z" />
              </svg>
            </span>
            <span>Tell us how you&apos;re feeling - we&apos;ll tailor a micro-adventure for you.</span>
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {announceText}
        </p>

        <form className={showOnboarding ? "mt-3" : "mt-5"} onSubmit={onSubmit}>
          <fieldset disabled={loading} className="space-y-4 disabled:cursor-not-allowed disabled:opacity-80">
            <Labeled label="Mood">
              <input
                ref={moodInputRef}
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
              {loading ? "Summoning…" : "Generate quest"}
            </button>
          </fieldset>

          {error && (
            <div className="mt-3">
              <p className="text-sm text-rose-300">{error}</p>
              <div className="mt-2 flex gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => submitQuest("generate")}
                  disabled={loading}
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-[var(--text)] transition hover:border-[var(--accent)] disabled:opacity-60"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    moodInputRef.current?.focus();
                  }}
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                  Edit inputs
                </button>
              </div>
            </div>
          )}
        </form>
      </section>

      {loading && <QuestCardSkeleton />}

      {quest && (
        <section
          key={questVersion}
          aria-live="polite"
          className="main-card result-reveal rounded-3xl p-5 shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Quest ready</p>
            {generationMode === "offline" && (
              <span className="inline-flex rounded-full border border-[var(--line)] bg-[#101729] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                Offline mode
              </span>
            )}
          </div>
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
              className={`inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-3 text-sm font-medium transition hover:border-[var(--accent)] ${
                loading ? "pointer-events-none opacity-60" : ""
              }`}
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (loading) return;
                showToast("Opening Spotify…");
              }}
              aria-disabled={loading}
              aria-label="Open quest soundtrack in Spotify"
            >
              🎧 Play the vibe
            </a>
            <button
              type="button"
              onClick={onShareQuest}
              disabled={loading}
              aria-label="Share this quest"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-3 text-sm font-medium transition hover:border-[var(--warm)]"
            >
              <ShareIcon />
              Share quest
            </button>
          </div>
          <button
            type="button"
            onClick={onSaveQuest}
            disabled={loading}
            aria-label="Save this quest to history"
            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-3 text-sm font-medium transition hover:border-[var(--accent-2)] disabled:opacity-70"
          >
            Save
          </button>
        </section>
      )}

      {quest && (
        <button
          type="button"
          onClick={() => submitQuest("remix")}
          disabled={loading}
          aria-label="Remix this quest"
          className="main-card rounded-2xl px-4 py-3 text-sm font-semibold transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isRemixing ? "Remixing..." : "🔄 Remix"}
        </button>
      )}

      <Toast message={toastMessage} />
    </main>
  );
}

function useToast(durationMs: number) {
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const toastTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = React.useCallback(
    (message: string) => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToastMessage(message);
      toastTimerRef.current = window.setTimeout(() => setToastMessage(null), durationMs);
    },
    [durationMs],
  );

  return { toastMessage, showToast };
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed bottom-4 left-1/2 z-20 w-[min(92vw,24rem)] -translate-x-1/2"
    >
      <div className="rounded-xl border border-[var(--line)] bg-[#0d1426]/95 px-4 py-2 text-center text-sm text-[var(--text)] shadow-[0_10px_28px_rgba(0,0,0,0.35)] backdrop-blur">
        {message}
      </div>
    </div>
  );
}

function QuestCardSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="main-card rounded-3xl p-5 shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
    >
      <div className="h-3 w-20 animate-pulse rounded bg-[#1c2744]" />
      <div className="mt-3 h-8 w-4/5 animate-pulse rounded bg-[#1a2340]" />
      <div className="mt-3 h-4 w-3/5 animate-pulse rounded bg-[#1a2340]" />
      <div className="mt-5 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-[#15203a]" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-[#15203a]" />
        <div className="h-4 w-10/12 animate-pulse rounded bg-[#15203a]" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="h-11 animate-pulse rounded-2xl bg-[#111a2f]" />
        <div className="h-11 animate-pulse rounded-2xl bg-[#111a2f]" />
      </div>
    </section>
  );
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mr-2 h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 12v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-6" />
      <path d="m12 16 0-12" />
      <path d="m8.5 7.5 3.5-3.5 3.5 3.5" />
    </svg>
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
