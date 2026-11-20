"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IssueBoardView } from "@/features/issue/components/issue-board-view";
import { IssueListView } from "@/features/issue/components/issue-list-view";
import { orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon, KanbanIcon, ListIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProjectViewProps {
  projectId: string;
  initialIssueId?: string | null;
}

type ViewMode = "list" | "board";

export function ProjectView({
  projectId,
  initialIssueId,
}: ProjectViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const { data: workspaceData } = useQuery(
    orpcTanstackQueryUtils.workspace.listWorkspaces.queryOptions({ input: {} }),
  );

  const workspace = workspaceData?.workspaces[0];

  const {
    data: project,
    isLoading,
    error,
  } = useQuery(
    orpcTanstackQueryUtils.project.getProject.queryOptions({
      input: {
        projectId,
        workspaceId: workspace?.id ?? "",
      },
      enabled: !!workspace?.id,
    }),
  );

  if (isLoading) {
    return (
      <div className="px-6 pt-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-7 w-72" />
        <Skeleton className="mt-2 h-3 w-96" />
        <Skeleton className="mt-8 h-64 w-full rounded-[3px]" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="px-6 pt-10">
        <div className="border-border flex flex-col items-start gap-3 rounded-[3px] border p-6">
          <div>
            <h2 className="text-[15px] font-semibold">Project not found</h2>
            <p className="text-muted-foreground mt-1 max-w-prose text-[13px]">
              This project could not be read, or your role in the workspace does
              not cover it.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Back to projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  const workspaceId = workspace?.id ?? project.workspaceId;
  const tone =
    project.status === "completed"
      ? "var(--status-done)"
      : project.status === "archived"
        ? "var(--status-backlog)"
        : "var(--status-todo)";

  return (
    <div className="pb-8">
      <PageHeader
        breadcrumb={
          <>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <ChevronRightIcon className="text-border size-3" aria-hidden />
            <span className="tabular text-foreground text-[11px] font-medium tracking-[0.08em] uppercase">
              {project.key}
            </span>
            <span
              className="ml-1 text-[11px] font-semibold tracking-[0.1em] uppercase"
              style={{ color: tone }}
            >
              {project.status}
            </span>
          </>
        }
        title={project.title}
        description={project.description || "No description for this project yet."}
        actions={
          <div
            className="border-border flex items-center gap-0.5 rounded-[3px] border p-0.5"
            role="group"
            aria-label="View mode"
          >
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 px-2 text-[12px]"
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
            >
              <ListIcon className="size-3.5" />
              List
            </Button>
            <Button
              variant={viewMode === "board" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 px-2 text-[12px]"
              onClick={() => setViewMode("board")}
              aria-pressed={viewMode === "board"}
            >
              <KanbanIcon className="size-3.5" />
              Board
            </Button>
          </div>
        }
      />

      <div className="px-6 pt-5">
        {viewMode === "list" ? (
          <IssueListView
            projectId={projectId}
            workspaceId={workspaceId}
            initialIssueId={initialIssueId}
          />
        ) : (
          <IssueBoardView projectId={projectId} workspaceId={workspaceId} />
        )}
      </div>
    </div>
  );
}
