"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import type { IssueDetail, IssuePriority } from "../types";
import { IssuePriorityBadge } from "./issue-priority-badge";

interface BoardIssueCardProps {
  issue: IssueDetail;
  onClick: (issue: IssueDetail) => void;
}

/**
 * Draggable card representing a single issue in the Kanban board.
 */
export function BoardIssueCard({ issue, onClick }: BoardIssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-md border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-700 dark:bg-slate-900 ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-blue-400" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
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
