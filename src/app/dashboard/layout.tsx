import { DashboardNavbar } from "@/components/navigation/dashboard-navbar";
import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { db } from "@/db/drizzle/connection";
import { workspaceMemberTable } from "@/db/drizzle/schema";
import { authGuard } from "@/features/user/guards/auth-guard";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // check if user is logged in
  const [session, error] = await authGuard();

  if (error || !session) {
    redirect("/");
  }

  // Users without a workspace are sent to onboarding first. A cheap
  // EXIST-style check (limit 1); membership implies the workspace
  // exists because of the foreign keys.
  const [membership] = await db
    .select({ id: workspaceMemberTable.id })
    .from(workspaceMemberTable)
    .where(eq(workspaceMemberTable.userId, session.user.id))
    .limit(1);

  if (!membership) {
    redirect("/onboarding");
  }

  // Dashboard shell: fixed sidebar next to a scrollable main area
  // with the top navbar.
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardNavbar />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
