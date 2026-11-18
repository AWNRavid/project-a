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
      <div className="border-destructive/40 bg-destructive/8 flex flex-col items-start gap-3 rounded-[3px] border p-6">
        <AlertCircleIcon className="text-destructive size-5" />
        <div>
          <h3 className="text-[14px] font-semibold">Issues did not load</h3>
          <p className="text-muted-foreground mt-1 max-w-prose text-[12px]">
            {issuesError instanceof Error
              ? issuesError.message
              : "An unexpected error occurred while loading project issues."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchIssues()}>
          <RefreshCwIcon className="mr-1.5 size-3.5" />
          Try again
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
