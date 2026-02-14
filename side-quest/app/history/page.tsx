"use client";

import * as React from "react";
import Link from "next/link";
import { deleteQuest, getSaved, type SavedQuestEntry } from "@/lib/savedQuests";

export default function HistoryPage() {
  const [saved, setSaved] = React.useState<SavedQuestEntry[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setSaved(getSaved());
    setLoaded(true);
  }, []);

  function onDelete(id: string) {
    deleteQuest(id);
    setSaved(getSaved());
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/quest"
          className="inline-flex w-fit items-center text-sm text-[var(--muted)] transition hover:text-[var(--text)]"
        >
          ← Back to quest
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-[var(--line)] bg-[#0f162a] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
        >
          Home
        </Link>
      </div>

      <section className="main-card rounded-3xl p-5 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">History</p>
        <h1 className="mt-2 text-2xl font-semibold">Your SideQuest Archive</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Every micro-adventure you&apos;ve chosen.
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">You&apos;ve completed {saved.length} adventures so far ✨</p>
      </section>

      {loaded && saved.length === 0 && (
        <section className="main-card rounded-3xl p-6 text-center shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
          <h2 className="text-xl font-semibold">No saved quests yet</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Save one from the quest page and it will appear here.
          </p>
          <Link
            href="/quest"
            className="mt-4 inline-flex rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-2.5 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            Start a quest
          </Link>
        </section>
      )}

      {saved.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2">
          {saved.map((entry, index) => (
            <article
              key={entry.id}
              className={`main-card rounded-3xl p-5 transition motion-safe:duration-200 motion-safe:hover:scale-[1.01] motion-safe:hover:shadow-[0_16px_36px_rgba(0,0,0,0.34)] motion-reduce:transition-none ${
                index === 0
                  ? "border-[rgba(246,196,83,0.35)] shadow-[0_0_0_1px_rgba(246,196,83,0.24),0_14px_34px_rgba(0,0,0,0.3)]"
                  : "shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-[var(--line)] bg-[#101729] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  {entry.quest.vibe}
                </span>
                {entry.input?.energy && (
                  <span className="inline-flex rounded-full border border-[var(--line)] bg-[#101729] px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                    {entry.input.energy} energy
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-xl font-semibold leading-tight">{entry.quest.title}</h2>
              <p className="mt-1 text-[11px] text-[#7f8aa9]">{formatRelativeTime(entry.savedAt)}</p>

              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[var(--muted)]">
                {entry.quest.steps.slice(0, 2).map((step, i) => (
                  <li key={`${entry.id}-step-${i}`}>{step}</li>
                ))}
              </ol>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  href={`/history/${entry.id}`}
                  aria-label={`View saved quest ${entry.quest.title}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--accent)] bg-[linear-gradient(90deg,rgba(79,70,229,0.25),rgba(45,212,191,0.18))] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition hover:brightness-105"
                >
                  <ViewIcon />
                  View
                </Link>
                <button
                  type="button"
                  aria-label={`Delete saved quest ${entry.quest.title}`}
                  onClick={() => onDelete(entry.id)}
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:border-rose-400 hover:text-rose-200"
                >
                  <DeleteIcon />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function formatRelativeTime(savedAt: number): string {
  const diffMs = Date.now() - savedAt;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";

  if (diffMs < hour) {
    const mins = Math.max(1, Math.floor(diffMs / minute));
    return `${mins} min${mins === 1 ? "" : "s"} ago`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.max(1, Math.floor(diffMs / day));
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function ViewIcon() {
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
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DeleteIcon() {
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
