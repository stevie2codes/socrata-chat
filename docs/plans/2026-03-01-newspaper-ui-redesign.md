# UI Redesign: "The Newspaper"

Editorial-minimal chat interface for Open Data Reports. Monochrome base with a purposeful data color palette. Content-first, typography-driven.

## Layout

### Hero (empty state)
- Title "Open Data Reports" in text-2xl font-bold tracking-tight, centered
- Single input bar: thin 1px border, generous padding, portal selector + textarea + send button
- Starter prompts as quiet muted text links (not outlined buttons), lowercase, hover underline
- Generous vertical spacing — content floats in viewport center

### Chat view
- Minimal top bar: title left, portal label right, thin bottom border
- Message column: max-width ~680px centered (~65ch readable width)
- User messages: right-aligned, light background pill
- Assistant messages: left-aligned, no background, text flows editorially
- Line-height 1.7, paragraph spacing mt-4
- Sticky bottom input bar, same treatment as hero, within content column

## Message Content Rendering

### Markdown
Parse AI responses as markdown:
- h2/h3: semi-bold, slightly larger, generous top margin for section breaks
- Bold text for key numbers and findings
- Inline code: light muted background for dataset IDs, column names, SoQL
- Lists with clean spacing

### Data tables
- Rendered inside collapsible sections
- Default: collapsed, showing summary line ("12 rows · 4 columns") with "Show data" toggle
- Expanded: clean table with subtle header background, monospace numbers
- Left-edge accent stripe (data-1 color) on table container

### Tool-call steps
- Hide all intermediate narration ("Let me search...", "Let me try...")
- While tools run: single progress line with shimmer animation + updating label
  - "Searching datasets..." → "Reading dataset schema..." → "Querying data..."
- Labels reflect actual tool name being called
- Once complete, only final narrative + data renders

## Color

### Base UI: monochrome
All chrome stays neutral — borders, backgrounds, text, user bubbles.

### Primary interactive: data-1 (muted blue)
- Send button: solid data-1 background, white icon
- Focus rings: data-1 instead of neutral gray
- Links: data-1 with underline on hover
- Hover: slightly darker, disabled: 30% opacity

### Data palette (4 colors)
| Token    | Use                              | Hue        |
|----------|----------------------------------|------------|
| `data-1` | Primary data / interactive / CTA | Muted blue |
| `data-2` | Secondary series / comparisons   | Warm amber |
| `data-3` | Positive / success / growth      | Sage green |
| `data-4` | Negative / alert / decline       | Soft red   |

Desaturated, editorial tones — newspaper infographic, not neon dashboard.

### Where color appears
- Send button and focus rings (data-1)
- Left-edge stripe on data tables (data-1)
- Metric badges in responses (data-1)
- Table header row: faint data-1 tint
- Streaming status: data-1 accent
- Future charts: full 4-color palette

### Where color does NOT appear
- Navigation, borders, backgrounds — all neutral
- User message bubbles — gray tint
- Assistant message text — foreground black/white

## Streaming & Loading

### During tool calls
- Hide intermediate narration text
- Compact shimmer bar: thin horizontal line with left-to-right animation
- Muted label below updates per tool stage
- Labels map to tool names: search_datasets → get_dataset_info → query_dataset

### During text streaming
- Text appears word-by-word (existing behavior)
- Small blinking data-1 colored caret at end of streaming text
- No shimmer bar during text streaming

### On completion
- Shimmer and labels disappear
- Full markdown formatting renders
- Collapsed data tables appear with toggle

## Dependencies
- react-markdown + remark-gfm for markdown rendering
- No other new dependencies anticipated
