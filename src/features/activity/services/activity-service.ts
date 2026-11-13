import { db } from "@/db/drizzle/connection";
import {
  activityTable,
  issueTable,
  projectTable,
  userTable,
} from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import { activityPayloadSchema, activityTypeSchema } from "../schemas";
import type {
  ActivityDraft,
  ActivityPayload,
  ActivityType,
  ActivityWithActor,
  GetIssueActivitiesInput,
} from "../types";

// The feed shows the latest 100 events. Older rows stay in the table.
// ponytail: add pagination when an issue regularly has more than 100 events.
const MAX_ACTIVITY_ITEMS = 100;

// Both `db` and a transaction object can insert rows. This narrow type
// lets callers pass either one without exposing the full Drizzle type.
type ActivityWriter = Pick<typeof db, "insert">;

/**
 * Turns the stored JSON text back into a typed payload. Bad JSON or an
 * unexpected shape becomes an empty object so one corrupt row cannot
 * break the whole activity feed.
 */
export function parseActivityPayload(raw: string): ActivityPayload {
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = activityPayloadSchema.safeParse(parsed);
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}

/**
 * Parses a database text value into a known event name. Unknown values
 * return null and are skipped by the feed.
 */
function parseActivityType(raw: string): ActivityType | null {
  const result = activityTypeSchema.safeParse(raw);
  return result.success ? result.data : null;
}

/**
 * Inserts one or more activity rows. Callers pass the current database
 * transaction so the change and its history commit together.
 */
export async function recordActivities(
  writer: ActivityWriter,
  issueId: string,
  actorId: string,
  drafts: ActivityDraft[],
): Promise<void> {
  if (drafts.length === 0) {
    return;
  }

  await writer.insert(activityTable).values(
    drafts.map((draft) => ({
      issueId,
      actorId,
      type: draft.type,
      payload: JSON.stringify(draft.payload),
    })),
  );
}

export class ActivityService {
  /**
   * Checks that the issue exists and that the caller belongs to the
   * workspace that owns it.
   */
  private async requireIssueAccess(
    userId: string,
    issueId: string,
  ): Promise<void> {
    const [issue] = await db
      .select({ workspaceId: projectTable.workspaceId })
      .from(issueTable)
      .innerJoin(projectTable, eq(issueTable.projectId, projectTable.id))
      .where(eq(issueTable.id, issueId))
      .limit(1);

    if (!issue) {
      throw new ORPCError("NOT_FOUND", { message: "Issue not found" });
    }

    await requireWorkspaceRole(userId, issue.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);
  }

  /**
   * Returns the newest activity events for one issue, joined with the
   * actor's name and avatar so the UI can render them directly.
   */
  async getIssueActivities(
    userId: string,
    input: GetIssueActivitiesInput,
  ): Promise<ActivityWithActor[]> {
    await this.requireIssueAccess(userId, input.issueId);

    const rows = await db
      .select({
        id: activityTable.id,
        issueId: activityTable.issueId,
        actorId: activityTable.actorId,
        actorName: userTable.name,
        actorEmail: userTable.email,
        actorImage: userTable.image,
        type: activityTable.type,
        payload: activityTable.payload,
        createdAt: activityTable.createdAt,
      })
      .from(activityTable)
      .innerJoin(userTable, eq(activityTable.actorId, userTable.id))
      .where(eq(activityTable.issueId, input.issueId))
      .orderBy(desc(activityTable.createdAt))
      .limit(MAX_ACTIVITY_ITEMS);

    const activities: ActivityWithActor[] = [];

    for (const row of rows) {
      const type = parseActivityType(row.type);
      if (!type) {
        continue;
      }

      activities.push({
        ...row,
        type,
        payload: parseActivityPayload(row.payload),
      });
    }

    return activities;
  }
}

export const activityService = new ActivityService();
