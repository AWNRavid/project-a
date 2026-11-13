import { z } from "zod";

/**
 * Every event name the activity log understands. The database stores
 * the value as plain text; this schema is the source of truth for code.
 */
export const activityTypeSchema = z.enum([
  "issue_created",
  "status_changed",
  "priority_changed",
  "assignee_changed",
  "label_added",
  "label_removed",
  "comment_added",
  "attachment_added",
]);

/**
 * Fields that may appear inside `activity.payload`. Not every event
 * uses every field. Unknown fields are stripped when the JSON is parsed.
 */
export const activityPayloadSchema = z.object({
  from: z.string().nullish(),
  to: z.string().nullish(),
  title: z.string().optional(),
  filename: z.string().optional(),
  labelName: z.string().optional(),
});

/**
 * Input for loading one issue's activity feed.
 */
export const getIssueActivitiesSchema = z.object({
  issueId: z.string().uuid("Invalid issue ID"),
});
