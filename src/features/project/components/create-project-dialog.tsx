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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderPlusIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { projectFormSchema, type ProjectFormValues } from "../schemas";

export function CreateProjectDialog({ workspaceId }: { workspaceId: string }) {
  const [openDialog, setOpenDialog] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectFormValues) => {
      return orpcClient.project.createProject({
        title: data.title,
        description: data.description || null,
        workspaceId,
      });
    },
    onSuccess: () => {
      toast.success("Project created successfully");
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.project.getAllProject
          .queryOptions({
            input: { workspaceId },
          })
          .queryKey.slice(0, 2),
      });
      form.reset();
      setOpenDialog(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create project",
      );
    },
  });

  const isPending = createProjectMutation.isPending;

  const handleOpenChange = (open: boolean) => {
    // Clear a cancelled draft so the next open starts blank.
    if (!open) {
      form.reset();
    }
    setOpenDialog(open);
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <FolderPlusIcon className="size-4" />
          Create new project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
          <DialogDescription>
            A project holds the issues and board for one stream of work.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) =>
              createProjectMutation.mutate(values),
            )}
            className="space-y-4"
          >
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
                      placeholder="e.g. Mobile app"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={3}
                      className="resize-none"
                      placeholder="What is this project about?"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Creating..." : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
