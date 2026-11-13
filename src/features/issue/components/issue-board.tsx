"use client";

import { Button } from "@/components/ui/button";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import {
  type DragEndEvent,
  type DragOverEvent,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { IssueDetail, IssueStatus } from "../types";
import { BoardColumn } from "./board-column";
import { BoardIssueCard } from "./board-issue-card";
import { CreateIssueDialog } from "./create-issue-dialog";
import { IssueDetailDialog } from "./issue-detail-dialog";

const COLUMNS: { status: IssueStatus; label: string; headerClass: string }[] =
  [
    {
      status: "backlog",
      label: "Backlog",
      headerClass:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    },
    {
      status: "todo",
      label: "Todo",
      headerClass:
        "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    },
    {
      status: "in_progress",
      label: "In Progress",
      headerClass:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    },
    {
      status: "done",
      label: "Done",
      headerClass:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
  ];

/**
 * Generates a fractional-index string between two existing order values.
 * Uses lexicographic midpoint so inserts never require renumbering.
 * ponytail: naive ASCII midpoint — good enough until > 1 000 reorders in same gap.
 */
function midpoint(a: string, b: string): string {
  const pad = Math.max(a.length, b.length) + 1;
  const aPadded = a.padEnd(pad, "0");
  const bPadded = b.padEnd(pad, "~"); // '~' is ASCII 126, above printable range

  let result = "";
  for (let i = pad - 1; i >= 0; i--) {
    const aCode = aPadded.charCodeAt(i);
    const bCode = bPadded.charCodeAt(i);
    // We don't actually need per-digit carry — just average the two codes.
    result = String.fromCharCode(Math.floor((aCode + bCode) / 2)) + result;
  }
  // Trim trailing chars equal to the lower bound to keep strings short.
  return result.replace(/0+$/, "") || "0";
}

/**
 * Computes new `order` for a card dropped at `targetIndex` in `sortedItems`.
 */
function computeOrder(
  sortedItems: IssueDetail[],
  targetIndex: number,
  droppedId: string,
): string {
  const items = sortedItems.filter((i) => i.id !== droppedId);
  const before = items[targetIndex - 1];
  const after = items[targetIndex];

  if (!before && !after) return "a0";
  if (!before) return midpoint("", after.order);
  if (!after) return midpoint(before.order, "~".repeat(before.order.length + 2));
  return midpoint(before.order, after.order);
}

interface IssueBoardProps {
  projectId: string;
  workspaceId: string;
  issues: IssueDetail[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

/**
 * Kanban board view for a project. Renders one column per status and supports
 * drag-and-drop reordering within and between columns with optimistic updates.
 */
export function IssueBoard({
  projectId,
  workspaceId,
  issues,
  isLoading,
  error,
  onRetry,
}: IssueBoardProps) {
  const queryClient = useQueryClient();

  const [activeIssue, setActiveIssue] = useState<IssueDetail | null>(null);
  const [selectedForDetail, setSelectedForDetail] =
    useState<IssueDetail | null>(null);
  const [createForStatus, setCreateForStatus] = useState<IssueStatus | null>(
    null,
  );

  // Group issues by status, sorted by order then number
  const columns = useMemo(() => {
    const grouped = new Map<IssueStatus, IssueDetail[]>(
      COLUMNS.map((c) => [c.status, []]),
    );
    for (const issue of issues) {
      const bucket = grouped.get(issue.status as IssueStatus);
      if (bucket) bucket.push(issue);
    }
    for (const [, bucket] of grouped) {
      bucket.sort((a, b) =>
        a.order < b.order ? -1 : a.order > b.order ? 1 : a.number - b.number,
      );
    }
    return grouped;
  }, [issues]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const queryKey = orpcTanstackQueryUtils.issue.getAllIssues.queryKey({
    input: { projectId },
  });

  /** Optimistically update cache then persist to server. */
  const persist = useCallback(
    async (issueId: string, status: IssueStatus, order: string) => {
      // Snapshot for rollback
      const previous = queryClient.getQueryData<IssueDetail[]>(queryKey);

      // Optimistic update
      queryClient.setQueryData<IssueDetail[]>(queryKey, (old) =>
        old
          ? old.map((i) =>
              i.id === issueId ? { ...i, status, order } : i,
            )
          : old,
      );

      try {
        await orpcClient.issue.updateIssue({ issueId, status, order });
      } catch {
        // Rollback
        queryClient.setQueryData(queryKey, previous);
        toast.error("Failed to save issue position");
      }
    },
    [queryClient, queryKey],
  );

  const handleDragStart = useCallback(
    ({ active }: { active: { id: string | number } }) => {
      const found = issues.find((i) => i.id === active.id);
      setActiveIssue(found ?? null);
    },
    [issues],
  );

  const handleDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (!over || active.id === over.id) return;

      // Determine destination status (column id or another card's status)
      const destStatus = (
        COLUMNS.some((c) => c.status === over.id)
          ? over.id
          : issues.find((i) => i.id === over.id)?.status
      ) as IssueStatus | undefined;

      if (!destStatus) return;

      const srcIssue = issues.find((i) => i.id === active.id);
      if (!srcIssue || srcIssue.status === destStatus) return;

      // Optimistic cross-column move without persisting yet (persisted on dragEnd)
      queryClient.setQueryData<IssueDetail[]>(queryKey, (old) =>
        old
          ? old.map((i) =>
              i.id === active.id ? { ...i, status: destStatus } : i,
            )
          : old,
      );
    },
    [issues, queryClient, queryKey],
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      setActiveIssue(null);
      if (!over) return;

      const movedIssue = issues.find((i) => i.id === active.id);
      if (!movedIssue) return;

      // Destination status
      const destStatus = (
        COLUMNS.some((c) => c.status === over.id)
          ? over.id
          : issues.find((i) => i.id === over.id)?.status ??
            movedIssue.status
      ) as IssueStatus;

      // Current ordered list in the destination column (including the moving card)
      const destItems = (columns.get(destStatus) ?? []).map((i) =>
        i.id === movedIssue.id ? { ...movedIssue, status: destStatus } : i,
      );

      // If the moved card was already in this column, preserve relative order
      const overIndex = destItems.findIndex((i) => i.id === over.id);
      const activeIndex = destItems.findIndex((i) => i.id === active.id);

      let finalItems = destItems;
      if (
        activeIndex !== -1 &&
        overIndex !== -1 &&
        activeIndex !== overIndex
      ) {
        finalItems = arrayMove(destItems, activeIndex, overIndex);
      } else if (activeIndex === -1) {
        // Coming from another column — insert before the hovered card
        const insertAt = overIndex !== -1 ? overIndex : finalItems.length;
        finalItems = [...finalItems];
        finalItems.splice(insertAt, 0, {
          ...movedIssue,
          status: destStatus,
        });
      }

      const targetIndex = finalItems.findIndex((i) => i.id === active.id);
      const newOrder = computeOrder(finalItems, targetIndex, String(active.id));

      void persist(String(active.id), destStatus, newOrder);
    },
    [issues, columns, persist],
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
        <AlertCircleIcon className="mb-2 size-8 text-rose-600 dark:text-rose-400" />
        <h3 className="text-sm font-semibold">Failed to load issues</h3>
        <p className="mt-1 max-w-sm text-xs text-rose-700 dark:text-rose-400">
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred."}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 border-rose-300 bg-white hover:bg-rose-100 dark:border-rose-800 dark:bg-slate-900"
        >
          <RefreshCwIcon className="mr-1.5 size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.status}
              status={col.status}
              label={col.label}
              headerClass={col.headerClass}
              issues={
                isLoading
                  ? []
                  : (columns.get(col.status) ?? [])
              }
              onCardClick={setSelectedForDetail}
              onCreateClick={setCreateForStatus}
            />
          ))}
        </div>

        {/* Drag overlay — renders a floating copy of the dragged card */}
        <DragOverlay>
          {activeIssue ? (
            <div className="rotate-1 shadow-xl">
              <BoardIssueCard
                issue={activeIssue}
                onClick={() => undefined}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Issue detail dialog */}
      <IssueDetailDialog
        issue={selectedForDetail}
        open={Boolean(selectedForDetail)}
        onOpenChange={(open) => {
          if (!open) setSelectedForDetail(null);
        }}
      />

      {/* Create issue dialog — pre-fills the clicked column's status */}
      {createForStatus && (
        <CreateIssueDialog
          projectId={projectId}
          workspaceId={workspaceId}
          open={Boolean(createForStatus)}
          onOpenChange={(open) => {
            if (!open) setCreateForStatus(null);
          }}
          defaultStatus={createForStatus}
        />
      )}
    </>
  );
}
