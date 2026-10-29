"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, EditIcon, Trash2Icon, UserIcon } from "lucide-react";
import type { IssueDetail } from "../types";
import { IssuePriorityBadge } from "./issue-priority-badge";
import { IssueStatusBadge } from "./issue-status-badge";

interface IssueDetailDialogProps {
  issue: IssueDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (issue: IssueDetail) => void;
  onDelete?: (issue: IssueDetail) => void;
}

/**
 * Modal dialog for inspecting the comprehensive properties, description, and status of an issue.
 */
export function IssueDetailDialog({
  issue,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: IssueDetailDialogProps) {
  if (!issue) return null;

  const formatDate = (date: Date | null): string => {
    if (!date) return "None";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "None";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs font-semibold tracking-wider uppercase">
              {issue.projectKey}-{issue.number}
            </span>
            <IssueStatusBadge status={issue.status} />
            <IssuePriorityBadge priority={issue.priority} />
          </div>
          <DialogTitle className="pt-1 text-xl leading-snug font-bold">
            {issue.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Issue Description */}
          <div>
            <h4 className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase">
              Description
            </h4>
            {issue.description ? (
              <div className="rounded-md border bg-slate-50/50 p-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:bg-slate-900/50 dark:text-slate-200">
                {issue.description}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                No description provided.
              </p>
            )}
          </div>

          <Separator />

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                <UserIcon className="size-3.5" /> Assignee
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                {issue.assigneeId ? (
                  <>
                    <Avatar className="size-6">
                      {issue.assigneeImage ? (
                        <AvatarImage src={issue.assigneeImage} />
                      ) : null}
                      <AvatarFallback className="text-[10px]">
                        {(issue.assigneeName ?? "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {issue.assigneeName ?? "Unnamed member"}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground italic">
                    Unassigned
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
                <CalendarIcon className="size-3.5" /> Due Date
              </span>
              <p className="pt-0.5 font-medium text-slate-900 dark:text-slate-100">
                {formatDate(issue.dueDate)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Created
              </span>
              <p className="text-muted-foreground pt-0.5 text-xs">
                {formatDate(issue.createdAt)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Updated
              </span>
              <p className="text-muted-foreground pt-0.5 text-xs">
                {formatDate(issue.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2 pt-2 sm:justify-between">
          <div>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(issue);
                }}
              >
                <Trash2Icon className="mr-1.5 size-4" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(issue);
                }}
              >
                <EditIcon className="mr-1.5 size-4" />
                Edit
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
