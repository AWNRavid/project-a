import type { notificationTable } from "@/db/drizzle/schema";
import type { z } from "zod";
import type {
  listNotificationsSchema,
  markNotificationReadSchema,
  notificationPayloadSchema,
  notificationTypeSchema,
} from "./schemas";

/** Raw database row shape for one notification. */
export type Notification = typeof notificationTable.$inferSelect;

/** Event names such as "issue_assigned". */
export type NotificationType = z.infer<typeof notificationTypeSchema>;

/** Decoded JSON payload attached to an event. */
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;

/** One event waiting to be inserted by a service. */
export interface NotificationDraft {
  type: NotificationType;
  payload: NotificationPayload;
}

/** Notification plus actor and issue details for the inbox UI. */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  payload: NotificationPayload;
  readAt: Date | null;
  createdAt: Date;
  actorId: string;
  actorName: string | null;
  actorImage: string | null;
  issueId: string;
  issueNumber: number;
  issueTitle: string;
  projectId: string;
  projectKey: string;
}

export interface NotificationList {
  notifications: NotificationItem[];
  unreadCount: number;
}

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
export type MarkNotificationReadInput = z.infer<
  typeof markNotificationReadSchema
>;
