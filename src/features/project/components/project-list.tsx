"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MoreVerticalIcon } from "lucide-react";
import Link from "next/link";
import { CreateProjectDialog } from "./create-project-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { EditProjectDialog } from "./edit-project-dialog";

export function ProjectList() {
  const { data, isLoading } = useQuery(
    orpcTanstackQueryUtils.workspace.listWorkspaces.queryOptions({ input: {} }),
  );

  const workspace = data?.workspaces[0];

  const { data: projectListData } = useQuery({
    ...orpcTanstackQueryUtils.project.getAllProject.queryOptions({
      input: { workspaceId: workspace?.id ?? "" },
    }),
    enabled: !!workspace?.id,
  });

  // src/features/project/components/project-list.tsx
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-muted-foreground text-sm">
          You do not belong to any workspace yet.
        </p>
        <Button asChild>
          <Link href="/onboarding">Create a workspace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CreateProjectDialog workspaceId={workspace.id} />
      {projectListData?.length === 0 ? (
        <div>no project</div>
      ) : (
        <>
          {projectListData?.map((item) => {
            return (
              <Card key={item.id} className="group relative">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    <Link
                      href={`/dashboard/project/${item.id}`}
                      className="hover:underline focus:outline-none"
                    >
                      {item.title}
                    </Link>
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuGroup>
                        <DropdownMenuItem>
                          <EditProjectDialog
                            workspaceId={workspace.id}
                            project={item}
                          />
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <DeleteProjectDialog
                            workspaceId={workspace.id}
                            project={item}
                          />
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                    {/* Menu content */}
                  </DropdownMenu>
                </CardHeader>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
