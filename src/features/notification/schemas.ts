import { z } from "zod";

/**
 * Events that create an in-app notification. The database stores the
 * value as plain text; this schema is the source of truth for code.
 */
export const notificationTypeSchema = z.enum([
  "issue_assigned",
  "status_changed",
  "priority_changed",
  "comment_added",
  "attachment_added",
]);

/**
 * Fields that may appear inside `notification.payload`. Unknown fields
 * are stripped when the JSON is parsed.
 */
export const notificationPayloadSchema = z.object({
  from: z.string().nullish(),
  to: z.string().nullish(),
  filename: z.string().optional(),
});

/**
 * Input for loading the current user's inbox. Defaults to the newest 20.
 */
export const listNotificationsSchema = z.object({
  limit: z.number().int().min(1).max(50).optional(),
});

export const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid("Invalid notification ID"),
});
