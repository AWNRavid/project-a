---
name: Trackr
description: Issue tracking for small teams, drawn as a charted airspace.
colors:
  chart-paper: "#f3eee2"
  paper-card: "#fbf8f0"
  ink: "#17212b"
  ink-muted: "#5c6672"
  airspace-magenta: "#a21862"
  airspace-magenta-night: "#cf3f88"
  night-ground: "#0c1620"
  night-card: "#111e29"
  bone: "#ece5d4"
  terrain-cyan: "#2f7d93"
  land-green: "#3f6b3a"
  signal-red: "#b3261e"
  caution-amber: "#a9761b"
  chart-border: "#d6cfbe"
  night-border: "#2b3a48"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "58px"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  heading:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.005em"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.14em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0em"
rounded:
  sm: "2px"
  md: "3px"
  lg: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "48px"
  "4xl": "64px"
components:
  button-primary:
    backgroundColor: "{colors.airspace-magenta}"
    textColor: "{colors.paper-card}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 14px"
  button-primary-night:
    backgroundColor: "{colors.airspace-magenta-night}"
    textColor: "{colors.night-ground}"
    rounded: "{rounded.md}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 14px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 12px"
  strip:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: Trackr

## Overview

Trackr is drawn as an aeronautical chart. The product's work moves from a Backlog waypoint through Todo and In progress to Done, and the interface treats that movement as a route: issues are flight strips clipped to a chart, projects are airways, roles are clearances.

Two registers, one system:

- **Night chart** — the landing page and the default app theme. Deep ink-blue ground, bone linework, airspace magenta for what is active or controlled.
- **Day chart** — the light app theme. Warm chart paper, blue-black ink, the same magenta doing the same job.

The marketing surface may be bold. The working surface stays calm, dense, and scannable. Neither is allowed to become a generic dashboard with a colour change.

The two entrants are `/` (Persuade) and the workspace under `/dashboard` (Operate). Entry forms, onboarding and invite acceptance use the chart-table frame.

## Colors

Colour is a code, not decoration. Every hue names a class of thing and keeps that meaning across both themes.

### Primary

- **Airspace magenta** `#a21862` day / `#cf3f88` night — the active route. Primary actions, focus rings, the In progress sector, the selected nav rail. This is the only saturated colour allowed at scale.

### Secondary

- **Terrain cyan** `#2f7d93` — planned work. The Todo sector, active project status, low priority ticks.
- **Land green** `#3f6b3a` — landed work. The Done sector and completed projects.
- **Caution amber** `#a9761b` — high priority and held invitations.
- **Signal red** `#b3261e` — conflict. Urgent priority, cancelled work, destructive actions, failed reads.

### Neutral

- **Chart paper** `#f3eee2` / **night ground** `#0c1620` — the ground. Never pure white or pure black.
- **Paper card** `#fbf8f0` / **night card** `#111e29` — surfaces that carry records.
- **Ink** `#17212b` / **bone** `#ece5d4` — primary text and linework.
- **Ink muted** `#5c6672` / `#a8aeba` — secondary text, chart labels, metadata.
- **Chart border** `#d6cfbe` / `#2b3a48` — the hairline that draws every boundary.

### Named Rules

- **One ink at rest.** Chart labels, metadata and dividers never take a status hue. Status colour is reserved for things whose class matters.
- **Magenta means active.** If it is magenta, it is moving, selected, or the thing to press. Never use magenta for a static heading or a decorative mark.

## Typography

Two voices, no more.

- **Archivo** carries every word: display, headings, body, labels. Its grotesque skeleton holds up at 11px and at 58px without a second face.
- **JetBrains Mono** carries data only: issue keys (`WEB-142`), counts, dates in tabular rows, coordinate labels. It is never used to make prose look technical.

### Hierarchy

