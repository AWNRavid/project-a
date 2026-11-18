import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

/**
 * Authored demonstration data for the chart. It is labelled as a sample on
 * the page: no real workspace is exposed here and no metric is implied.
 */
const boardIssues = [
  {
    key: "WEB-151",
    title: "Empty-state copy for the board",
    status: "Backlog",
    priority: "Low",
    level: 1,
    owner: "—",
    due: "28 Mar",
  },
  {
    key: "WEB-148",
    title: "CSV export for the issue table",
    status: "Backlog",
    priority: "Medium",
    level: 2,
    owner: "Owen",
    due: "02 Apr",
  },
  {
    key: "WEB-145",
    title: "Workspace switcher in the sidebar",
    status: "Backlog",
    priority: "Low",
    level: 1,
    owner: "—",
    due: "09 Apr",
  },
  {
    key: "WEB-137",
    title: "Migrate billing webhooks",
    status: "Todo",
    priority: "Medium",
    level: 2,
    owner: "Owen",
    due: "19 Mar",
  },
  {
    key: "WEB-144",
    title: "Rate-limit invite resend",
    status: "Todo",
    priority: "High",
    level: 3,
    owner: "Rani",
    due: "21 Mar",
  },
  {
    key: "WEB-143",
    title: "Sort issues by due date",
    status: "Todo",
    priority: "Low",
    level: 1,
    owner: "Priya",
    due: "25 Mar",
  },
  {
    key: "WEB-142",
    title: "Checkout drops session on Safari",
    status: "In progress",
    priority: "High",
    level: 3,
    owner: "Rani",
    due: "14 Mar",
  },
  {
    key: "WEB-139",
    title: "Attachment previews in the issue",
    status: "In progress",
    priority: "Medium",
    level: 2,
    owner: "Priya",
    due: "17 Mar",
  },
  {
    key: "WEB-129",
    title: "Ship keyboard shortcuts panel",
    status: "Done",
    priority: "Low",
    level: 1,
    owner: "Priya",
    due: "08 Mar",
  },
  {
    key: "WEB-121",
    title: "Role matrix on workspace settings",
    status: "Done",
    priority: "Medium",
    level: 2,
    owner: "Owen",
    due: "04 Mar",
  },
  {
    key: "WEB-118",
    title: "Activity log for status changes",
    status: "Done",
    priority: "High",
    level: 3,
    owner: "Rani",
    due: "28 Feb",
  },
  {
    key: "WEB-112",
    title: "Invite expiry and resend",
    status: "Done",
    priority: "Medium",
    level: 2,
    owner: "Owen",
    due: "21 Feb",
  },
];

const sectors = [
  { label: "Backlog", tone: "var(--status-backlog)" },
  { label: "Todo", tone: "var(--status-todo)" },
  { label: "In progress", tone: "var(--status-progress)" },
  { label: "Done", tone: "var(--status-done)" },
].map((sector) => ({
  ...sector,
  count: boardIssues.filter((issue) => issue.status === sector.label).length,
}));

const routeIssues = [
  boardIssues.find((issue) => issue.status === "In progress"),
  boardIssues.find((issue) => issue.status === "Todo"),
  boardIssues.find((issue) => issue.status === "Done"),
].filter((issue): issue is (typeof boardIssues)[number] => issue !== undefined);

const capabilities = [
  {
    title: "Workspaces and invites",
    body: "Open a workspace, invite by email, and hand each person a role with an expiry on the invitation.",
  },
  {
    title: "Projects with keys",
    body: "Every issue belongs to a project and carries its key, so WEB-142 is unambiguous in a commit or a meeting.",
  },
  {
    title: "Board and list",
    body: "Drag a strip across Backlog, Todo, In progress and Done, or work the same records as a sortable table.",
  },
  {
    title: "Comments and attachments",
    body: "Rich text on the issue, files in object storage, and both attached to the record rather than to a chat thread.",
  },
  {
    title: "Activity log",
    body: "Every status, priority, assignee and date change is written down with who did it and what it was before.",
  },
  {
    title: "Roles and clearances",
    body: "Owner, admin, member. The server checks the role, and the interface only offers what your role allows.",
  },
];

