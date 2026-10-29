"use client";

import { Button } from "@/components/ui/button";
import { orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { IssueTable } from "./issue-table";

interface IssueListViewProps {
  projectId: string;
  workspaceId?: string;
}

/**
 * Connected container component managing query synchronization for issues and workspace members.
 */
export function IssueListView({
  projectId,
  workspaceId: initialWorkspaceId,
}: IssueListViewProps) {
  // If workspaceId is not explicitly provided, resolve it from the active workspace.
  const { data: workspaceData } = useQuery({
    ...orpcTanstackQueryUtils.workspace.listWorkspaces.queryOptions({
      input: {},
    }),
    enabled: !initialWorkspaceId,
  });

  const workspaceId =
    initialWorkspaceId ?? workspaceData?.workspaces[0]?.id ?? "";

  // Query issues belonging to this project
  const {
    data: issues,
    isLoading: isIssuesLoading,
    error: issuesError,
    refetch: refetchIssues,
  } = useQuery(
    orpcTanstackQueryUtils.issue.getAllIssues.queryOptions({
      input: {
        projectId,
      },
    }),
  );

  // Query members of the workspace for assignee assignment and filtering
  const { data: membersData } = useQuery({
    ...orpcTanstackQueryUtils.workspace.listMembers.queryOptions({
      input: {
        workspaceId,
      },
    }),
    enabled: Boolean(workspaceId),
  });

  if (issuesError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
        <AlertCircleIcon className="mb-2 size-8 text-rose-600 dark:text-rose-400" />
        <h3 className="text-sm font-semibold">Failed to load issues</h3>
        <p className="mt-1 max-w-sm text-xs text-rose-700 dark:text-rose-400">
          {issuesError instanceof Error
            ? issuesError.message
            : "An unexpected error occurred while loading project issues."}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchIssues()}
          className="mt-4 border-rose-300 bg-white hover:bg-rose-100 dark:border-rose-800 dark:bg-slate-900"
        >
          <RefreshCwIcon className="mr-1.5 size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <IssueTable
        projectId={projectId}
        workspaceId={workspaceId}
        issues={issues ?? []}
        isLoading={isIssuesLoading}
        members={membersData?.members ?? []}
      />
    </div>
  );
}

export { IssueListView as IssueList };
