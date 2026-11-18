import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/features/user/components/login-form";
import { authGuard } from "@/features/user/guards/auth-guard";
import { redirect } from "next/navigation";

export default async function Page() {
  const [session] = await authGuard();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
