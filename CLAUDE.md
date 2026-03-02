# Socrata Chat

## Project Overview

Conversational data exploration tool for public open data from Socrata portals. MVP is chat-mode only, single portal (Chicago). Full design spec in `../socrata-chat-interaction-design.md`.

This is a **design laboratory** — validating interaction patterns (Orient → Query → Refine) before applying them to an internal product with proprietary data.

## Stack

- **Framework**: Next.js (App Router, TypeScript, fullstack)
- **UI**: shadcn/ui + Tailwind CSS v4 (Radix primitives)
- **LLM**: Vercel AI SDK + Claude (`@ai-sdk/anthropic`)
- **Data layer**: TypeScript tools calling Socrata REST API (default), Python MCP server (opt-in via `USE_MCP=true`)
- **Charts**: Recharts
- **Deployment**: Local dev only for MVP

## Architecture

```
User → Chat UI (useChat hook) → POST /api/chat → Vercel AI SDK streamText
  → Claude with tools (search_datasets, get_dataset_info, query_dataset)
  → Socrata REST API (data.cityofchicago.org)
  → Streamed composite response (text + tool results)
  → Client renders: data tables, dataset cards, suggestion chips, charts
```

Session state lives in React context (`SessionProvider`). No server-side persistence for MVP.

## Key Directories

```
src/
  app/api/chat/route.ts    — Chat API endpoint (central integration point)
  components/chat/         — Chat thread, messages, input, chips, streaming
  components/data/         — Data table, dataset cards, charts, export
  components/sidebar/      — Context sidebar, filters, column schema
  lib/socrata/             — API client, tool definitions, MCP client
  lib/session/             — React context for session state
  lib/prompts/             — System prompt builder
  types/index.ts           — Core TypeScript types
```

## Conventions

- **Accessibility first**: Every component must have proper ARIA attributes, keyboard navigation, and screen reader support. This is a core requirement, not a nice-to-have.
- **Composite messages**: System responses are never just text — they include data tables, suggestion chips, dataset cards as appropriate.
- **shadcn/ui components** live in `src/components/ui/` (auto-generated, don't edit directly).
- **Custom components** go in `src/components/{chat,data,sidebar}/`.
- Use `@/` import alias for all imports.
- Keep components focused — one component per file, named exports.

## Commands

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
```

## Environment Variables

```
ANTHROPIC_API_KEY   — Required for Claude API
SOCRATA_APP_TOKEN   — Optional, for higher Socrata rate limits
SOCRATA_MCP_PATH    — Path to Socrata MCP server (default: ../socrata-mcp-server)
USE_MCP             — "true" to use Python MCP server instead of direct TypeScript tools
```

## Implementation Plan

See `/Users/stevie2toes/.claude/plans/effervescent-spinning-waffle.md` for the full phased plan.

Current progress: Phase 0 complete, working on Phase 1.
