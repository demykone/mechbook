# Design Brief

## Direction

MechBook AI Booking — clean, modern scheduling interface for car service reservations powered by conversational AI agent.

## Tone

Approachable modern. Friendly but professional. Emphasizes clarity and ease over decoration.

## Differentiation

Integrated AI chat agent alongside visual 3-week calendar — users book directly through conversation or calendar UI, zero login friction.

## Color Palette

| Token | OKLCH | Role |
| --- | --- | --- |
| background | 0.12 0.0 0 | Deep neutral |
| foreground | 0.88 0.0 0 | Near-white text |
| card | 0.15 0.02 240 | Card surfaces |
| primary | 0.50 0.12 240 | Interactive elements |
| accent | 0.75 0.15 190 | Teal, CTAs, highlights |
| muted | 0.20 0.015 240 | Disabled, subtle |
| destructive | 0.55 0.22 25 | Red, deletions |
| success | 0.60 0.18 150 | Green, confirmed |
| warning | 0.72 0.15 85 | Yellow, pending |

## Typography

- Display: Bricolage Grotesque — headlines, UI labels (friendly, modern weight)
- Body: DM Sans — descriptions, timestamps, form text (clean, legible)
- Scale: h1 `32px font-bold`, h2 `24px font-semibold`, body `16px font-normal`, caption `12px text-muted-foreground`

## Elevation & Depth

Subtle card shadows (4–8px blur, 60% opacity) for light depth. No glow or tactical shadows. Borders used for clarity, not emphasis.

## Structural Zones

| Zone | Background | Border | Notes |
| --- | --- | --- | --- |
| Header | bg-card, 12px radius | border-b | Navigation, logo |
| Chat sidebar | bg-background | border-r | AI agent panel, sticky |
| Calendar grid | bg-background | — | Main content, booking slots |
| Booking card | bg-card | border | 12px radius, hover lift |
| Footer | bg-muted/20 | border-t | Info, copyright |

## Spacing & Rhythm

4px base unit. Cards: 16px padding. Section gaps: 24px. Breathing room between calendar cells: 8px. No decorative spacing.

## Component Patterns

- Buttons: primary (teal bg-accent), secondary (border), ghost (no fill). Rounded 10px.
- Cards: bg-card, 12px radius, subtle border, box-shadow: 0 4px 12px rgba(0,0,0,0.3)
- Badges: status-colored (success/warning/destructive), 6px radius, inline pill shape
- Calendar slots: clickable cells, hover:bg-accent/20, selected:bg-accent

## Motion

- Entrance: fade in 0.3s ease-out (no bounces)
- Hover: bg-color shift 0.2s, slight lift on cards
- Decorative: none; transitions only for interactive states

## Constraints

- No login required — public booking front-and-center
- Do NOT build: email confirmation, booking history, recurring slots
- Monospace fonts reserved for timestamps only
- Orange is removed — teal accent only for trust and clarity
- No gradient overlays or glow effects

## Signature Detail

AI chat agent embedded in sticky sidebar alongside calendar — the booking conversation flows naturally from chat suggestion to calendar slot selection, avoiding modal friction and keeping the interface unified and approachable.
