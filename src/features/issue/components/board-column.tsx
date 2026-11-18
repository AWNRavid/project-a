"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDroppable } from "@dnd-kit/react";
import { PlusIcon } from "lucide-react";
import type { IssueDetail, IssueStatus } from "../types";
import { BoardIssueCard } from "./board-issue-card";

/**
 * `CollisionPriority.Low` — cards outrank their column when both overlap, so
 * the column only wins when hovering empty space.
 */
const COLUMN_COLLISION_PRIORITY = 1;

interface BoardColumnProps {
  status: IssueStatus;
  label: string;
  tone: string;
  issues: IssueDetail[];
  isLoading?: boolean;
  onCardClick: (issue: IssueDetail) => void;
  onCreateClick: (status: IssueStatus) => void;
}

/**
 * Droppable sector for a single status lane.
 */
export function BoardColumn({
  status,
  label,
  tone,
  issues,
  isLoading = false,
  onCardClick,
  onCreateClick,
}: BoardColumnProps) {
  const { ref: setDropTarget, isDropTarget } = useDroppable({
    id: status,
    accept: "issue",
    collisionPriority: COLUMN_COLLISION_PRIORITY,
  });

  return (
    <div className="sector flex w-[272px] shrink-0 flex-col">
      {/* Sector header */}
      <div className="border-border/80 flex items-center justify-between gap-2 border-b px-2.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-[1px]"
            style={{ background: tone }}
            aria-hidden
          />
          <span className="chart-label truncate" style={{ color: tone }}>
            {label}
          </span>
          <span className="tabular text-muted-foreground text-[11px]">
            {issues.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground size-6"
          onClick={() => onCreateClick(status)}
          aria-label={`Create issue in ${label}`}
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>

      {/* Drop zone */}
      <div
        ref={setDropTarget}
        className={`flex flex-1 flex-col gap-1.5 overflow-y-auto p-2 transition-colors ${
          isDropTarget ? "bg-primary/8" : ""
        }`}
        style={{ minHeight: 96 }}
      >
        {isLoading
          ? [0, 1].map((index) => (
              <div
                key={index}
                className="border-border rounded-[2px] border p-2.5"
              >
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            ))
          : issues.map((issue, index) => (
              <BoardIssueCard
                key={issue.id}
                issue={issue}
                index={index}
                group={status}
                onClick={onCardClick}
              />
            ))}

        {!isLoading && issues.length === 0 && !isDropTarget && (
          <div className="hatch flex flex-1 items-center justify-center rounded-[2px] px-3 py-6">
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
              No strips cleared
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
