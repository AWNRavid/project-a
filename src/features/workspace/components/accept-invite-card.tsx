// Accept-invite client card at /invite/<token>: preview what the user
// is being invited to, then accept (server validates token, email
// match, expiry) and redirect to the dashboard.
"use client";

// Button + spinner + variant for the accept CTA.
import { Button } from "@/components/ui/button";
// Card wraps the invite preview and its action.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Skeleton placeholders while the preview loads.
import { Skeleton } from "@/components/ui/skeleton";
// Typed oRPC client + TanStack Query utils (preview/accept calls).
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
// Preview query + accept mutation + cache invalidation.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Icons: warning (fetch error), clock (expired), cross (invalid),
// check (accept CTA), spinner for pending states.
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2,
  XCircleIcon,
} from "lucide-react";
// Router push after a successful accept.
import { useRouter } from "next/navigation";
// Toast feedback for accept success/failure.
import { toast } from "sonner";

export type AcceptInviteCardProps = {
  // Raw token from the URL — the lookup key for preview + accept.
  token: string;
};

export function AcceptInviteCard({ token }: AcceptInviteCardProps) {
  const router = useRouter();

  // Invalidate workspace queries once the user belongs somewhere new.
  const queryClient = useQueryClient();

  // Public preview: workspace/inviter/email/expiry or valid=false.
  const {
    data: preview,
    isLoading,
    error,
    refetch,
  } = useQuery(
    orpcTanstackQueryUtils.workspace.getInvite.queryOptions({
      input: { token },
    }),
  );

  // Accepts the invite; on any success the user lands in the
  // dashboard (already a member or just joined both count as done).
  const acceptInviteMutation = useMutation({
    // oRPC call carrying the URL token.
    mutationFn: () => orpcClient.workspace.acceptInvite({ token }),
    onSuccess: (result) => {
      // Message differs depending on the server outcome.
      toast.success(
        result.alreadyMember
          ? `You are already a member of ${result.workspace.name}`
          : `Welcome to ${result.workspace.name}!`,
      );
      // Sidebar shows the new workspace right away.
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.workspace.listWorkspaces
          .queryOptions({ input: {} })
          .queryKey.slice(0, 2),
      });
      // Invite consumed → on with the normal dashboard flow.
      router.push("/dashboard");
    },
    onError: (error) => {
      // Server messages (expired, wrong account, etc.) surface as a
      // toast and the user stays on the card.
      toast.error(
        error instanceof Error ? error.message : "Failed to accept invite",
      );
    },
  });

  // Loading state: skeleton card matching the final layout size.
  if (isLoading) {
    return (
      <div className="w-full max-w-sm">
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  // Preview failed (e.g. internal error): message + retry button.
  if (error) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertTriangleIcon className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">
            {error instanceof Error
              ? error.message
              : "Failed to load invitation"}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Invalid token (cancelled/wrong): no details shown.
  if (!preview || !preview.valid) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <XCircleIcon className="text-muted-foreground size-10" />
          <CardTitle className="text-lg">Invitation not found</CardTitle>
          <p className="text-muted-foreground text-sm">
            This invitation link is wrong or it has been cancelled.
          </p>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Valid token but past its expiry: explain the remedy (resend).
  if (preview.expired) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <ClockIcon className="text-muted-foreground size-10" />
          <CardTitle className="text-lg">Invitation expired</CardTitle>
          <p className="text-muted-foreground text-sm">
            The invitation for{" "}
            <span className="font-medium">{preview.email}</span> expired on{" "}
            {preview.expiresAt.toISOString().slice(0, 10)} — ask{" "}
            {preview.inviterName} to resend it.
          </p>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Healthy invite: invite summary + accept action.
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>You are invited</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Invite summary block. */}
        <div className="text-sm">
          {/* Who invited whom. */}
          <p className="font-medium">
            {preview.inviterName} invites you to join
          </p>
          {/* Target workspace name is the highlighted fact. */}
          <p className="text-2xl font-semibold tracking-tight">
            {preview.workspaceName}
          </p>
          {/* Role they will receive + which email must be signed in. */}
          <p className="text-muted-foreground mt-1">
            Role: {/* Capitalize the role for display. */}
            {preview.role.charAt(0).toUpperCase() + preview.role.slice(1)} ·
            For: {preview.email}
          </p>
          {/* Expiry date so recipients act in time. */}
          <p className="text-muted-foreground mt-1">
            Valid until {preview.expiresAt.toISOString().slice(0, 10)} (UTC)
          </p>
        </div>
        {/* Accept CTA: disabled while the accept call is pending. */}
        <Button
          onClick={() => acceptInviteMutation.mutate()}
          disabled={acceptInviteMutation.isPending}
          className="w-full"
        >
          {/* Spinner while the server is creating the membership. */}
          {acceptInviteMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {/* "Success" check is rendered only on the way out. */}
          {!acceptInviteMutation.isPending && (
            <CheckCircle2Icon className="mr-2 size-4" />
          )}
          {acceptInviteMutation.isPending ? "Accepting..." : "Accept invite"}
        </Button>
      </CardContent>
    </Card>
  );
}
