import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-4 py-6 sm:py-10">
      <section className="main-card rounded-3xl p-6 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">SideQuest</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">Main Character Mode for micro-adventures.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          SideQuest generates wholesome, mysterious micro-adventures tailored to your mood, energy
          and time. Designed to be low-overwhelm and neurodivergent-friendly. No pressure. Just
          playful momentum.
        </p>

        <Link
          href="/quest"
          className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(90deg,var(--warm),var(--accent-2),var(--accent))] px-4 py-3 font-semibold text-[#081019] transition duration-300 hover:brightness-105 hover:shadow-[0_0_26px_rgba(246,196,83,0.28)]"
        >
          Start your quest
        </Link>
      </section>

      <section className="main-card rounded-3xl p-6 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
          <li>Pick your vibe</li>
          <li>Generate your quest</li>
          <li>Play the soundtrack + share it</li>
        </ol>
      </section>

      <section className="main-card rounded-3xl p-5 opacity-95 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Example Quest</p>
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
