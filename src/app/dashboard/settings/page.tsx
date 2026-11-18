// Workspace settings page. Server component: guards access, then
// renders the client-managed settings form.
import { PageHeader } from "@/components/page-header";
import { authGuard } from "@/features/user/guards/auth-guard";
import { WorkspaceSettings } from "@/features/workspace/components/workspace-settings";
import { redirect } from "next/navigation";

export default async function WorkspaceSettingsPage() {
  // Redirect unauthenticated users to the landing page.
  const [session, error] = await authGuard();

  if (error || !session) {
    redirect("/");
  }

  // The child component fetches the workspace client-side; nothing
  // workspace-specific is needed on the server besides the guard.
  return (
    <div className="pb-10">
      <PageHeader
        title="Workspace settings"
        description="The workspace identity, its members, the invitations in flight, and the exits."
      />

      <div className="px-6 pt-5">
        <WorkspaceSettings />
      </div>
    </div>
  );
}
