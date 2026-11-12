"use client";

import { Button } from "@/components/ui/button";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PlusIcon } from "lucide-react";
import type { IssueDetail } from "../types";
import { BoardIssueCard } from "./board-issue-card";
import type { IssueStatus } from "../types";

interface BoardColumnProps {
  status: IssueStatus;
  label: string;
  headerClass: string;
  issues: IssueDetail[];
  onCardClick: (issue: IssueDetail) => void;
  onCreateClick: (status: IssueStatus) => void;
}

/**
 * Droppable column for a single Kanban status lane.
 */
export function BoardColumn({
  status,
  label,
  headerClass,
  issues,
  onCardClick,
  onCreateClick,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-[280px] shrink-0 flex-col rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      {/* Column header */}
      <div
        className={`flex items-center justify-between rounded-t-lg px-3 py-2.5 ${headerClass}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide uppercase">
            {label}
          </span>
          <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-black/20 dark:text-slate-400">
            {issues.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          onClick={() => onCreateClick(status)}
          aria-label={`Create issue in ${label}`}
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors ${
          isOver
            ? "bg-blue-50 dark:bg-blue-950/20"
            : ""
        }`}
        style={{ minHeight: 80 }}
      >
        <SortableContext
          items={issues.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {issues.map((issue) => (
            <BoardIssueCard key={issue.id} issue={issue} onClick={onCardClick} />
          ))}
        </SortableContext>

        {issues.length === 0 && !isOver && (
          <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-600">
            No issues
          </p>
        )}
      </div>
    </div>
  );
}
