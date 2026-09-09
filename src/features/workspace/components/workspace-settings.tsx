"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { data, isLoading, error, refetch } = useQuery(
    orpcTanstackQueryUtils.workspace.listWorkspaces.queryOptions({
      input: {},
    }),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full max-w-md" />
      </div>
    );
  }

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

  return <WorkspaceSettingsForm workspace={workspace} />;
}
