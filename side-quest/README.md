# SideQuest v1

Mobile-first "Main Character Mode" app for wholesome, mysterious micro-adventures.

## Tech

- Next.js App Router
- React + TypeScript
- OpenAI API (server only)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Set your key in `.env.local`:

```bash
OPENAI_API_KEY=your_key_here
# Optional
OPENAI_MODEL=gpt-4.1-mini
```

4. Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## API

### `POST /api/generate`

Request body:

```json
{
  "mood": "curious",
  "time_available": "45 minutes",
  "energy": "medium",
  "social": "solo",
  "chaos": 4,
  "noSpend": false,
  "lowSensory": false
}
```

Response body (strict JSON contract):

```json
{
  "title": "",
  "vibe": "",
  "steps": ["", "", ""],
  "twist": "",
  "completion": "",
  "soundtrack_query": ""
}
```

Reliability: structured output schema, then parse+retry once, then safe fallback quest.

## Deploying to Vercel

- Add `OPENAI_API_KEY` in Vercel Project Settings -> Environment Variables (required in production).
- Optionally set `OPENAI_MODEL`.
- Redeploy after setting env vars.

## iOS icon refresh note

iOS caches Home Screen icons aggressively; remove the old shortcut and add it again from Safari to refresh.
