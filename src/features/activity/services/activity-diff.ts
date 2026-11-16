import type { ActivityDraft } from "../types";

/**
 * The issue values needed to decide what changed. Keeping this shape
 * small makes the diff function easy to test without a database.
 */
export interface IssueActivitySnapshot {
  status: string;
  priority: string;
  assigneeId: string | null;
  assigneeName: string | null;
}

/**
 * The new values sent by the user. `undefined` means "not part of this
 * update", while `null` means "explicitly cleared".
 */
export interface IssueActivityChange {
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  assigneeName?: string | null;
}

/**
 * Compares an issue before and after an update and returns one event
 * for each tracked field that actually changed. Unchanged fields and
 * fields not included in the update produce no event.
 */
export function buildIssueChangeEvents(
  before: IssueActivitySnapshot,
  after: IssueActivityChange,
): ActivityDraft[] {
  const events: ActivityDraft[] = [];

  if (after.status !== undefined && after.status !== before.status) {
    events.push({
      type: "status_changed",
      payload: { from: before.status, to: after.status },
    });
  }

  if (after.priority !== undefined && after.priority !== before.priority) {
    events.push({
      type: "priority_changed",
      payload: { from: before.priority, to: after.priority },
    });
  }

  if (
    after.assigneeId !== undefined &&
    after.assigneeId !== before.assigneeId
  ) {
    events.push({
      type: "assignee_changed",
      // Names are stored as a snapshot so the feed can show them later
      // without extra joins, even if the member is renamed.
      payload: {
        from: before.assigneeName,
        to: after.assigneeName ?? null,
      },
    });
  }

  return events;
}
