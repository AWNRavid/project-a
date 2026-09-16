"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteMemberDialog } from "@/features/workspace/components/invite-member-dialog";
import { PendingInvitesList } from "@/features/workspace/components/pending-invites-list";
import { WorkspaceSettingsForm } from "@/features/workspace/components/workspace-settings-form";
import { orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";

/**
 * Fetches the user's memberships and renders the settings form for
 * the active workspace (the first membership, oldest first) until a
 * workspace switcher exists.
 */
export function WorkspaceSettings() {
  // Client-side fetch of the user's memberships via the oRPC +
  // TanStack Query stack (same pattern as the posts table).
  const { data, isLoading, error, refetch } = useQuery(
    orpcTanstackQueryUtils.workspace.listWorkspaces.queryOptions({
      input: {},
    }),
  );

  // Placeholder skeleton while the memberships load.
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    );
  }

  // Fetch failed: show the message and offer a retry.
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertTriangleIcon className="text-muted-foreground size-8" />
        <p className="text-muted-foreground text-sm">
          {error instanceof Error ? error.message : "Failed to load workspace"}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCwIcon className="size-4" />
          Try again
        </Button>
      </div>
    );
  }

  // Defensive case: users normally cannot reach settings without a
  // workspace (dashboard layout redirects), but keep the entry point
  // renderable anyway.
  const workspace = data?.workspaces[0];

  if (!workspace) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertTriangleIcon className="text-muted-foreground size-8" />
        <p className="text-muted-foreground text-sm">
          You do not belong to any workspace yet.
        </p>
        <Link
          href="/onboarding"
          className="text-sm underline underline-offset-4"
        >
          Create a workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Name + logo editor for the active workspace. */}
      <WorkspaceSettingsForm workspace={workspace} />

      {/* Team section: invite dialog + pending invitation rows. */}
      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>
            Invite people by email and manage pending invitations.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Owner/admin-only actions; the server enforces the roles. */}
          <InviteMemberDialog workspaceId={workspace.id} />
          {/* Live list of pending invitations with resend/cancel. */}
          <PendingInvitesList workspaceId={workspace.id} />
        </CardContent>
      </Card>
    </div>
  );
}
