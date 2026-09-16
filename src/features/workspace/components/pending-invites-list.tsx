// Client list of a workspace's pending invites with resend/cancel
// actions. Lives under the settings form on the settings page.
"use client";

// Button variants for the row actions.
import { Button } from "@/components/ui/button";
// Spinning indicator while rows load.
import { Skeleton } from "@/components/ui/skeleton";
// Type-safe router output type for one pending invite.
import type { InferRouterOutputs } from "@orpc/server";
// Typed oRPC client + TanStack Query utils (query + cache keys).
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import type { Router } from "@/lib/orpc/router";
// Query (fetch pending invites) + mutations (resend/cancel) + invalidation.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Row icons: repeat arrow (resend) and trash (cancel).
import { Loader2, RefreshCwIcon, XIcon } from "lucide-react";
// Toast notifications for action feedback.
import { toast } from "sonner";

// Server shape of the listInvites route output → one invite's type.
type ListInvitesResponse =
  InferRouterOutputs<Router>["workspace"]["listInvites"];
type PendingInvite = ListInvitesResponse["invites"][number];

// Prop shape: the list is bound to one workspace.
type WorkspaceId = { workspaceId: string };

export function PendingInvitesList({ workspaceId }: WorkspaceId) {
  // Live query of this workspace's pending (unexpired) invites.
  const { data, isLoading } = useQuery(
    orpcTanstackQueryUtils.workspace.listInvites.queryOptions({
      input: { workspaceId },
    }),
  );

  // Mutations invalidate this list, so both hooks share one client.
  const queryClient = useQueryClient();

  // Invalidate every listInvites query for this workspace.
  const refreshPendingInvites = () => {
    queryClient.invalidateQueries({
      queryKey: orpcTanstackQueryUtils.workspace.listInvites
        .queryOptions({ input: { workspaceId } })
        .queryKey.slice(0, 3),
    });
  };

  // Re-sends the invite email; renewing the token/expiry if expired.
  const resendInviteMutation = useMutation({
    // Route call keyed by the invite row id.
    mutationFn: (invite: PendingInvite) =>
      orpcClient.workspace.resendInvite({ inviteId: invite.id }),
    onSuccess: (_data, invite) => {
      // Confirm in which inbox they should look.
      toast.success(`Invitation re-sent to ${invite.email}`);
      // Expiry may have been renewed — refresh the list display.
      refreshPendingInvites();
    },
    onError: (error) => {
      // Surface server messages (e.g. send failure) as a toast.
      toast.error(
        error instanceof Error ? error.message : "Failed to resend invite",
      );
    },
  });

  // Deletes the pending invite row outright.
  const cancelInviteMutation = useMutation({
    // Same addressing as resend: row id.
    mutationFn: (invite: PendingInvite) =>
      orpcClient.workspace.cancelInvite({ inviteId: invite.id }),
    onSuccess: (_data, invite) => {
      // Confirm the removal (toast names the email).
      toast.success(`Invitation for ${invite.email} cancelled`);
      // The row is gone — refresh the list display.
      refreshPendingInvites();
    },
    onError: (error) => {
      // Server message toast fallback for unexpected failures.
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel invite",
      );
    },
  });

  // Skeleton rows while the query is resolving.
  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  // An empty pending set means nothing to manage here.
  const invites = data?.invites ?? [];

  if (invites.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No pending invitations.</p>
    );
  }

  return (
    // Simple bordered list of pending invitation rows.
    <ul className="flex flex-col divide-y">
      {/* One row per pending invite. */}
      {invites.map((invite) => (
        <li
          key={invite.id}
          className="flex items-center justify-between gap-4 py-3"
        >
          {/* Invitation summary: email, role, who invited, expiry. */}
          <div className="min-w-0 text-sm">
            {/* The invitee's email is the row's main identifier. */}
            <p className="truncate font-medium">{invite.email}</p>
            {/* Secondary line: role, who invited, when it lapses. */}
            <p className="text-muted-foreground mt-0.5">
              {/* Role capitalized: "Member" / "Admin". */}
              {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)} ·
              invited by {invite.invitedByName} ·{" "}
              {/* Compact UTC date keeps the row to one line. */}
              expires {invite.expiresAt.toISOString().slice(0, 10)}
            </p>
          </div>
          {/* Row actions: resend then cancel. */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Resend: re-delivers the invite email. */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                resendInviteMutation.isPending || cancelInviteMutation.isPending
              }
              onClick={() => resendInviteMutation.mutate(invite)}
            >
              {/* Spinner replaces the icon while sending. */}
              {resendInviteMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCwIcon className="size-4" />
              )}
              Resend
            </Button>
            {/* Cancel: deletes the pending invite outright. */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={
                resendInviteMutation.isPending || cancelInviteMutation.isPending
              }
              onClick={() => cancelInviteMutation.mutate(invite)}
            >
              {/* Spinner while the cancellation is in flight. */}
              {cancelInviteMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XIcon className="size-4" />
              )}
              Cancel
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
