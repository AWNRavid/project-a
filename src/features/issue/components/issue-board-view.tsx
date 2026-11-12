"use client";

import { orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { IssueBoard } from "./issue-board";

interface IssueBoardViewProps {
  projectId: string;
  workspaceId: string;
}

/**
 * Connected container that fetches issues and renders the Kanban board.
 */
export function IssueBoardView({ projectId, workspaceId }: IssueBoardViewProps) {
  const {
    data: issues,
    isLoading,
    error,
    refetch,
  } = useQuery(
    orpcTanstackQueryUtils.issue.getAllIssues.queryOptions({
      input: { projectId },
    }),
  );

  return (
    <IssueBoard
      projectId={projectId}
      workspaceId={workspaceId}
      issues={issues ?? []}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
    />
  );
}
