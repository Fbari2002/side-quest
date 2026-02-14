"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import GlowCard from "@/components/GlowCard";
import Sparkle from "@/components/Sparkle";
import { copyText } from "@/lib/copy";
import { formatQuestForShare, safeLine } from "@/lib/questShare";
import { isMobileUA, openSpotifySearch, spotifyWebSearchUrl } from "@/lib/spotify";
import { getQuestById, saveQuest, type QuestData, type SavedQuestEntry } from "@/lib/savedQuests";

export default function SavedQuestDetailPage() {
  const params = useParams<{ id: string }>();
  const questId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [saved, setSaved] = React.useState<SavedQuestEntry | null>(null);
  const [displayQuest, setDisplayQuest] = React.useState<QuestData | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isRemixing, setIsRemixing] = React.useState(false);
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const { toastMessage, showToast } = useToast(2500);

  React.useEffect(() => {
    if (!questId) return;
    const entry = getQuestById(questId);
    setSaved(entry);
    setDisplayQuest(entry?.quest ?? null);
    setLoaded(true);
  }, [questId]);

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const activeQuest = displayQuest || saved?.quest || null;
  const spotifyUrl = activeQuest
    ? spotifyWebSearchUrl(activeQuest.soundtrack_query)
    : "";

  async function onShareQuest() {
    if (!activeQuest) return;

    const text = formatQuestForShare(activeQuest);

    try {
      if (navigator.share) {
        await navigator.share({
          title: safeLine(activeQuest.title, "SideQuest quest"),
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

  function openSpotifyInBrowser(url: string) {
    if (typeof window === "undefined") return;
    if (isMobileUA()) {
      window.location.href = url;
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function onRemixQuest() {
    if (!saved?.input) {
      showToast("Can’t remix this one (missing inputs).");
      return;
    }

    setIsRemixing(true);
    showToast("Remixing…");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saved.input),
      });

      const data = (await response.json()) as QuestData | { error?: string };
      if (!response.ok || !("title" in data)) {
        throw new Error("Could not remix this quest.");
      }

      setDisplayQuest(data);
      setIsVisible(false);
      window.requestAnimationFrame(() => setIsVisible(true));
      saveQuest({ quest: data, input: saved.input });
      showToast("Remix saved ✨");
    } catch {
      showToast("Could not remix right now.");
    } finally {
      setIsRemixing(false);
    }
  }

  return (
    <main className="page-enter mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-4 py-6 sm:py-10">
      <Link
        href="/history"
        aria-label="Back to quest history"
        className="inline-flex w-fit items-center text-sm text-[var(--muted)] transition hover:text-[var(--text)]"
      >
        ← Back to history
      </Link>

      {loaded && !saved && (
        <section className="main-card rounded-3xl p-6 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
          <h1 className="text-2xl font-semibold">Quest not found</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            This saved quest may have been deleted from local history.
          </p>
          <Link
            href="/history"
            className="mt-4 inline-flex rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-2.5 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            Back to history
          </Link>
        </section>
      )}

      {saved && activeQuest && (
        <GlowCard
          as="section"
          aria-live="polite"
          className={`main-card detail-reveal rounded-3xl p-5 shadow-[0_12px_30px_rgba(0,0,0,0.28)] ${
            isVisible ? "is-visible" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Saved quest</p>
          <div className="mt-2 flex items-center gap-2">
            <Sparkle />
            <h1 className="text-2xl font-semibold leading-tight">{activeQuest.title}</h1>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">{activeQuest.vibe}</p>

          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-[var(--muted)]">Steps</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                {activeQuest.steps.map((step, i) => (
                  <li key={`${step}-${i}`}>{step}</li>
                ))}
              </ol>
            </div>
            <Info label="Plot twist" value={activeQuest.twist} />
            <Info label="To complete" value={activeQuest.completion} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-label="Open saved quest soundtrack in Spotify"
              onClick={async () => {
                showToast("Opening Spotify…");
                await openSpotifySearch(activeQuest.soundtrack_query);
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-3 text-sm font-medium transition hover:border-[var(--accent)]"
            >
              🎧 Play the vibe
            </button>
            <button
              type="button"
              onClick={onShareQuest}
              aria-label="Share this saved quest"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-3 text-sm font-medium transition hover:border-[var(--warm)]"
            >
              <ShareIcon />
              Share quest
            </button>
            <button
              type="button"
              onClick={onRemixQuest}
              disabled={isRemixing}
              aria-label="Remix this saved quest"
              className="col-span-2 inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-3 text-sm font-medium transition hover:border-[var(--accent-2)] disabled:opacity-70"
            >
              {isRemixing ? "Remixing…" : "🔄 Remix"}
            </button>
            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              aria-label="More soundtrack actions"
              className="col-span-2 inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-3 text-sm font-medium transition hover:border-[var(--accent-2)]"
            >
              <MoreIcon />
              More
            </button>
          </div>
          {!saved.input && (
            <Link
              href="/quest"
              className="mt-2 inline-flex text-xs text-[var(--muted)] underline-offset-4 transition hover:text-[var(--text)] hover:underline"
            >
              Generate a new quest
            </Link>
          )}
        </GlowCard>
      )}

      {activeQuest && isMoreOpen && (
        <div
          className="fixed inset-0 z-30 flex items-end bg-black/40 p-3"
          onClick={() => setIsMoreOpen(false)}
          role="presentation"
        >
          <div
            className="w-full rounded-3xl border border-[var(--line)] bg-[#0d1426] p-3 shadow-[0_16px_36px_rgba(0,0,0,0.44)] transition motion-safe:animate-[resultReveal_220ms_ease-out_both] motion-reduce:animate-none"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="More actions"
          >
            <button
              type="button"
              className="inline-flex w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition hover:bg-white/5"
              onClick={() => {
                openSpotifyInBrowser(spotifyUrl);
                setIsMoreOpen(false);
              }}
            >
              Open Spotify in browser
            </button>
            <button
              type="button"
              className="inline-flex w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition hover:bg-white/5"
              onClick={async () => {
                const ok = await copyText(activeQuest.soundtrack_query);
                showToast(ok ? "Copied" : "Could not copy.");
                setIsMoreOpen(false);
              }}
            >
              Copy soundtrack search
            </button>
            <button
              type="button"
              className="inline-flex w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition hover:bg-white/5"
              onClick={async () => {
                const ok = await copyText(spotifyUrl);
                showToast(ok ? "Copied" : "Could not copy.");
                setIsMoreOpen(false);
              }}
            >
              Copy Spotify link
            </button>
            <button
              type="button"
              className="mt-1 inline-flex w-full justify-center rounded-2xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--muted)] transition hover:text-[var(--text)]"
              onClick={() => setIsMoreOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--muted)]">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
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

function MoreIcon() {
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
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
