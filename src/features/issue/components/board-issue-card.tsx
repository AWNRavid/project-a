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

const statusTone: Record<string, string> = {
  backlog: "var(--status-backlog)",
  todo: "var(--status-todo)",
  in_progress: "var(--status-progress)",
  done: "var(--status-done)",
  cancelled: "var(--status-cancelled)",
};

function formatDue(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

/**
 * Draggable strip representing a single issue in the board.
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

  const tone = statusTone[issue.status] ?? "var(--muted-foreground)";
  const due = formatDue(issue.dueDate);

  return (
    <div
      ref={setNodeRef}
      className={`strip group p-2.5 transition-shadow ${
        isDragging ? "ring-primary/60 opacity-40 shadow-lg ring-1" : ""
      }`}
      style={{ "--strip-accent": tone } as React.CSSProperties}
    >
      <div className="flex items-start gap-1.5">
        {/* Drag handle */}
        <button
          ref={setHandleRef}
          type="button"
          className="text-muted-foreground/60 hover:text-foreground mt-0.5 shrink-0 cursor-grab opacity-100 transition-opacity focus-visible:opacity-100 active:cursor-grabbing sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          aria-label="Drag to reorder"
        >
          <GripVerticalIcon className="size-3.5" />
        </button>

        <div className="min-w-0 flex-1">
          {/* Strip header: key and due date */}
          <div className="flex items-baseline justify-between gap-2">
            <span className="tabular text-muted-foreground text-[11px] font-medium tracking-[0.06em] uppercase">
              {issue.projectKey}-{issue.number}
            </span>
            {due ? (
              <span className="tabular text-muted-foreground text-[11px]">
                {due}
              </span>
            ) : null}
          </div>

          {/* Title */}
          <button
            type="button"
            onClick={() => onClick(issue)}
            className="hover:text-primary mt-1 block w-full text-left text-[13px] leading-snug font-medium transition-colors"
          >
            {issue.title}
          </button>

          {/* Footer: priority + assignee */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <IssuePriorityBadge priority={issue.priority as IssuePriority} />

            {issue.assigneeId && (
              <Avatar className="border-border size-5 shrink-0 rounded-[2px] border">
                {issue.assigneeImage ? (
                  <AvatarImage src={issue.assigneeImage} />
                ) : null}
                <AvatarFallback className="rounded-[2px] font-mono text-[11px]">
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
