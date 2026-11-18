"use client";

import { Button } from "@/components/ui/button";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
} from "@dnd-kit/react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { IssueDetail, IssueStatus } from "../types";
import { BoardColumn } from "./board-column";
import { BoardIssueCard } from "./board-issue-card";
import { CreateIssueDialog } from "./create-issue-dialog";
import { IssueDetailDialog } from "./issue-detail-dialog";

const COLUMNS: { status: IssueStatus; label: string; tone: string }[] = [
  {
    status: "backlog",
    label: "Backlog",
    tone: "var(--status-backlog)",
  },
  {
    status: "todo",
    label: "Todo",
    tone: "var(--status-todo)",
  },
  {
    status: "in_progress",
    label: "In progress",
    tone: "var(--status-progress)",
  },
  {
    status: "done",
    label: "Done",
    tone: "var(--status-done)",
  },
];

/**
 * Issue ids keyed by status. Drives both rendering and the `move` helper.
 */
type Board = Record<IssueStatus, string[]>;

/** Every status key, including ones without a visible lane. */
function createBoard(): Board {
  return {
    backlog: [],
    todo: [],
    in_progress: [],
    done: [],
    cancelled: [],
  };
}

/** Groups issues into their status lanes, sorted by order then number. */
function boardFromIssues(issues: IssueDetail[]): Board {
  const board = createBoard();
  const sorted = [...issues].sort((a, b) =>
    a.order < b.order ? -1 : a.order > b.order ? 1 : a.number - b.number,
  );
  for (const issue of sorted) {
    const column = COLUMNS.find((c) => c.status === issue.status);
    if (column) board[column.status].push(issue.id);
  }
  return board;
}

/** Resolves board ids back to issue records, skipping ones no longer loaded. */
function resolveIssues(
  ids: string[],
  issuesById: Map<string, IssueDetail>,
): IssueDetail[] {
  const result: IssueDetail[] = [];
  for (const id of ids) {
    const issue = issuesById.get(id);
    if (issue) result.push(issue);
  }
  return result;
}

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
  if (!after)
    return midpoint(before.order, "~".repeat(before.order.length + 2));
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

  const [selectedForDetail, setSelectedForDetail] =
    useState<IssueDetail | null>(null);
  const [createForStatus, setCreateForStatus] = useState<IssueStatus | null>(
    null,
  );

  /**
   * Lane contents while a drag is in progress, so a refetch can't yank cards
   * out from under the pointer. `null` means "derive from server data".
   */
  const [dragBoard, setDragBoard] = useState<Board | null>(null);

  const boardFromData = useMemo(() => boardFromIssues(issues), [issues]);
  const issuesById = useMemo(
    () => new Map(issues.map((issue) => [issue.id, issue])),
    [issues],
  );

  const board = dragBoard ?? boardFromData;

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
          ? old.map((i) => (i.id === issueId ? { ...i, status, order } : i))
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

  const handleDragStart = useCallback(() => {
    setDragBoard(boardFromData);
  }, [boardFromData]);

  /** Treat the drag as a live edit of the lanes, not of server state. */
  const handleDragOver = useCallback((event: DragOverEvent) => {
    setDragBoard((current) => (current ? move(current, event) : current));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const current = dragBoard;
      if (!current) return;

      const { source } = event.operation;

      if (event.canceled || !source) {
        setDragBoard(null);
        return;
      }

      // Applies the final drop (no-op if `onDragOver` already moved it).
      const next = move(current, event);
      const movedId = String(source.id);
      const destStatus = COLUMNS.find((c) =>
        next[c.status].includes(movedId),
      )?.status;

      if (!destStatus) {
        setDragBoard(null);
        return;
      }

      const destIssues = resolveIssues(next[destStatus], issuesById);
      const newOrder = computeOrder(
        destIssues,
        next[destStatus].indexOf(movedId),
        movedId,
      );

      // Persist first so the re-render already sees the new cache state.
      void persist(movedId, destStatus, newOrder);
      setDragBoard(null);
    },
    [dragBoard, issuesById, persist],
  );

  if (error) {
    return (
      <div className="border-destructive/40 bg-destructive/8 flex flex-col items-start gap-3 rounded-[3px] border p-6">
        <AlertCircleIcon className="text-destructive size-5" />
        <div>
          <h3 className="text-[14px] font-semibold">Issues did not load</h3>
          <p className="text-muted-foreground mt-1 max-w-prose text-[12px]">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCwIcon className="mr-1.5 size-3.5" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <>
      <DragDropProvider
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* The chart table: sectors sit on the graticule, not on flat ink. */}
        <div className="relative">
          <div
            className="graticule pointer-events-none absolute inset-0 opacity-40"
            aria-hidden
          />
          <div className="relative flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <BoardColumn
                key={col.status}
                status={col.status}
                label={col.label}
                tone={col.tone}
                isLoading={isLoading}
                issues={
                  isLoading ? [] : resolveIssues(board[col.status], issuesById)
                }
                onCardClick={setSelectedForDetail}
                onCreateClick={setCreateForStatus}
              />
            ))}
          </div>
        </div>

        {/* Drag overlay — renders a floating copy of the dragged card */}
        <DragOverlay>
          {(source) => {
            const id = String(source.id);
            const issue = issuesById.get(id);
            const column = COLUMNS.find((c) => board[c.status].includes(id));

            if (!issue || !column) return null;

            return (
              <div className="rotate-1 shadow-xl">
                <BoardIssueCard
                  issue={issue}
                  index={board[column.status].indexOf(id)}
                  group={column.status}
                  onClick={() => undefined}
                />
              </div>
            );
          }}
        </DragOverlay>
      </DragDropProvider>

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
