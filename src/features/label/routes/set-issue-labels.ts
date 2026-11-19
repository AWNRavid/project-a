import { db } from "@/db/drizzle/connection";
import {
  issueLabelTable,
  issueTable,
  labelTable,
  projectTable,
} from "@/db/drizzle/schema";
import { recordActivities } from "@/features/activity/services/activity-service";
import type { ActivityDraft } from "@/features/activity/types";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { setIssueLabelsSchema } from "../schemas";
import { diffIssueLabels } from "../services/label-diff";
import type { IssueLabelSummary } from "../types";

/**
 * Replaces an issue's labels with the requested set and records one
 * activity row per added/removed label. Labels and issue must belong
 * to the same workspace.
 */
export const setIssueLabels = authProcedure
  .input(setIssueLabelsSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);

    const [issue] = await db
      .select({
        id: issueTable.id,
        workspaceId: projectTable.workspaceId,
      })
      .from(issueTable)
      .innerJoin(projectTable, eq(issueTable.projectId, projectTable.id))
      .where(eq(issueTable.id, input.issueId))
      .limit(1);

    if (!issue) {
      throw new ORPCError("NOT_FOUND", { message: "Issue not found" });
    }

    await requireWorkspaceRole(user.id, issue.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    // De-duplicate the request: attaching the same label twice is a
    // no-op, not an error.
    const requestedIds = [...new Set(input.labelIds)];

    const currentLabels = await db
      .select({ id: labelTable.id, name: labelTable.name })
      .from(issueLabelTable)
      .innerJoin(labelTable, eq(issueLabelTable.labelId, labelTable.id))
      .where(eq(issueLabelTable.issueId, input.issueId));

    const requestedLabels: IssueLabelSummary[] =
      requestedIds.length === 0
        ? []
        : await db
            .select({
              id: labelTable.id,
              name: labelTable.name,
              color: labelTable.color,
            })
            .from(labelTable)
            .where(
              and(
                eq(labelTable.workspaceId, issue.workspaceId),
                inArray(labelTable.id, requestedIds),
              ),
            )
            .orderBy(asc(labelTable.name));

    // Every requested label must exist in this workspace; otherwise a
    // caller could attach another workspace's label.
    if (requestedLabels.length !== requestedIds.length) {
      throw new ORPCError("BAD_REQUEST", {
        message: "One or more labels do not belong to this workspace",
      });
    }

    const { added, removed } = diffIssueLabels(currentLabels, requestedLabels);

    if (added.length === 0 && removed.length === 0) {
      return { labels: requestedLabels };
    }

    const events: ActivityDraft[] = [
      ...added.map((label) => ({
        type: "label_added" as const,
        payload: { labelName: label.name },
      })),
      ...removed.map((label) => ({
        type: "label_removed" as const,
        payload: { labelName: label.name },
      })),
    ];

    await db.transaction(async (tx) => {
      await tx
        .delete(issueLabelTable)
        .where(eq(issueLabelTable.issueId, input.issueId));

      if (requestedIds.length > 0) {
        await tx.insert(issueLabelTable).values(
          requestedIds.map((labelId) => ({
            issueId: input.issueId,
            labelId,
          })),
        );
      }

      await recordActivities(tx, input.issueId, user.id, events);
    });

    // Return full label rows so the picker can update without a refetch.
    return { labels: requestedLabels };
  });
