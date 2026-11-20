import { db } from "@/db/drizzle/connection";
import {
  issueTable,
  notificationTable,
  projectTable,
  userTable,
} from "@/db/drizzle/schema";
import { and, desc, eq, isNotNull, isNull, lt, sql } from "drizzle-orm";
import {
  notificationPayloadSchema,
  notificationTypeSchema,
} from "../schemas";
import type {
  ListNotificationsInput,
  MarkNotificationReadInput,
  NotificationDraft,
  NotificationItem,
  NotificationList,
  NotificationPayload,
  NotificationType,
} from "../types";

// Both `db` and a transaction object can read and insert rows. This
// narrow type keeps callers free of the full Drizzle transaction type.
type NotificationWriter = Pick<typeof db, "insert" | "select">;

const DEFAULT_LIMIT = 20;

// Read notifications are pruned after this many days. Unread ones stay
// until the user reads them. Run the purge from an external scheduler:
// `pnpm notifications:purge`.
const READ_RETENTION_DAYS = 90;

function parseNotificationType(raw: string): NotificationType | null {
  const result = notificationTypeSchema.safeParse(raw);
  return result.success ? result.data : null;
}

function parseNotificationPayload(raw: string): NotificationPayload {
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = notificationPayloadSchema.safeParse(parsed);
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}

/**
 * Inserts one notification per draft for the issue's creator and
 * assignee, skipping the actor and duplicates. Callers pass the current
 * transaction so the change and its notifications commit together.
 */
export async function recordIssueNotifications(
  writer: NotificationWriter,
  issueId: string,
  actorId: string,
  drafts: NotificationDraft[],
): Promise<void> {
  if (drafts.length === 0) {
    return;
  }

  const [issue] = await writer
    .select({
      createdById: issueTable.createdById,
      assigneeId: issueTable.assigneeId,
    })
    .from(issueTable)
    .where(eq(issueTable.id, issueId))
    .limit(1);

  if (!issue) {
    return;
  }

  const recipientIds = Array.from(
    new Set(
      [issue.createdById, issue.assigneeId].filter(
        (id): id is string => id !== null && id !== actorId,
      ),
    ),
  );

  if (recipientIds.length === 0) {
    return;
  }

  await writer.insert(notificationTable).values(
    recipientIds.flatMap((userId) =>
      drafts.map((draft) => ({
        userId,
        actorId,
        issueId,
        type: draft.type,
        payload: JSON.stringify(draft.payload),
      })),
    ),
  );
}

export class NotificationService {
  /**
   * Returns the newest notifications for the current user plus a badge
   * count. Both queries are scoped to the caller; no workspace check is
   * needed because notifications are addressed to one user.
   */
  async listNotifications(
    userId: string,
    input: ListNotificationsInput,
  ): Promise<NotificationList> {
    const rows = await db
      .select({
        id: notificationTable.id,
        type: notificationTable.type,
        payload: notificationTable.payload,
        readAt: notificationTable.readAt,
        createdAt: notificationTable.createdAt,
        actorId: notificationTable.actorId,
        actorName: userTable.name,
        actorImage: userTable.image,
        issueId: notificationTable.issueId,
        issueNumber: issueTable.number,
        issueTitle: issueTable.title,
        projectId: projectTable.id,
        projectKey: projectTable.key,
      })
      .from(notificationTable)
      .innerJoin(userTable, eq(notificationTable.actorId, userTable.id))
      .innerJoin(issueTable, eq(notificationTable.issueId, issueTable.id))
      .innerJoin(projectTable, eq(issueTable.projectId, projectTable.id))
      .where(eq(notificationTable.userId, userId))
      .orderBy(desc(notificationTable.createdAt))
      .limit(input.limit ?? DEFAULT_LIMIT);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationTable)
      .where(
        and(
          eq(notificationTable.userId, userId),
          isNull(notificationTable.readAt),
        ),
      );

    const notifications: NotificationItem[] = [];

    for (const row of rows) {
      const type = parseNotificationType(row.type);
      if (!type) {
        continue;
      }

      notifications.push({
        ...row,
        type,
        payload: parseNotificationPayload(row.payload),
      });
    }

    return {
      notifications,
      unreadCount: Number(countRow?.count ?? 0),
    };
  }

  /**
   * Marks one notification read. The user filter makes another user's
   * notification ID a silent no-op instead of a read they do not own.
   */
  async markRead(
    userId: string,
    input: MarkNotificationReadInput,
  ): Promise<{ success: boolean }> {
    await db
      .update(notificationTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationTable.id, input.notificationId),
          eq(notificationTable.userId, userId),
          isNull(notificationTable.readAt),
        ),
      );

    return { success: true };
  }

  /** Marks every unread notification of the current user as read. */
  async markAllRead(userId: string): Promise<{ success: boolean }> {
    await db
      .update(notificationTable)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationTable.userId, userId),
          isNull(notificationTable.readAt),
        ),
      );

    return { success: true };
  }

  /**
   * Deletes read notifications older than the retention window.
   * Called by the purge script; safe to run repeatedly.
   */
  async purgeReadNotifications(): Promise<{ deleted: number }> {
    const cutoff = new Date(
      Date.now() - READ_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    const deleted = await db
      .delete(notificationTable)
      .where(
        and(
          isNotNull(notificationTable.readAt),
          lt(notificationTable.readAt, cutoff),
        ),
      )
      .returning({ id: notificationTable.id });

    return { deleted: deleted.length };
  }
}

export const notificationService = new NotificationService();
