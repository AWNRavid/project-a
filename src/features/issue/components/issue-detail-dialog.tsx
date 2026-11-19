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
import { IssueActivitySection } from "@/features/activity/components/issue-activity-section";
import { IssueAttachmentsSection } from "@/features/attachment/components/issue-attachments-section";
import { IssueCommentsSection } from "@/features/comment/components/issue-comments-section";
import { IssueLabelsSection } from "@/features/label/components/issue-labels-section";
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs font-semibold tracking-wider uppercase">
              {issue.projectKey}-{issue.number}
            </span>
            <IssueStatusBadge status={issue.status} />
            <IssuePriorityBadge priority={issue.priority} />
          </div>
          <DialogTitle className="pt-1 text-[19px] leading-snug font-semibold tracking-tight">
            {issue.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Issue Description */}
          <div>
            <h4 className="chart-label mb-1.5">
              Description
            </h4>
            {issue.description ? (
              <div className="border-border bg-muted/40 rounded-[2px] border p-3 text-[13px] leading-relaxed whitespace-pre-wrap">
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
              <span className="chart-label flex items-center gap-1.5">
                <UserIcon className="size-3.5" /> Assignee
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                {issue.assigneeId ? (
                  <>
                    <Avatar className="size-6">
                      {issue.assigneeImage ? (
                        <AvatarImage src={issue.assigneeImage} />
                      ) : null}
                      <AvatarFallback className="text-[11px]">
                        {(issue.assigneeName ?? "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
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
              <span className="chart-label flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" /> Due Date
              </span>
              <p className="tabular pt-0.5 font-medium">
                {formatDate(issue.dueDate)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="chart-label">
                Created
              </span>
              <p className="text-muted-foreground tabular pt-0.5 text-[11px]">
                {formatDate(issue.createdAt)}
              </p>
            </div>

            <div className="space-y-1">
              <span className="chart-label">
                Updated
              </span>
              <p className="text-muted-foreground tabular pt-0.5 text-[11px]">
                {formatDate(issue.updatedAt)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Workspace labels attached to this issue. */}
          <IssueLabelsSection key={issue.id} issue={issue} />

          <Separator />

          {/* Files attached to this issue (stored in MinIO). */}
          <IssueAttachmentsSection issueId={issue.id} />

          <Separator />

          {/* Who changed what, and when. */}
          <IssueActivitySection issueId={issue.id} />

          <Separator />

          {/* Comments and Collaboration Section */}
          <IssueCommentsSection issueId={issue.id} />
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
