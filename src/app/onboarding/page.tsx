import { db } from "@/db/drizzle/connection";
import { workspaceMemberTable } from "@/db/drizzle/schema";
import { authGuard } from "@/features/user/guards/auth-guard";
import { CreateWorkspaceForm } from "@/features/workspace/components/create-workspace-form";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const [session, error] = await authGuard();

  if (error || !session) {
    redirect("/");
  }

  // Users who already belong to a workspace skip onboarding.
  const [membership] = await db
    .select({ id: workspaceMemberTable.id })
    .from(workspaceMemberTable)
    .where(eq(workspaceMemberTable.userId, session.user.id))
    .limit(1);

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-8 bg-[#0a0e1a] px-4 py-16">
      <Link
        href="/"
        className="text-xl font-bold text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Trackr
      </Link>
      <div className="animate-fade-in-up flex w-full justify-center">
        <CreateWorkspaceForm />
      </div>
    </div>
  );
}
