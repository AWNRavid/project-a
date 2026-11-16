"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSortable } from "@dnd-kit/react/sortable";
import { GripVerticalIcon } from "lucide-react";
import type { IssueDetail, IssuePriority, IssueStatus } from "../types";
import { IssuePriorityBadge } from "./issue-priority-badge";

interface BoardIssueCardProps {
  issue: IssueDetail;
  /** Position of the card within its column. */
  index: number;
  /** Column the card belongs to — sortable items only reorder within the same group. */
  group: IssueStatus;
  onClick: (issue: IssueDetail) => void;
}

/**
 * Draggable card representing a single issue in the Kanban board.
 */
export function BoardIssueCard({
  issue,
  index,
  group,
  onClick,
}: BoardIssueCardProps) {
  const {
    ref: setNodeRef,
    handleRef: setHandleRef,
    isDragging,
  } = useSortable({
    id: issue.id,
    index,
    group,
    type: "issue",
    accept: "issue",
  });

  return (
    <div
      ref={setNodeRef}
      className={`group rounded-md border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-700 dark:bg-slate-900 ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-blue-400" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          ref={setHandleRef}
          type="button"
          className="text-muted-foreground mt-0.5 shrink-0 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVerticalIcon className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          {/* Issue identifier */}
          <span className="text-muted-foreground font-mono text-[10px] font-semibold uppercase">
            {issue.projectKey}-{issue.number}
          </span>

          {/* Title */}
          <button
            type="button"
            onClick={() => onClick(issue)}
            className="mt-0.5 block w-full text-left text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
          >
            {issue.title}
          </button>

          {/* Footer: priority + assignee */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <IssuePriorityBadge priority={issue.priority as IssuePriority} />

            {issue.assigneeId && (
              <Avatar className="size-5 shrink-0">
                {issue.assigneeImage ? (
                  <AvatarImage src={issue.assigneeImage} />
                ) : null}
                <AvatarFallback className="text-[9px]">
                  {(issue.assigneeName ?? "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
