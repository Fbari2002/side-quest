# SideQuest — Project Brief (v1)

## One-liner
A mobile-first “Main Character Mode” app that generates wholesome, excited, mysterious micro-adventures using AI.

## Look & feel
- Dark mode default
- Rounded, soft UI
- Playful/jolly, alive energy
- Slightly mysterious, not cringe
- Premium feel (micro-animations later)

## Neurodivergent-friendly rules
- Low overwhelm: max 3 steps
- Clear completion condition
- Optional toggles: No spend money, Low sensory
- Social tasks only when Social mode is enabled

## Inputs (v1)
- mood (text or preset)
- time_available (text, e.g. "2 hours")
- energy: low | medium | high
- social: solo | social
- chaos: 0–10
- noSpend: boolean
- lowSensory: boolean

## Output contract (MUST be valid JSON only)
{
"title": "",
"vibe": "",
"steps": ["", "", ""],
"twist": "",
"completion": "",
"soundtrack_query": ""
}

Rules:
- Max 3 steps, each < 20 words
- Respect time + energy
- If noSpend=true: no paid suggestions
- If lowSensory=true: avoid crowds/loud/bright chaos/intense social
- Safe and legal; no dangerous tasks
- Lightly address user as “Main Character” without cringe

## v1 pages
- Landing / generator page (mobile-first)
- Quest result card
- Button: “🎧 Play the vibe” → Spotify search URL using soundtrack_query

## Tech preference (for Codex)
Next.js app router. Do not expose API keys client-side.

## Visual Direction — Ratatouille Flavour Fireworks (FINAL)

Emotional goal:
Dark night canvas with colourful flavour bursts.
Energetic. Playful. Juicy. Hyper-brain popping.
Still premium and abstract — not cartoony, not childish.

Think:
The food tasting scene in Ratatouille.
Colour fireworks against black.
Saturated pops.
Alive.

### Background

- Base: deep near-black/navy (#05070F → #0B1020).
- Add tight, saturated colour bursts (radial gradients).
- Bursts must feel like pops, not fog.
- Use smaller radii (35–50%) and higher opacity:
  Teal/Indigo: 0.30–0.42
  Coral/Gold: 0.18–0.28
- Place bursts around edges/corners, not centered.

### Spark Layer

- Add micro abstract sparkle/confetti layer.
- Tiny radial gradients (2–6px) with blur.
- Opacity: 0.10–0.18.
- Use mix-blend-mode: screen (with safe fallback).
- Animate gentle drift (20–30s).

### Card Focal Glow

- Add a soft warm glow behind the card.
- Very subtle (0.10–0.16 opacity).
- Makes the UI feel like it sits inside the flavour field.

### Motion

- Gentle drift only.
- Energy comes from contrast + saturation, not speed.
- Respect prefers-reduced-motion.

### Strict Rules

- No pastel/light backgrounds.
- No distinct cartoon shapes.
- No overly smooth gradient wash.
- Background should feel alive and colourful.

## Build Priorities (v1 ship today)

### Must work end-to-end
1) AI quest generation works via server API route (no client keys).
2) Result renders as a shareable card (title, vibe, steps, twist, completion).
3) Spotify link button works (opens Spotify search for soundtrack_query).
4) Share button works (Web Share API on mobile; fallback to copy to clipboard).

### UX polish (do not overbuild)
- Loading state: “Activating Main Character Mode…” + disable inputs.
- Friendly error state (retry).
- Smooth reveal animation for result card.

## AI Integration (non-negotiable)

### Endpoint
- Use Next.js App Router route: `/api/generate` (POST).
- API key stored in env var: `OPENAI_API_KEY`.
- Never expose keys client-side.

### Request body (from client)
{
"mood": "curious",
"time_available": "45 minutes",
"energy": "low|medium|high",
"social": "solo|social",
"chaos": 0-10,
"noSpend": true|false,
"lowSensory": true|false
}

### Response (strict JSON)
Return JSON ONLY in this shape:
{
"title": "…",
"vibe": "…",
"steps": ["…","…","…"],
"twist": "…",
"completion": "…",
"soundtrack_query": "…"
}

Rules:
- Exactly 3 steps max. Each step < 20 words.
- Clear completion condition.
- Respect toggles:
  - noSpend=true => no paid suggestions
  - lowSensory=true => avoid crowds/loud/bright/intense social
  - social=solo => no required interactions
- Safe + legal (no dangerous tasks).

### Reliability
- Enforce JSON-only output (use schema/structured output if available; else robust parsing + one retry).
- If parsing fails, return a safe fallback quest.

## Result Card (v1)

- Displays:
  - Title (largest)
  - Vibe (small)
  - Steps (numbered list or chips)
  - Twist (labelled “Plot twist”)
  - Completion (labelled “To complete”)
- Actions:
  - 🎧 Play the vibe (Spotify search)
  - Share quest (Web Share / clipboard)

## App Icon / Branding (v1)

- App name: SideQuest
- Add app icon files in /public:
  - icon.png (512x512)
  - apple-touch-icon.png (180x180)
- Metadata in `app/layout.tsx`:
  - title "SideQuest"
  - themeColor dark
  - icons configured
- Optional: `manifest.webmanifest` with display: standalone
