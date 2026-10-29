import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  EqualIcon,
  MinusIcon,
} from "lucide-react";
import type { IssuePriority } from "../types";

interface IssuePriorityBadgeProps {
  priority: IssuePriority | string;
  className?: string;
}

const priorityConfig: Record<
  IssuePriority,
  {
    label: string;
    icon: typeof MinusIcon;
    badgeClass: string;
    iconClass: string;
  }
> = {
  urgent: {
    label: "Urgent",
    icon: AlertCircleIcon,
    badgeClass:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    iconClass: "text-red-600",
  },
  high: {
    label: "High",
    icon: ArrowUpIcon,
    badgeClass:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    iconClass: "text-orange-600",
  },
  medium: {
    label: "Medium",
    icon: EqualIcon,
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    iconClass: "text-amber-600",
  },
  low: {
    label: "Low",
    icon: ArrowDownIcon,
    badgeClass:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    iconClass: "text-blue-600",
  },
  no_priority: {
    label: "No priority",
    icon: MinusIcon,
    badgeClass:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    iconClass: "text-slate-400",
  },
};

/**
 * Standard visual indicator badge for issue priority levels.
 */
export function IssuePriorityBadge({
  priority,
  className,
}: IssuePriorityBadgeProps) {
  const config =
    priority in priorityConfig
      ? priorityConfig[priority as IssuePriority]
      : {
          label: priority,
          icon: MinusIcon,
          badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
          iconClass: "text-slate-400",
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
