import {
  CheckCircle2Icon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
  XCircleIcon,
} from "lucide-react";
import type { IssueStatus } from "../types";

interface IssueStatusBadgeProps {
  status: IssueStatus | string;
  className?: string;
}

/**
 * Status reads as a chart annotation: a shape for the class, a word for the
 * meaning, and the sector colour for the scan. Shape carries it without colour.
 */
const statusConfig: Record<
  IssueStatus,
  {
    label: string;
    icon: typeof CircleIcon;
    tone: string;
  }
> = {
  backlog: {
    label: "Backlog",
    icon: CircleDashedIcon,
    tone: "border-status-backlog/35 bg-status-backlog/8 text-status-backlog",
  },
  todo: {
    label: "Todo",
    icon: CircleIcon,
    tone: "border-status-todo/35 bg-status-todo/8 text-status-todo",
  },
  in_progress: {
    label: "In progress",
    icon: CircleDotIcon,
    tone: "border-status-progress/35 bg-status-progress/8 text-status-progress",
  },
  done: {
    label: "Done",
    icon: CheckCircle2Icon,
    tone: "border-status-done/35 bg-status-done/8 text-status-done",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircleIcon,
    tone: "border-status-cancelled/35 bg-status-cancelled/8 text-status-cancelled",
  },
};

export function IssueStatusBadge({
  status,
  className,
}: IssueStatusBadgeProps) {
  const config =
    status in statusConfig
      ? statusConfig[status as IssueStatus]
      : {
          label: status,
          icon: CircleIcon,
          tone: "border-border text-muted-foreground",
        };

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-1.5 py-0.5 text-[11px] leading-none font-medium tracking-wide whitespace-nowrap ${config.tone} ${className ?? ""}`}
    >
      <IconComponent className="size-3" aria-hidden />
      <span>{config.label}</span>
    </span>
  );
}

/** The bare token for a status, used for rails and borders. */
export const statusTone: Record<IssueStatus, string> = {
  backlog: "text-status-backlog",
  todo: "text-status-todo",
  in_progress: "text-status-progress",
  done: "text-status-done",
  cancelled: "text-status-cancelled",
};
