"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { HistoryIcon } from "lucide-react";
import type { ActivityWithActor } from "../types";

interface IssueActivitySectionProps {
  issueId: string;
}

// Turns "in_progress" into "In Progress" for readable sentences.
function humanizeValue(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Builds the sentence shown after the actor's name, e.g.
// "changed status from Todo to Done".
function describeActivity(activity: ActivityWithActor): string {
  const { payload } = activity;

  switch (activity.type) {
    case "issue_created":
      return "created the issue";
    case "status_changed":
      return `changed status from ${humanizeValue(payload.from)} to ${humanizeValue(payload.to)}`;
    case "priority_changed":
      return `changed priority from ${humanizeValue(payload.from)} to ${humanizeValue(payload.to)}`;
    case "assignee_changed":
      return `changed assignee from ${payload.from ?? "Unassigned"} to ${payload.to ?? "Unassigned"}`;
    case "label_added":
      return payload.labelName
        ? `added label ${payload.labelName}`
        : "added a label";
    case "label_removed":
      return payload.labelName
        ? `removed label ${payload.labelName}`
        : "removed a label";
    case "comment_added":
      return "added a comment";
    case "attachment_added":
      return payload.filename
        ? `attached ${payload.filename}`
        : "added an attachment";
  }
}

function formatActivityDate(date: Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Shows the "who changed what, when" history for one issue.
 * The query is refetched whenever the dialog opens so edits made on
 * the board or in the edit dialog appear without a manual refresh.
 */
export function IssueActivitySection({ issueId }: IssueActivitySectionProps) {
  const activityQueryOptions =
    orpcTanstackQueryUtils.activity.getIssueActivities.queryOptions({
      input: { issueId },
    });

  const { data: activities = [], isLoading } = useQuery({
    ...activityQueryOptions,
    refetchOnMount: "always",
  });

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2">
        <HistoryIcon className="text-muted-foreground size-4" />
        <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Activity ({activities.length})
        </h4>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-2 text-center text-xs">
          Loading activity...
        </p>
      ) : activities.length === 0 ? (
        <p className="text-muted-foreground text-xs italic">
          No activity recorded yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) => {
            const initials = (activity.actorName ?? activity.actorEmail ?? "U")
              .slice(0, 2)
              .toUpperCase();

            return (
              <li key={activity.id} className="flex gap-3 text-sm">
                <Avatar className="mt-0.5 size-7 shrink-0">
                  {activity.actorImage ? (
                    <AvatarImage
                      src={activity.actorImage}
                      alt={activity.actorName ?? "Avatar"}
                    />
                  ) : null}
                  <AvatarFallback className="text-[10px] font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="leading-snug">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {activity.actorName ?? activity.actorEmail ?? "Member"}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {describeActivity(activity)}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {formatActivityDate(activity.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
