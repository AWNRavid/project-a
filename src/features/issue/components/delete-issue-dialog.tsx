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
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { IssueDetail } from "../types";

interface DeleteIssueDialogProps {
  issue: IssueDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Confirmation dialog for permanently deleting an issue.
 */
export function DeleteIssueDialog({
  issue,
  open,
  onOpenChange,
}: DeleteIssueDialogProps) {
  const queryClient = useQueryClient();

  const deleteIssueMutation = useMutation({
    mutationFn: (issueId: string) => {
      return orpcClient.issue.deleteIssue({ issueId });
    },
    onSuccess: () => {
      toast.success("Issue deleted successfully");
      if (issue) {
        queryClient.invalidateQueries({
          queryKey: orpcTanstackQueryUtils.issue.getAllIssues
            .queryOptions({
              input: { projectId: issue.projectId },
            })
            .queryKey.slice(0, 2),
        });
      }
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete issue",
      );
    },
  });

  const handleDelete = () => {
    if (!issue) return;
    deleteIssueMutation.mutate(issue.id);
  };

  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="text-destructive flex items-center gap-2">
            <AlertTriangleIcon className="size-5" />
            <DialogTitle>Delete Issue</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete{" "}
            <span className="text-foreground font-semibold">
              {issue.projectKey}-{issue.number} (&quot;{issue.title}&quot;)
            </span>
            ? This action cannot be undone and will permanently remove this
            issue.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteIssueMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteIssueMutation.isPending}
          >
            {deleteIssueMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
