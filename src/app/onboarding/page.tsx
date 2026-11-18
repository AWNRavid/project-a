// Onboarding: the first stop after login for users who do not belong
// to any workspace yet.
import { db } from "@/db/drizzle/connection";
import { workspaceMemberTable } from "@/db/drizzle/schema";
import { authGuard } from "@/features/user/guards/auth-guard";
import { CreateWorkspaceForm } from "@/features/workspace/components/create-workspace-form";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  // Anonymous visitors go back to the landing page.
  const [session, error] = await authGuard();

  if (error || !session) {
    redirect("/");
  }

  // Users who already belong to a workspace skip onboarding. A
  // cheap EXIST-style check (limit 1) is enough; memberships cascade
  // from the workspace, so one row means at least one workspace.
  const [membership] = await db
    .select({ id: workspaceMemberTable.id })
    .from(workspaceMemberTable)
    .where(eq(workspaceMemberTable.userId, session.user.id))
    .limit(1);

  if (membership) {
    redirect("/dashboard");
  }

  // Onboarding uses the same chart-table frame as the entry forms.
  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="graticule pointer-events-none absolute inset-0 opacity-40" />

      {/* Brand mark links back to the marketing home. */}
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

      <div className="relative flex w-full justify-center">
        <CreateWorkspaceForm />
      </div>

      <div className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {[
          { label: "Backlog", tone: "var(--status-backlog)" },
          { label: "Todo", tone: "var(--status-todo)" },
          { label: "In progress", tone: "var(--status-progress)" },
          { label: "Done", tone: "var(--status-done)" },
        ].map((sector) => (
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
    </div>
  );
}
