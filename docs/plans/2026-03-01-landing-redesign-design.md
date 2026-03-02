# Open Data Reports — Landing Redesign

## Summary

Rebrand from "Socrata Chat" (Chicago-only chat app) to "Open Data Reports" (general-purpose open data explorer). Redesign the landing page from a bottom-pinned chat input to a centered hero layout with portal selection and contextual suggestions, similar to Claude's landing page.

## Identity

- **Name**: Open Data Reports
- **Tagline**: "Explore public data with natural language"
- **Framing**: Portal-agnostic. Supports multiple Socrata portals (Chicago, NYC, SF, Seattle, etc.)

## Landing Page Layout (empty state)

Vertically and horizontally centered hero with three stacked elements:

```
+--------------------------------------------------+
|                                                  |
|                                                  |
|            Open Data Reports                     |
|    Explore public data with natural language     |
|                                                  |
|   [Chicago v] [Ask about Chicago data...     ->] |
|                                                  |
|   [Restaurant inspections]  [Building permits]   |
|                  [Crime by neighborhood]          |
|                                                  |
|                                                  |
+--------------------------------------------------+
```

1. **Title + subtitle** — centered, no header bar
2. **Input bar** — portal dropdown on the left edge, text input filling the rest, send button on right
3. **Suggestion chips** — 2-3 portal-specific prompts as outlined pill buttons

## Portal Selector

- Compact dropdown embedded in the left side of the input container
- Displays portal label (e.g. "Chicago")
- Lists all portals from `portals.ts` (8 currently)
- Changing portal updates: suggestions, placeholder text, session state (`SET_PORTAL` action)
- Default: Chicago

## Portal-Specific Suggestions

Each portal has curated starter prompts:

| Portal | Suggestions |
|--------|-------------|
| Chicago | "Restaurant inspection failures", "Building permits this year", "Crime data by neighborhood" |
| New York State | "Health facility inspections", "School enrollment data", "Environmental permits" |
| San Francisco | "311 service requests", "Film location permits", "Business registrations" |
| Seattle | "Building permits issued", "Public safety incidents", "Utility usage data" |
| New York City | "311 complaints by borough", "Restaurant health grades", "Street tree census" |
| LA County | "Property tax data", "Restaurant inspections", "COVID case data" |
| Austin | "311 service requests", "Building permits", "Animal shelter outcomes" |
| Boston | "311 service requests", "Building violations", "Crime incident reports" |

## Layout Transition (empty -> conversation)

- **Empty state**: No header. Hero centered vertically. Input is part of the hero.
- **After first message**: Header appears ("Open Data Reports" left, portal indicator right). Input moves to bottom. Messages fill the middle. Standard chat layout.

## Components Affected

| Component | Change |
|-----------|--------|
| `app/page.tsx` | Two-mode layout: centered hero vs. chat mode. Portal state management. |
| `components/chat/starter-prompts.tsx` | Portal-aware suggestions. Rendered below input instead of centered in empty space. |
| `components/chat/chat-input.tsx` | Portal dropdown embedded on left side. Placeholder adapts to portal. |
| `lib/portals.ts` | Add `suggestions: string[]` to `Portal` interface. |
| `components/chat/chat-message-list.tsx` | Only rendered in conversation mode. |
| New: header component | Shown only in conversation mode. Portal indicator on right. |

## Out of Scope

- Portal auto-detection from user message content (future enhancement)
- Portal search/filtering (only 8 portals, dropdown is sufficient)
- Dark mode or theming changes
- Any Phase 2+ functionality (tools, data tables, etc.)
