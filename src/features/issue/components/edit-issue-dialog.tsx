"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { issuePrioritySchema, issueStatusSchema } from "../schemas";
import type { IssueDetail, IssuePriority, IssueStatus } from "../types";

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title cannot exceed 255 characters"),
  description: z.string().optional(),
  status: issueStatusSchema,
  priority: issuePrioritySchema,
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditIssueDialogProps {
  issue: IssueDetail;
  workspaceId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal dialog for updating existing issue attributes.
 */
export function EditIssueDialog({
  issue,
  workspaceId,
  open,
  onOpenChange,
}: EditIssueDialogProps) {
  const queryClient = useQueryClient();

  // Retrieve workspace members to populate assignee dropdown.
  const { data: membersData } = useQuery({
    ...orpcTanstackQueryUtils.workspace.listMembers.queryOptions({
      input: { workspaceId: workspaceId ?? issue.workspaceId },
    }),
    enabled: Boolean(workspaceId || issue.workspaceId),
  });

  const formatDateInputValue = (date: Date | null): string => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0] ?? "";
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: issue.title,
      description: issue.description ?? "",
      status: (issue.status as IssueStatus) ?? "backlog",
      priority: (issue.priority as IssuePriority) ?? "no_priority",
      assigneeId: issue.assigneeId ?? "unassigned",
      dueDate: formatDateInputValue(issue.dueDate),
    },
  });

  // Keep form in sync when selected issue changes.
  useEffect(() => {
    if (open) {
      form.reset({
        title: issue.title,
        description: issue.description ?? "",
        status: (issue.status as IssueStatus) ?? "backlog",
        priority: (issue.priority as IssuePriority) ?? "no_priority",
        assigneeId: issue.assigneeId ?? "unassigned",
        dueDate: formatDateInputValue(issue.dueDate),
      });
    }
  }, [issue, open, form]);

  const updateIssueMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const assigneeId =
        values.assigneeId && values.assigneeId !== "unassigned"
          ? values.assigneeId
          : null;

      const dueDate = values.dueDate ? new Date(values.dueDate) : null;

      return orpcClient.issue.updateIssue({
        issueId: issue.id,
        title: values.title,
        description: values.description || null,
        status: values.status,
        priority: values.priority,
        assigneeId,
        dueDate,
      });
    },
    onSuccess: () => {
      toast.success("Issue updated successfully");
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.issue.getAllIssues
          .queryOptions({
            input: { projectId: issue.projectId },
          })
          .queryKey.slice(0, 2),
      });
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.issue.getIssue.queryOptions({
          input: { issueId: issue.id },
        }).queryKey,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update issue",
      );
    },
  });

  const onSubmit = (values: FormValues) => {
    updateIssueMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            Edit Issue {issue.projectKey}-{issue.number}
          </DialogTitle>
          <DialogDescription>
            Update details and workflow status for this issue.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Issue summary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details, acceptance criteria, or context..."
                      rows={4}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
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
                        <SelectItem value="backlog">Backlog</SelectItem>
                        <SelectItem value="todo">Todo</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="no_priority">No priority</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {membersData?.members.map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-5">
                                {member.image ? (
                                  <AvatarImage src={member.image} />
                                ) : null}
                                <AvatarFallback className="text-[10px]">
                                  {member.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{member.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateIssueMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateIssueMutation.isPending}>
                {updateIssueMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
