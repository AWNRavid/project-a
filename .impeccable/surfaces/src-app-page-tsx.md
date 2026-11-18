---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Aeronautical Chart — Trackr

## Scope

Primary surface: `/` landing page (Persuade). The same world extends to `/login`, `/sign-up`, `/onboarding`, `/invite/[token]` and the working app under `/dashboard` (Operate), so the front door and the tool read as one product.

## Audience, job, action

A hiring manager or engineering lead evaluating craft in a short desktop session. They must learn what Trackr is, see a real team's work moving, believe the product is deep enough to be real, and enter a workspace. Primary action: open a workspace (sign-up). Secondary: sign in.

## Proof and content

Real seeded workspace, projects, issues with keys, priorities, assignees and due dates; real status counts. No customers, testimonials, funding, benchmarks or pricing — never fabricated. "No credit card required" and similar claims are untrue here and stay out.

## Constraints

Behavior, routes, data contracts and auth logic unchanged. Light and dark both finished and switchable. Keyboard operable including the board; AA contrast; 390px and 200% zoom.

## Chosen direction

Aeronautical chart and paper flight-progress strips: the working surface as charted airspace. Memorable moment: the flight-strip rack — issue rows clipped as progress strips over a graticule, with the route from Backlog to Done drawn between them.

## Direction contract

THESIS: The working surface as charted airspace — every issue a flight strip, every project an airway, every role a clearance — refusing the generic card-grid dashboard.

OWN-WORLD: Chart cream by day, ink-blue night; hairline graticule and engraved rules; airspace magenta for active and controlled, terrain cyan for planned, land green for landed, signal red for conflict; wide-tracked Archivo caps for chart labels, JetBrains Mono for keys and counts; 2px corners, 1px rules, no soft card shadows.

STORY: The visitor reads a live chart of a real team's work, understands Backlog-to-Done as a route with waypoints, opens a workspace, and finds the same chart language governing the tool.

FIRST VIEWPORT: A dark night-chart table. Left third: title block with the TRACKR wordmark, one-line thesis, primary action Open a workspace and secondary Sign in, plus a live status legend carrying real counts. Right two-thirds: the route from BACKLOG to DONE drawn as an airway, with three clipped flight strips over it carrying real issue titles, keys, priorities and assignees. A hairline graticule crosses the viewport; the route draws once on load.

FORM: grounded position 7 of 7; seed:71314c26870e0f3b

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Whether the hero keeps a text link or an inline workspace-name field for the primary action (flow change).
- Whether the demo workspace is shown as marketing proof or reached only after sign-up.
