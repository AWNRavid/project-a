"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightIcon, FolderIcon, RefreshCwIcon } from "lucide-react";
import Link from "next/link";
import { parseProjectStatus, projectStatusTone } from "../types";
import { CreateProjectDialog } from "./create-project-dialog";

export function ProjectList() {
  const { data: workspaceData, isLoading: isWorkspaceLoading } = useQuery(
    orpcTanstackQueryUtils.workspace.listWorkspaces.queryOptions({ input: {} }),
  );

  const activeWorkspace = workspaceData?.workspaces[0];

  const {
    data: projectData,
    isLoading: isProjectLoading,
    error,
    refetch,
  } = useQuery(
    orpcTanstackQueryUtils.project.getAllProject.queryOptions({
      input: {
        workspaceId: activeWorkspace?.id ?? "",
      },
      enabled: !!activeWorkspace?.id,
    }),
  );

  const isLoading = isWorkspaceLoading || isProjectLoading;
  const projects = projectData?.projects ?? [];
  const total = projectData?.total ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="border-border rounded-[3px] border p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-5 w-44" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-2/3" />
            <Skeleton className="mt-4 h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-border flex flex-col items-start gap-3 rounded-[3px] border p-6">
        <RefreshCwIcon className="text-muted-foreground size-5" />
        <div>
          <h2 className="text-[15px] font-semibold">Projects did not load</h2>
          <p className="text-muted-foreground mt-1 max-w-prose text-[13px]">
            The workspace could not be read. This is usually a connection
            problem, not a permission one.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="border-border relative overflow-hidden rounded-[3px] border">
        <div className="graticule pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative flex flex-col items-start gap-4 px-6 py-14">
          <span className="border-border bg-card flex size-9 items-center justify-center rounded-[2px] border">
            <FolderIcon className="text-muted-foreground size-4" />
          </span>
          <div>
            <h2 className="text-[16px] font-semibold">
              No projects on the chart
            </h2>
            <p className="text-muted-foreground mt-1 max-w-[48ch] text-[13px] leading-relaxed">
              A project holds the issues, keys and board for one stream of work.
              Create the first one and its issues will appear here as a chart.
            </p>
          </div>
          {activeWorkspace ? (
            <CreateProjectDialog workspaceId={activeWorkspace.id} />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground font-mono text-[11px] tracking-[0.14em] uppercase">
          {total} {total === 1 ? "project" : "projects"} · newest first
        </p>
        {activeWorkspace ? (
          <CreateProjectDialog workspaceId={activeWorkspace.id} />
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const status = parseProjectStatus(project.status);
          const tone = status
            ? projectStatusTone[status]
            : "var(--muted-foreground)";

          return (
            <Link
              key={project.id}
              href={`/dashboard/project/${project.id}`}
              className="strip group hover:bg-muted/40 px-4 py-3.5 transition-colors"
              style={{ "--strip-accent": tone } as React.CSSProperties}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="tabular text-muted-foreground text-[11px] tracking-[0.08em] uppercase">
                  {project.key ?? "—"}
                </span>
                <span
                  className="text-[11px] font-semibold tracking-[0.1em] uppercase"
                  style={{ color: tone }}
                >
                  {project.status}
                </span>
              </div>

              <h2 className="group-hover:text-primary mt-2 text-[15px] leading-snug font-semibold transition-colors">
                {project.title}
              </h2>

              <p className="text-muted-foreground mt-1 line-clamp-2 min-h-[2.4em] text-[13px] leading-relaxed">
                {project.description || "No description yet."}
              </p>

              <div className="border-border/70 mt-3 flex items-center justify-between border-t pt-2.5">
                <span className="text-muted-foreground text-[11px]">
                  Open chart
                </span>
                <ArrowUpRightIcon className="text-muted-foreground group-hover:text-primary size-3.5 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
