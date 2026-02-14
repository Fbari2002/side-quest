# SideQuest v1

Mobile-first "Main Character Mode" app that generates wholesome, mysterious micro-adventures.

## Stack

- Next.js (App Router)
- React + TypeScript
- OpenAI API (server-side only)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and set your API key:

```bash
cp .env .env.local
```

3. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

- `OPENAI_API_KEY` (required): OpenAI API key used by `/api/generate`
- `OPENAI_MODEL` (optional): defaults to `gpt-4.1-mini`

## API

### `POST /api/generate`

Accepts:

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

Returns:

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

The route retries and repairs model output to enforce valid JSON and contract shape.
