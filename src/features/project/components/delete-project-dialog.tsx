"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { Project } from "../types";

export function DeleteProjectDialog({
  workspaceId,
  project,
}: {
  workspaceId: string;
  project: Project;
}) {
  const [openDialog, setOpenDialog] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const deleteProjectMutation = useMutation({
    mutationFn: () => {
      return orpcClient.project.deleteProject({ projectId: project.id });
    },
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.project.getAllProject
          .queryOptions({
            input: { workspaceId },
          })
          .queryKey.slice(0, 2),
      });
      setOpenDialog(false);
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project",
      );
    },
  });

  const isPending = deleteProjectMutation.isPending;

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Trash2Icon className="size-3.5" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            Delete &quot;{project.title}&quot; and all of its issues? This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpenDialog(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => deleteProjectMutation.mutate()}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? "Deleting..." : "Delete project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
