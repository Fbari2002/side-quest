"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import GlowCard from "@/components/GlowCard";
import Sparkle from "@/components/Sparkle";
import { formatQuestForShare, safeLine } from "@/lib/questShare";
import { getQuestById, type SavedQuestEntry } from "@/lib/savedQuests";

export default function SavedQuestDetailPage() {
  const params = useParams<{ id: string }>();
  const questId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [saved, setSaved] = React.useState<SavedQuestEntry | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const { toastMessage, showToast } = useToast(2500);

  React.useEffect(() => {
    if (!questId) return;
    setSaved(getQuestById(questId));
    setLoaded(true);
  }, [questId]);

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const spotifyUrl = saved
    ? `https://open.spotify.com/search/${encodeURIComponent(saved.quest.soundtrack_query)}`
    : "";

  async function onShareQuest() {
    if (!saved) return;

    const text = formatQuestForShare(saved.quest);

    try {
      if (navigator.share) {
        await navigator.share({
          title: safeLine(saved.quest.title, "SideQuest quest"),
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

      {saved && (
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
            <h1 className="text-2xl font-semibold leading-tight">{saved.quest.title}</h1>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">{saved.quest.vibe}</p>

          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-[var(--muted)]">Steps</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                {saved.quest.steps.map((step, i) => (
                  <li key={`${step}-${i}`}>{step}</li>
                ))}
              </ol>
            </div>
            <Info label="Plot twist" value={saved.quest.twist} />
            <Info label="To complete" value={saved.quest.completion} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open saved quest soundtrack in Spotify"
              onClick={() => showToast("Opening Spotify…")}
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-3 text-sm font-medium transition hover:border-[var(--accent)]"
            >
              🎧 Play the vibe
            </a>
            <button
              type="button"
              onClick={onShareQuest}
              aria-label="Share this saved quest"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-3 text-sm font-medium transition hover:border-[var(--warm)]"
            >
              <ShareIcon />
              Share quest
            </button>
          </div>
        </GlowCard>
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
