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

