"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, Building2Icon, FolderIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateProjectDialog } from "./create-project-dialog";

export function ProjectList() {
  const { data: workspaceData, isLoading: isWorkspaceLoading } = useQuery(
    orpcTanstackQueryUtils.workspace.listWorkspaces.queryOptions({ input: {} }),
  );

  const activeWorkspace = workspaceData?.workspaces[0];

  const {
    data: project,
    isLoading: isProjectLoading,
    error,
  } = useQuery(
    orpcTanstackQueryUtils.project.getAllProject.queryOptions({
      input: {
        workspaceId: activeWorkspace?.id ?? "",
      },
      enabled: !!activeWorkspace?.id,
    }),
  );

  const isLoading = isWorkspaceLoading || isProjectLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
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

  // Match the specific workspace that this project belongs to
  const workspace =
    workspaceData?.workspaces.find((w) => w.id === project[0].id) ??
    activeWorkspace;

  if (!workspace) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        {/* Breadcrumbs with Workspace and Project */}
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <Link
            href="/dashboard"
            className="hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {workspace?.logoUrl ? (
              <Avatar className="size-4 rounded-sm">
                <AvatarImage src={workspace.logoUrl} alt={workspace.name} />
                <AvatarFallback className="text-[9px]">
                  {workspace.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Building2Icon className="size-3" />
            )}
            <span>{workspace?.name ?? "Workspace"}</span>
          </Link>
          <span>/</span>
          <Link
            href="/dashboard"
            className="hover:text-foreground transition-colors"
          >
            Projects
          </Link>
        </div>

        <CreateProjectDialog workspaceId={workspace?.id} />

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          {project.map((item) => {
            return (
              <Link
                href={`/dashboard/project/${item.id}`}
                key={item.id}
                className="w-full"
              >
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h1>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 capitalize dark:bg-slate-800 dark:text-slate-300">
                    {item.status}
                  </span>
                </div>
                {item.description && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {item.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
