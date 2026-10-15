"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { projectTable } from "@/db/drizzle/schema";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const deleteProjectSchema = z.object({
  projectId: z.string().min(1, "Title is required"),
});

type deleteProjectFormValue = z.infer<typeof deleteProjectSchema>;

type Project = typeof projectTable.$inferSelect;

export function DeleteProjectDialog({
  workspaceId,
  project,
}: {
  workspaceId: string;
  project: Project;
}) {
  const [openDialog, setOpenDialog] = useState(false);

  const form = useForm<deleteProjectFormValue>({
    resolver: zodResolver(deleteProjectSchema),
    defaultValues: {
      projectId: "",
    },
  });

  const queryClient = useQueryClient();

  // src/features/project/components/delete-project-dialog.tsx
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: string) => {
      return orpcClient.project.deleteProject({ projectId });
    },
    onSuccess: () => {
      toast.success("Project deleted successfully");
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.project.getAllProject.queryOptions({
          input: { workspaceId },
        }).queryKey,
      });
      setOpenDialog(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project",
      );
    },
  });

  const handleDelete = () => {
    deleteProjectMutation.mutate(project.id);
  };

  const isPending = deleteProjectMutation.isPending;

  const handleDeleteClick = useCallback(
    (project: Project) => {
      form.reset({
        projectId: project.id,
      });
      setOpenDialog(true);
    },
    [form],
  );

  return (
    <div className="">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              handleDeleteClick(project);
            }}
            className="text-blue-600 transition-transform hover:scale-105 hover:text-blue-700"
          >
            <Trash2Icon className="h-4 w-4" />
            Delete
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete post</TooltipContent>
      </Tooltip>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Delete Project
            </DialogTitle>
            <DialogDescription>Delete project.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleDelete)}>
              <DialogFooter>
                <Button
                  type="button"
                  variant={"outline"}
                  onClick={(e) => {
                    setOpenDialog(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isPending ? "Loading..." : "Delete project"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
