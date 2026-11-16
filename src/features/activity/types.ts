import type { activityTable } from "@/db/drizzle/schema";
import type { z } from "zod";
import type {
  activityPayloadSchema,
  activityTypeSchema,
  getIssueActivitiesSchema,
} from "./schemas";

/** Raw database row shape for one activity event. */
export type Activity = typeof activityTable.$inferSelect;

/** Event names such as "status_changed". */
export type ActivityType = z.infer<typeof activityTypeSchema>;

/** Decoded JSON payload attached to an event. */
export type ActivityPayload = z.infer<typeof activityPayloadSchema>;

/** One event waiting to be inserted by a service. */
export interface ActivityDraft {
  type: ActivityType;
  payload: ActivityPayload;
}

/** Activity data plus actor details for display in the UI. */
export interface ActivityWithActor {
  id: string;
  issueId: string;
  actorId: string;
  actorName: string | null;
  actorEmail: string | null;
  actorImage: string | null;
  type: ActivityType;
  payload: ActivityPayload;
  createdAt: Date;
}

export type GetIssueActivitiesInput = z.infer<typeof getIssueActivitiesSchema>;
