"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IssueListView } from "@/features/issue/components/issue-list-view";
import { orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, FolderIcon } from "lucide-react";
import Link from "next/link";

interface ProjectViewProps {
  projectId: string;
}

export function ProjectView({ projectId }: ProjectViewProps) {
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
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-950">
        <FolderIcon className="text-muted-foreground mb-3 size-10" />
        <h2 className="text-lg font-semibold">Project not found</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          The requested project could not be found or you do not have permission
          to view it.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/dashboard">
            <ArrowLeftIcon className="mr-1.5 size-4" />
            Back to Projects
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Overview Header */}
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Link
            href="/dashboard"
            className="hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ArrowLeftIcon className="size-3" />
            Projects
          </Link>
          <span>/</span>
          <span className="text-foreground font-mono font-semibold uppercase">
            {project.key}
          </span>
        </div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {project.title}
              </h1>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 capitalize dark:bg-slate-800 dark:text-slate-300">
                {project.status}
              </span>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-1 text-sm">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Issues Table View */}
      <IssueListView
        projectId={projectId}
        workspaceId={workspace?.id ?? project.workspaceId}
      />
    </div>
  );
}
