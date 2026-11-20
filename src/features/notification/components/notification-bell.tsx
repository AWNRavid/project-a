"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";
import type { NotificationItem } from "../types";

// Notifications are polled; there is no websocket/Redis pubsub in the
// stack yet.
// ponytail: raise or replace with SSE when sub-minute latency matters.
const POLL_INTERVAL_MS = 30_000;

function humanizeValue(value: string | null | undefined): string {
  if (!value) {
    return "Unassigned";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Builds the sentence shown after the actor's name, e.g.
// "changed status to Done".
function describeNotification(item: NotificationItem): string {
  const { payload } = item;

  switch (item.type) {
    case "issue_assigned":
      return `assigned ${payload.to ?? "someone"}`;
    case "status_changed":
      return `changed status to ${humanizeValue(payload.to)}`;
    case "priority_changed":
      return `changed priority to ${humanizeValue(payload.to)}`;
    case "comment_added":
      return "commented";
    case "attachment_added":
      return payload.filename
        ? `attached ${payload.filename}`
        : "added an attachment";
  }
}

function formatNotificationDate(date: Date): string {
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
 * Navbar inbox: unread badge, latest notifications, mark-all-read.
 * Clicking an item marks it read and opens its issue.
 */
export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const notificationsQueryOptions =
    orpcTanstackQueryUtils.notification.listNotifications.queryOptions({
      input: {},
    });

  const { data, isLoading } = useQuery({
    ...notificationsQueryOptions,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) =>
      orpcClient.notification.markNotificationRead({ notificationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationsQueryOptions.queryKey,
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () =>
      orpcClient.notification.markAllNotificationsRead({}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationsQueryOptions.queryKey,
      });
    },
  });

  const openNotification = (item: NotificationItem) => {
    if (!item.readAt) {
      markReadMutation.mutate(item.id);
    }
    router.push(
      `/dashboard/project/${item.projectId}?issue=${item.issueId}`,
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8"
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} unread)`
              : "Notifications"
          }
        >
          <BellIcon className="size-4" />
          {unreadCount > 0 ? (
            <span className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
            Notifications
          </span>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Mark all read
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="my-0" />

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-xs">
              Loading notifications...
            </p>
          ) : notifications.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-xs italic">
              Nothing yet. Assignments, comments, and updates land here.
            </p>
          ) : (
            notifications.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className="items-start gap-2 px-3 py-2"
                onSelect={() => openNotification(item)}
              >
                <span
                  className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                    item.readAt ? "bg-transparent" : "bg-primary"
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] leading-snug">
                    <span className="font-semibold">
                      {item.actorName ?? "Member"}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {describeNotification(item)}
                    </span>
                  </span>
                  <span className="text-muted-foreground mt-0.5 block truncate font-mono text-[10px]">
                    {item.projectKey}-{item.issueNumber} · {item.issueTitle}
                  </span>
                  <span className="text-muted-foreground/80 block text-[10px]">
                    {formatNotificationDate(item.createdAt)}
                  </span>
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
