# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

사주명리의 미궁 (Labyrinth of Four Pillars) — a MUD-style web app for Korean traditional saju (四柱) fortune-telling. Users navigate rooms in a retro terminal interface to explore AI-powered interpretations of their birth chart.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

No test framework is configured.

## Tech Stack

- **Next.js 16** (App Router) / React 19 / TypeScript 5
- **Tailwind CSS v4** with PostCSS
- **AI providers:** OpenAI SDK + Google Gemini (`@google/genai`), with template fallback
- **Saju calculation:** `@fullstackfamily/manseryeok` library
- Path alias: `@/*` → `./src/*`

## Architecture

### Game State Machine (`src/hooks/useGame.ts`)
Phases flow: `intro → name → date → calendar → time → gender → marriage → exploring`
- `useGame` manages all game state: phase, birth info, saju result, current room, AI cache
- `useTerminal` manages terminal output lines
- `useStreaming` handles SSE streaming from the API

### MUD Engine (`src/lib/mud/`)
- 5 rooms: `entrance`, `synthesis`, `detail`, `luck`, `compatibility`
- Navigation via Korean cardinal directions (동/서/남/북)
- Commands: 도움 (help), 보기 (look), 다시 (restart), 뒤로 (back)
- Room definitions and exits in `rooms.ts`, command parsing in `commandParser.ts`

### Saju Calculation (`src/lib/saju/`)
`calculator.ts` → `calculateFullSaju()` produces `SajuResult` containing:
- Four Pillars (년주/월주/일주/시주)
- Five Elements balance, Ten Gods, Twelve Life Stages
- Special indicators (신살), Major/Yearly luck cycles

### AI Interpretation (`src/app/api/interpret/route.ts`)
- POST endpoint returning SSE stream
- Provider priority: OpenAI → Gemini → template fallback
- System prompts and few-shot examples in `src/lib/ai/prompts.ts`
- Template fallback in `src/lib/ai/templates.ts`

### UI Components
- `src/components/terminal/` — Terminal display, input, typing animation
- `src/components/saju/` — ASCII chart generation (`Charts.ts`), pillar display
- `src/components/SidePanel.tsx` — Guide/glossary sidebar
- CRT retro aesthetic: scanlines, flicker, vignette (defined in `globals.css`)

## Environment Variables

```
GEMINI_API_KEY=...          # Required (unless OpenAI is set)
GEMINI_MODEL=gemini-2.0-flash
OPENAI_API_KEY=...          # Optional, takes priority over Gemini
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=...         # Optional proxy URL
```

If no API keys are set, the app falls back to template-based interpretations.

## Key Conventions

- All user-facing text is in Korean
- The app uses a single-page architecture (`src/app/page.tsx`) with client components
- Color theme: gold (#D4A020) on dark brown (#080600), amber accents
- Font: D2Coding (Korean monospace, loaded via CDN)
- File logging to `/logs` directory via `src/lib/logger.ts`
