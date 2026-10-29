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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { projectTable } from "@/db/drizzle/schema";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditIcon, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const editProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

type editProjectFormValue = z.infer<typeof editProjectSchema>;

type Project = typeof projectTable.$inferSelect;

export function EditProjectDialog({
  workspaceId,
  project,
}: {
  workspaceId: string;
  project: Project;
}) {
  const [openDialog, setOpenDialog] = useState(false);

  const form = useForm<editProjectFormValue>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      title: "",
    },
  });

  const queryClient = useQueryClient();

  const updateProjectMutation = useMutation({
    mutationFn: (data: editProjectFormValue) => {
      return orpcClient.project.updateProject({
        title: data.title,
        projectId: project.id,
        workspaceId,
      });
    },
    onSuccess: () => {
      toast.success("Project edited successfuly");
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.project.getAllProject
          .queryOptions({ input: { workspaceId } })
          .queryKey.slice(0, 3),
      });
      form.reset();
      setOpenDialog(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to edit project",
      );
    },
  });

  const handleSubmit = (values: editProjectFormValue) => {
    if (!workspaceId) {
      toast.error("Workspace ID is missing");
      return;
    }
    updateProjectMutation.mutate(values);
  };

  const isPending = updateProjectMutation.isPending;

  const handleEditClick = useCallback(
    (project: Project) => {
      form.reset({
        title: project.title,
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
            onClick={() => {
              handleEditClick(project);
            }}
            className="text-blue-600 transition-transform hover:scale-105 hover:text-blue-700"
          >
            <EditIcon className="h-4 w-4" />
            Edit
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit post</TooltipContent>
      </Tooltip>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Edit Project
            </DialogTitle>
            <DialogDescription>
              Edit project title and description
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                name="title"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Insert project title here"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant={"outline"}
                  onClick={() => {
                    setOpenDialog(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isPending ? "Loading..." : "Edit project"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