| Role | Face | Size | Weight | Tracking |
|---|---|---|---|---|
| Display | Archivo | 58px | 600 | -0.03em |
| Heading | Archivo | 34px | 600 | -0.02em |
| Page title | Archivo | 22px | 600 | -0.01em |
| Section title | Archivo | 15–16px | 600 | -0.01em |
| Body | Archivo | 13–14px | 400 | 0.005em |
| Chart label | Archivo | 11px | 600 | 0.14em, uppercase |
| Data | JetBrains Mono | 11px | 400 | 0, tabular |

Functional text never drops below 11px. Body copy never below 12px. Headings balance; paragraphs avoid orphaned last words.

## Layout

- **App shell**: 248px sidebar, 48px navbar. The navbar and the sidebar header share that 48px so their rules meet in one line.
- **Content**: 24px page padding, a `PageHeader` with optional breadcrumb, title, description and actions, closed by an engraved rule.
- **Landing**: 1400px max width, 20px gutters, a two-column hero (copy 41%, chart 59%) and full-width bands below.
- **Density**: 13px body, 44–64px table rows, 272px board sectors. Dense but never cramped; groups sit tight, sections breathe.
- **Breakpoints**: 1 column below 640, 2 at 768, 3–4 at 1024. No fixed-pixel grid that wraps a hundred pixels narrower.

## Elevation & Depth

Depth is drawn, not cast.

- Hairlines (1px) define every boundary. Cards, panels, table containers and dialogs all use the same border token.
- Shadows are effectively removed for flat surfaces. Only overlays (dialogs, dropdowns) take a soft shadow, and it is a wide, low-opacity falloff rather than a lift.
- The graticule (64px grid) and the hatch (45° fill for empty sectors) are the system's two textures. Both belong to the chart; neither is used as a generic background flourish.

## Shapes

- **Corners**: 2–3px. Records and buttons are near-square; nothing is pill-shaped except status counts and avatars inside a 4px frame.
- **The strip**: a record with a 3px status rail on its left edge, set through `--strip-accent`. This rail is the system's signature and appears on issue cards, project cards and marketing sample strips.
- **Ticks**: priority is four ascending ticks, not a coloured pill. Urgent replaces the ladder with a conflict mark.
- **Rules**: section boundaries use the `.chart-rule`, a hairline with tick marks above it.

## Components

- **Buttons** — 3px radius, 36px/32px/44px heights. Primary is magenta; outline is a hairline on transparent; ghost is text only. Focus is a 1px ring at 2px offset.
- **Inputs** — transparent ground, hairline border, 3px radius, 13px text, 1px focus ring.
- **Status badge** — shape + word + sector tint: circles for Backlog/Todo, dotted for In progress, check for Done, cross for Cancelled.
- **Priority** — tick ladder in the priority's hue, always paired with the word.
- **Strip** — key and date on one line in mono, title at 13px, priority and assignee at the foot. The left rail carries status.
- **Sector** — board column: header with swatch, tracked label and count, then a rack of strips. Empty sectors show the hatch and "No strips cleared".
- **Sidebar** — workspace monogram, tracked section label, nav items with a magenta inset rail when active.
- **Dialogs** — one panel, hairline border, 3px radius, no decorative header band.

## Do's and Don'ts

**Do**

- Let the chart carry the meaning: routes, waypoints, sectors, strips, clearances.
- Keep one authored motion per surface — the route draws once; strips settle in sequence.
- Use real records with real keys for every demonstration, and label sample data as sample.
- Design the empty, loading, error and long-content states as part of the chart.

**Don't**

- Don't add a second display face, gradient text, or glowing edges.
- Don't use magenta for anything that is not active, selected, or pressable.
- Don't put functional text below 11px, or body copy below 12px.
- Don't nest bordered cards inside bordered cards; one boundary per relationship.
- Don't invent customers, metrics, pricing or uptime claims. The product has none.
- Don't soften the chart world into a generic SaaS page: no floating glass, no pill buttons, no oversized rounded cards.
