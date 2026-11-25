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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EditIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { editProjectFormSchema, type EditProjectFormValues } from "../schemas";
import { parseProjectStatus, projectStatuses, type Project } from "../types";

export function EditProjectDialog({
  workspaceId,
  project,
}: {
  workspaceId: string;
  project: Project;
}) {
  const [openDialog, setOpenDialog] = useState(false);
  const queryClient = useQueryClient();

  const savedValues: EditProjectFormValues = {
    title: project.title,
    description: project.description ?? "",
    status: parseProjectStatus(project.status) ?? "active",
  };

  const form = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectFormSchema),
    defaultValues: savedValues,
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: EditProjectFormValues) => {
      return orpcClient.project.updateProject({
        title: data.title,
        description: data.description || null,
        status: data.status,
        projectId: project.id,
        workspaceId,
      });
    },
    onSuccess: () => {
      toast.success("Project updated successfully");
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.project.getAllProject
          .queryOptions({
            input: { workspaceId },
          })
          .queryKey.slice(0, 2),
      });
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.project.getProject.queryOptions({
          input: { projectId: project.id, workspaceId },
        }).queryKey,
      });
      setOpenDialog(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update project",
      );
    },
  });

  const isPending = updateProjectMutation.isPending;

  const handleOpenChange = (open: boolean) => {
    // Start from the saved values every time so a cancelled edit does
    // not linger into the next open.
    if (open) {
      form.reset(savedValues);
    }
    setOpenDialog(open);
  };

  return (
    <Dialog open={openDialog} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <EditIcon className="size-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>
            Update the title, description and status of this project.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) =>
              updateProjectMutation.mutate(values),
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
                    <Input {...field} type="text" />
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
            <FormField
              name="status"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
