import type { ActivityDraft } from "@/features/activity/types";
import type { NotificationDraft } from "../types";

/**
 * Turns the activity events of one issue update into notification
 * events. Unassignment produces no notification (there is nobody to
 * tell), and labels are not worth a notification.
 */
export function toIssueNotificationDrafts(
  events: ActivityDraft[],
  hasAssignee: boolean,
): NotificationDraft[] {
  const drafts: NotificationDraft[] = [];

  for (const event of events) {
    switch (event.type) {
      case "status_changed":
      case "priority_changed":
        drafts.push({ type: event.type, payload: event.payload });
        break;
      case "assignee_changed":
        if (hasAssignee) {
          drafts.push({ type: "issue_assigned", payload: event.payload });
        }
        break;
      default:
        break;
    }
  }

  return drafts;
}
