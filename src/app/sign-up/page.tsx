import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "@/features/user/components/sign-up-form";
import { authGuard } from "@/features/user/guards/auth-guard";
import { redirect } from "next/navigation";

export default async function Page() {
  const [session] = await authGuard();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell>
      <SignUpForm />
    </AuthShell>
  );
}
