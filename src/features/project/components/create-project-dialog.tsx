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
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlusIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { projectStatusSchema } from "../types";

const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  status: projectStatusSchema,
});

type createProjectFormValue = z.infer<typeof createProjectSchema>;

export function CreateProjectDialog({ workspaceId }: { workspaceId: string }) {
  const [openDialog, setOpenDialog] = useState(false);

  const form = useForm<createProjectFormValue>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "active",
    },
  });

  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: (data: createProjectFormValue) => {
      return orpcClient.project.createProject({
        title: data.title,
        description: data.description,
        workspaceId,
      });
    },
    onSuccess: () => {
      toast.success("Project created successfuly");
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
        error instanceof Error ? error.message : "Failed to create project",
      );
    },
  });

  const handleSubmit = (values: createProjectFormValue) => {
    if (!workspaceId) {
      toast.error("Workspace ID is missing");
      return;
    }
    createProjectMutation.mutate(values);
  };

  const isPending = createProjectMutation.isPending;

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button size="sm">
          {/* Icon of intent; the label names the action. */}
          <UserPlusIcon className="size-4" />
          Create new project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Add a new project to your collection.
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
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Insert project description here"
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
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Loading..." : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
