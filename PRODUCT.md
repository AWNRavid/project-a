# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a visitor evaluating the work — a hiring manager, engineering lead, or design-literate peer — usually on desktop, in a short session, often taking screenshots. Their job is to judge craft and engineering depth fast, then kick the tires on a working product.

Secondary (simulated end users): small software teams, 2–15 people, working in the app daily. Engineering, design, and product people tracking their own issues; comfortable with dense tooling and keyboard-driven interfaces.

## Product Purpose

Trackr is a working issue tracker: workspaces, projects, issues with status and priority, assignment, kanban and list views, comments, attachments, and an activity log, with member roles and email invites. Success means a visitor can go from the landing page to a real workspace and complete a real task loop without ever hitting a mockup or a dead end.

## Positioning

The demonstration is the depth, not the pitch. Almost anyone can ship a landing page for a project management tool; this product runs end to end — authentication, role-aware workspace membership, invites, object storage, activity history, drag-and-drop ordering. The interface has to make that depth legible in the first minute.

## Operating Context

- Evaluated in a browser, desktop first, with mobile as a credibility check.
- Sessions are short and skimming: the landing page, then sign-up, then a seeded workspace.
- Reviewers may inspect both themes, resize the window, and try edge states (empty workspace, long issue titles, no assignee, overdue dates).
- The repo is public-facing; the interface is part of the code sample.

## Capabilities and Constraints

- Next.js 16, React 19 with React Compiler, oRPC, Drizzle + PostgreSQL, Better Auth, MinIO, TanStack Query/Table, dnd-kit board.
- Features are fixed by scope: workspace create/join, members and roles, invites, projects, issues (status, priority, assignee, due date, ordering), comments, attachments, activity log.
- Visual work is styling, layout, and component craft. Behavior, routes, data contracts, and auth logic stay as they are.
- Light and dark themes must both be real, switchable, and equally finished.
- Seeded demo data exists and is the material the interface is judged on.

## Brand Commitments

- The product name is **Trackr**; keep it.
- The landing page stays dark. It is the front door of a portfolio piece and must hold up as a showpiece.
- Free rein on palette, typography, layout, and copy elsewhere, and on landing copy where it serves the product.

## Evidence on Hand

- A seeded PostgreSQL database, working auth, MinIO-backed attachments, and a running app on localhost.
- No customers, testimonials, funding, benchmarks, uptime numbers, pricing, or case studies exist. Never fabricate commercial proof. Claims like "no credit card required" are not true of this project and must not appear.

## Product Principles

1. **The product is the proof.** Show real working states at production fidelity; never substitute a mockup, a placeholder, or a decorative stand-in for the mechanism.
2. **One system, two registers.** The marketing surface may be bold; the working surface must be calm. Both are unmistakably the same product.
3. **Density with air.** Working screens carry real information volume without crowding; hierarchy, not decoration, does the organizing.
4. **Every state is designed.** Empty, loading, error, long content, no-permission, single-member, and mobile are part of the interface, not leftovers.
5. **Nothing fake.** No invented metrics, logos, testimonials, or capabilities.

## Accessibility & Inclusion

Keyboard-operable throughout, including the kanban board and dialogs; visible focus on every interactive element; body text at WCAG AA contrast in both themes; the interface must remain usable at 200% zoom and on a 390px viewport.
