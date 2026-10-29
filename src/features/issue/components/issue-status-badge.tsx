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

const statusConfig: Record<
  IssueStatus,
  {
    label: string;
    icon: typeof CircleIcon;
    badgeClass: string;
    iconClass: string;
  }
> = {
  backlog: {
    label: "Backlog",
    icon: CircleDashedIcon,
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    iconClass: "text-slate-500",
  },
  todo: {
    label: "Todo",
    icon: CircleIcon,
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    iconClass: "text-blue-500",
  },
  in_progress: {
    label: "In Progress",
    icon: CircleDotIcon,
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    iconClass: "text-amber-500",
  },
  done: {
    label: "Done",
    icon: CheckCircle2Icon,
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    iconClass: "text-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircleIcon,
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
    iconClass: "text-rose-500",
  },
};

/**
 * Standard visual indicator badge for issue statuses.
 */
export function IssueStatusBadge({ status, className }: IssueStatusBadgeProps) {
  const config =
    status in statusConfig
      ? statusConfig[status as IssueStatus]
      : {
          label: status,
          icon: CircleIcon,
          badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
          iconClass: "text-slate-500",
        };

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${config.badgeClass} ${className ?? ""}`}
    >
      <IconComponent className={`size-3.5 ${config.iconClass}`} />
      <span>{config.label}</span>
    </span>
  );
}
