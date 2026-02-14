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

## Visual Direction — Animated Abstract Night Canvas (FINAL)

Emotional goal:
Dark, playful, alive.
Abstract motion in the background (like aurora/fluid fields) with pops of saturated colour.
Not distinct icon-like shapes. More texture + movement.
Premium, not noisy. The UI card stays the focus.

### Background (key)

- Base is deep near-black/navy (#05070F to #0B1020).
- Use layered abstract gradients (radial + conic) to create “colour fields”.
- Add subtle animation: slow drift/rotation over 20–40s loops.
- Use pops of saturated colour in the fields:
  Teal (#2DD4BF), Indigo (#4F46E5), Coral (#FB7185), Gold (#F6C453)
- Add very subtle grain/noise overlay for depth.
- Add a soft vignette so edges are darker and the card area feels framed.

### Card

- Dark glassy surface:
  rgba(16, 22, 40, 0.70)
- blur: 14px
- border: 1px solid rgba(255,255,255,0.10)
- Minimal glow; background should provide the “playful energy”.

### Motion constraints

- Animation must be subtle (no distracting movement).
- No heavy libraries required. Prefer CSS animations.
- Keep performance mobile-friendly.

### Strict rules

- Do not use light/pastel page background.
- Do not add distinct cartoony shapes.
- The background should feel like animated abstract colour energy on a dark canvas.
- Layout stays unchanged.

