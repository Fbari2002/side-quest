import Link from "next/link";

const moods = [
  { label: "Calm", glow: "shadow-[0_0_0_1px_rgba(45,212,191,0.25),0_0_18px_rgba(45,212,191,0.12)]" },
  { label: "Curious", glow: "shadow-[0_0_0_1px_rgba(79,70,229,0.3),0_0_18px_rgba(79,70,229,0.14)]" },
  { label: "Chaotic", glow: "shadow-[0_0_0_1px_rgba(251,113,133,0.26),0_0_18px_rgba(251,113,133,0.12)]" },
  { label: "Cosy", glow: "shadow-[0_0_0_1px_rgba(246,196,83,0.26),0_0_18px_rgba(246,196,83,0.12)]" },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-4 py-6 sm:py-10">
      <section className="main-card rounded-3xl p-6 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">SideQuest</p>
        <h1 className="mt-2 text-[2.15rem] font-semibold leading-[1.12] sm:text-[2.35rem]">
          Activate Main Character Mode.
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Tiny, mood-matched side quests.
          <br />
          Calm when you need calm.
          <br />
          Chaos when you need chaos.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">No pressure. Just playful momentum.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {moods.map((mood) => (
            <span
              key={mood.label}
              className={`inline-flex rounded-full border border-[var(--line)] bg-[#0f172f]/85 px-3 py-1 text-[11px] tracking-[0.04em] text-[var(--text)] ${mood.glow}`}
            >
              {mood.label}
            </span>
          ))}
        </div>

        <Link
          href="/quest"
          className="group relative mt-5 inline-flex w-full items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(90deg,var(--warm),var(--accent-2),var(--accent))] px-4 py-3 font-semibold text-[#081019] transition duration-300 hover:-translate-y-[1px] hover:brightness-[1.03] hover:shadow-[0_0_30px_rgba(246,196,83,0.3)] active:scale-[0.98] active:duration-150"
        >
          <span className="pointer-events-none absolute inset-y-0 -left-[36%] w-[34%] -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition duration-700 group-hover:translate-x-[420%] group-hover:opacity-100" />
          <span className="relative z-10">Start a SideQuest</span>
        </Link>
        <Link
          href="/history"
          className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)]"
        >
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
            <path d="M6 3h9l3 3v15H6z" />
            <path d="M9 3v6h6V3" />
            <path d="M9 17h6" />
          </svg>
          Saved quests
        </Link>
      </section>

      <section className="main-card rounded-3xl p-6 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
          <li>Tell us your energy.</li>
          <li>Get a tailored side quest.</li>
          <li>Feel different in under 30 minutes.</li>
        </ol>
      </section>

      <section className="main-card relative rounded-3xl p-5 opacity-95 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
        <div className="pointer-events-none absolute left-[18%] right-[18%] top-0 h-px bg-[linear-gradient(90deg,rgba(246,196,83,0.7),rgba(79,70,229,0.52),rgba(45,212,191,0.6))]" />
        <p className="text-xs tracking-[0.14em] text-[var(--muted)]">✨ Example quest</p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight">The Colour Hunt</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Playful curiosity</p>

        <div className="mt-4 space-y-4 text-sm">
          <div>
            <p className="text-[var(--muted)]">Steps</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              <li>Take a 20-minute walk and collect 3 colours you&apos;ve never noticed before.</li>
              <li>Photograph one and write a one-line story about it.</li>
              <li>Play a song that matches that colour&apos;s mood.</li>
            </ol>
          </div>

          <Info label="Plot twist" value="You must choose the colour that feels most like today's main character." />
          <Info label="To complete" value="Share the colour + song with someone or save it in your notes." />
        </div>

        <button
          type="button"
          disabled
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-[var(--line)] bg-[#0c1221] px-4 py-3 text-sm font-medium opacity-65"
        >
          🎧 Play the vibe
        </button>
      </section>
    </main>
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