function TopBar() {
  return (
    <header className="border-border/80 bg-background/80 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-6 px-5">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="text-[15px] font-bold tracking-[0.22em] uppercase">
            Trackr
          </span>
          <span className="text-muted-foreground hidden font-mono text-[11px] tracking-[0.18em] uppercase sm:inline">
            Chart table · edition 1
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="#route"
            className="text-muted-foreground hover:text-foreground hidden px-2.5 py-1.5 text-[13px] transition-colors sm:block"
          >
            The route
          </Link>
          <Link
            href="#clearances"
            className="text-muted-foreground hover:text-foreground hidden px-2.5 py-1.5 text-[13px] transition-colors sm:block"
          >
            Clearances
          </Link>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground px-2.5 py-1.5 text-[13px] transition-colors"
          >
            Sign in
          </Link>
          <Button asChild size="sm" className="ml-1 hidden sm:inline-flex">
            <Link href="/sign-up">Open a workspace</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

const statusTone: Record<string, string> = {
  Backlog: "var(--status-backlog)",
  Todo: "var(--status-todo)",
  "In progress": "var(--status-progress)",
  Done: "var(--status-done)",
};

function Strip({
  issue,
  delay = 0,
}: {
  issue: (typeof boardIssues)[number];
  delay?: number;
}) {
  const tone = statusTone[issue.status] ?? "var(--muted-foreground)";

  return (
    <article
      className="animate-strip strip px-3 py-2.5"
      data-impeccable-ignore="nested-cards"
      style={
        {
          "--strip-accent": tone,
          animationDelay: `${delay}ms`,
        } as React.CSSProperties
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className="tabular text-muted-foreground text-[11px] font-medium tracking-[0.08em] uppercase">
          {issue.key}
        </span>
        <span
          className="chart-label"
          style={{ color: tone, letterSpacing: "0.12em" }}
        >
          {issue.status}
        </span>
      </div>

      <p className="mt-1.5 text-[13px] leading-snug font-medium">
        {issue.title}
      </p>

      <div className="text-muted-foreground mt-2 flex items-center justify-between gap-3 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="flex items-end gap-[2px]" aria-hidden>
            {[1, 2, 3, 4].map((tick) => (
              <span
                key={tick}
                className="w-[2px] rounded-[1px]"
                style={{
                  height: `${3 + tick * 1.5}px`,
                  background: tick <= issue.level ? tone : "var(--border)",
                }}
              />
            ))}
          </span>
          <span className="tracking-[0.08em] uppercase">{issue.priority}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="tracking-[0.08em] uppercase">{issue.owner}</span>
          <span className="bg-border h-3 w-px" aria-hidden />
          <span className="tabular">{issue.due}</span>
        </span>
      </div>
    </article>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-5 pt-12 pb-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14 lg:pt-16">
      <div className="flex min-w-0 flex-col justify-center">
        <h1 className="max-w-[15ch] text-[38px] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[52px] lg:text-[58px]">
          Work, charted from{" "}
          <span className="text-primary">backlog to done.</span>
        </h1>

        <p className="text-muted-foreground mt-5 max-w-[48ch] text-[15px] leading-relaxed">
          Trackr keeps every issue on one chart — its owner, its priority, its
          clearance and where it sits on the route. The chart stays current
          while the work moves.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href="/sign-up">
              Open a workspace
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2">
            <Link href="/login">
              Sign in
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="text-muted-foreground mt-4 flex items-center gap-2 text-[12px]">
          <span className="bg-primary h-1 w-1 rounded-full" aria-hidden />
          Workspaces, projects, issues, comments, files and activity — one
          chart.
        </div>
      </div>

      <div className="relative min-w-0">
        <div className="border-border bg-card/40 relative min-w-0 overflow-hidden rounded-[3px] border">
          <div className="graticule pointer-events-none absolute inset-0 opacity-70" />

          <div className="border-border/80 relative flex items-center justify-between gap-3 border-b px-3 py-2">
            <span className="chart-label">Route · demo workspace</span>
            <span className="text-muted-foreground hidden font-mono text-[11px] tracking-[0.14em] uppercase sm:inline">
              Sample chart · not live data
            </span>
          </div>

          <div id="route" className="relative">
            {/* The route: the one authored motion on the page. */}
            <div className="relative h-[132px] px-4 sm:h-[148px]">
              <svg
                aria-hidden
                viewBox="0 0 100 40"
                preserveAspectRatio="none"
                className="absolute inset-x-4 inset-y-0 h-full w-[calc(100%-2rem)]"
              >
                <path
                  d="M 2 30 C 8 24, 10 22, 12.5 22 C 20 20, 30 12, 37.5 16 C 45 20, 55 30, 62.5 26 C 70 22, 80 12, 87.5 14 L 98 12"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  className="animate-route"
                  style={{ "--route-length": 110 } as React.CSSProperties}
                  d="M 2 30 C 8 24, 10 22, 12.5 22 C 20 20, 30 12, 37.5 16 C 45 20, 55 30, 62.5 26 C 70 22, 80 12, 87.5 14 L 98 12"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="1.25"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {[
                { left: "12.5%", top: "55%", tone: "var(--status-backlog)" },
                { left: "37.5%", top: "40%", tone: "var(--status-todo)" },
                {
                  left: "62.5%",
                  top: "65%",
                  tone: "var(--status-progress)",
                },
                { left: "87.5%", top: "35%", tone: "var(--status-done)" },
              ].map((node) => (
                <span
                  key={node.left}
                  aria-hidden
                  className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-[1px] border"
                  style={{
                    left: node.left,
                    top: node.top,
                    borderColor: node.tone,
                    background: `color-mix(in oklch, ${node.tone} 45%, var(--card))`,
                  }}
                />
              ))}
            </div>

            {/* Waypoints line up with the four nodes above. */}
            <div className="border-border/70 grid grid-cols-4 border-y">
              {sectors.map((sector) => (
                <div
                  key={sector.label}
                  className="border-border/50 flex min-w-0 flex-col items-center gap-1 border-r px-1 py-2 last:border-r-0"
                >
                  <span
                    className="max-w-full truncate text-[11px] leading-none font-semibold tracking-[0.06em] uppercase sm:text-[11px] sm:tracking-[0.14em]"
                    style={{ color: sector.tone }}
                  >
                    {sector.label}
                  </span>
                  <span className="tabular text-[12px] leading-none">
                    {sector.count}
                  </span>
                </div>
              ))}
            </div>

            {/* The rack: three strips clipped below the route. */}
            <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3">
              {routeIssues.map((issue, index) => (
                <Strip key={issue.key} issue={issue} delay={index * 140} />
              ))}
            </div>
          </div>
        </div>

        <p className="text-muted-foreground mt-2.5 font-mono text-[11px] tracking-[0.1em] uppercase">
          Three strips cleared from twelve, one route.
        </p>
      </div>
    </section>
  );
}

function Rack() {
  return (
    <section className="border-border/80 border-y px-5 py-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-[20ch] text-[28px] leading-tight font-semibold tracking-tight sm:text-[34px]">
            Every issue is a strip.
          </h2>
          <p className="text-muted-foreground max-w-[44ch] text-[14px] leading-relaxed">
            A strip carries the whole record: key, title, priority, owner and
            due date. Move it to a new sector and the database changes, not a
            screenshot.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
          {sectors.map((sector) => {
            const issues = boardIssues.filter(
              (issue) => issue.status === sector.label,
            );

            return (
              <div key={sector.label} className="sector flex flex-col">
                <div className="border-border/80 flex items-center justify-between border-b px-2.5 py-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-[1px]"
                      style={{ background: sector.tone }}
                      aria-hidden
                    />
                    <span className="chart-label" style={{ color: sector.tone }}>
                      {sector.label}
                    </span>
                  </span>
                  <span className="tabular text-muted-foreground text-[11px]">
                    {sector.count}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-1.5 p-2">
                  {issues.map((issue) => (
                    <div
                      key={issue.key}
                      className="strip px-2.5 py-2"
                      style={
                        {
                          "--strip-accent": statusTone[issue.status],
                        } as React.CSSProperties
                      }
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="tabular text-muted-foreground text-[11px] tracking-[0.08em]">
                          {issue.key}
                        </span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {issue.due}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] leading-snug">
                        {issue.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Clearances() {
  const rows = [
    {
      role: "Owner",
      detail:
        "Everything an admin can do, plus transferring ownership and deleting the workspace.",
      holds: "1 per workspace",
    },
    {
      role: "Admin",
      detail:
        "Invite people, change roles, remove members, and manage projects and their issues.",
      holds: "Unlimited",
    },
    {
      role: "Member",
      detail:
        "Create and edit issues, comment, attach files, and move strips across the board.",
      holds: "Unlimited",
    },
  ];

  return (
    <section id="clearances" className="px-5 py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <h2 className="max-w-[16ch] text-[28px] leading-tight font-semibold tracking-tight sm:text-[34px]">
            Roles are clearances.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-[42ch] text-[14px] leading-relaxed">
            A workspace holds three levels of clearance. The server checks the
            role on every request, and the interface only offers what your
            clearance covers.
          </p>
        </div>

        <div className="border-border overflow-hidden border-y">
          <div className="text-muted-foreground grid grid-cols-[72px_1fr] gap-3 border-b px-1 py-2 sm:grid-cols-[88px_1fr_auto]">
            <span className="chart-label">Level</span>
            <span className="chart-label">Cleared for</span>
            <span className="chart-label hidden text-right sm:inline">
              Held by
            </span>
          </div>

          {rows.map((row) => (
            <div
              key={row.role}
              className="border-border/70 grid grid-cols-[72px_1fr] items-baseline gap-3 border-b px-1 py-3.5 last:border-b-0 sm:grid-cols-[88px_1fr_auto]"
            >
              <span className="text-[13px] font-semibold tracking-wide">
                {row.role}
              </span>
              <span className="text-muted-foreground text-[13px] leading-relaxed">
                {row.detail}
              </span>
              <span className="text-muted-foreground hidden font-mono text-[11px] whitespace-nowrap sm:inline">
                {row.holds}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section className="border-border/80 border-y px-5 py-16">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="max-w-[22ch] text-[28px] leading-tight font-semibold tracking-tight sm:text-[34px]">
          Everything the route needs.
        </h2>

        <dl className="mt-9 grid grid-cols-1 gap-x-12 gap-y-0 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => (
            <div
              key={item.title}
              className="border-border/70 flex flex-col gap-1.5 border-t py-4"
            >
              <dt className="text-[13px] font-semibold tracking-wide">
                {item.title}
              </dt>
              <dd className="text-muted-foreground text-[13px] leading-relaxed">
                {item.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Close() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <h2 className="max-w-[22ch] text-[30px] leading-[1.05] font-semibold tracking-tight sm:text-[40px]">
            Open a workspace and chart your first project.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-[46ch] text-[14px] leading-relaxed">
            Create the workspace, invite the team, and put the first issue on
            the route. Roles, comments, files and activity are already wired to
            it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href="/sign-up">
              Open a workspace
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-border/80 border-t px-5 py-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-[12px] font-bold tracking-[0.22em] uppercase">
            Trackr
          </span>
          <span className="text-muted-foreground font-mono text-[11px] tracking-[0.1em] uppercase">
            © {new Date().getFullYear()}
          </span>
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-[0.08em] uppercase">
          <span>Next.js · oRPC · Drizzle · Better Auth</span>
          <Link href="/login" className="hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="hover:text-foreground transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function Page() {
  // The landing page is committed to the night chart regardless of the
  // visitor's app theme.
  return (
    <div className="dark bg-background text-foreground min-h-screen">
      <TopBar />
      <Hero />
      <Rack />
      <Clearances />
      <Capabilities />
      <Close />
      <Footer />
    </div>
  );
}
