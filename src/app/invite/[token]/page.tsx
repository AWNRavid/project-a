// Invite landing page at /invite/<token> (link target from the invite
// email). Guards login, then renders the client accept card.
import { authGuard } from "@/features/user/guards/auth-guard";
import { AcceptInviteCard } from "@/features/workspace/components/accept-invite-card";
import { redirect } from "next/navigation";

export default async function InvitePage({
  // Next 16 passes dynamic route params as a Promise.
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  // Unwrap the async params to reach the token.
  const { token } = await params;

  // Accepting requires an account: bounce to /login with a redirect
  // back here once authentication succeeds.
  const [session, error] = await authGuard();

  if (error || !session) {
    // carry the token through the query string — validated & used
    // below anyway (avoid trailing forged-looking logs; keep it only
    // for the login round-trip).
    redirect(`/login?redirect=/invite/${token}`);
  }

  // Centered single card: light dashboard palette, minimal chrome.
  return (
    <div className="bg-muted/40 flex min-h-svh w-full items-center justify-center px-4 py-16">
      {/* All invite logic/UX lives in the client card. */}
      <AcceptInviteCard token={token} />
    </div>
  );
}
