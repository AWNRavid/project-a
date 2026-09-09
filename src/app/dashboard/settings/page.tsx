import { authGuard } from "@/features/user/guards/auth-guard";
import { WorkspaceSettings } from "@/features/workspace/components/workspace-settings";
import { redirect } from "next/navigation";

export default async function WorkspaceSettingsPage() {
  const [session, error] = await authGuard();

  if (error || !session) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your workspace.</p>
      </div>
      <WorkspaceSettings />
    </div>
  );
}
