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

## Updated Visual Direction (Iteration 2)

Tone shift:
Less dark/edgy SaaS.
More alive, colourful, warm.

Background:
- Dark navy base with subtle gradient glow.
- Hints of indigo, teal, or soft purple.
- Optional soft animated gradient movement.

UI:
- Rounded soft components.
- Subtle glassmorphism or soft glow edges.
- Avoid harsh borders.

Primary CTA:
- Warm gradient (gold / coral / soft purple blend).
- Should feel magical but refined.

Overall feel:
Premium.
Playful.
Curious.
Alive.
Not corporate.
Not edgy tech.

## Colour Palette v2

Base:
- #0B1020 (deep navy)

Accent glows:
- Indigo (#4F46E5)
- Teal (#2DD4BF)

Warm highlight:
- Gold (#F6C453)
- Soft coral (#FB7185)

Design intent:
Background remains dark but infused with colour.
CTA uses warm gradient.
Avoid cold blue-only look.
