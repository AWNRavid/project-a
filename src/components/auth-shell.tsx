import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

const sectors = [
  { label: "Backlog", tone: "var(--status-backlog)" },
  { label: "Todo", tone: "var(--status-todo)" },
  { label: "In progress", tone: "var(--status-progress)" },
  { label: "Done", tone: "var(--status-done)" },
];

/**
 * Entry surfaces share one frame: the chart table on the left, the form on
 * the right. On small screens the chart steps aside and the form leads.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <aside className="bg-card/30 relative hidden overflow-hidden border-r p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="graticule pointer-events-none absolute inset-0 opacity-35" />

        <Link
          href="/"
          className="relative flex items-baseline gap-3"
          aria-label="Trackr home"
        >
          <span className="text-[14px] font-bold tracking-[0.22em] uppercase">
            Trackr
          </span>
          <span className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
            Chart table
          </span>
        </Link>

        <div className="relative max-w-[26ch]">
          <p className="text-[34px] leading-[1.05] font-semibold tracking-[-0.02em]">
            Every issue, on one chart.
          </p>
          <p className="text-muted-foreground mt-4 max-w-[44ch] text-[13px] leading-relaxed">
            Workspaces, projects, roles and the route from backlog to done —
            one record that stays current while the work moves.
          </p>
        </div>

        <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2">
          {sectors.map((sector) => (
            <span key={sector.label} className="flex items-center gap-2">
              <span
                className="size-1.5 rounded-[1px]"
                style={{ background: sector.tone }}
                aria-hidden
              />
              <span className="chart-label">{sector.label}</span>
            </span>
          ))}
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[360px]">{children}</div>
      </main>
    </div>
  );
}
