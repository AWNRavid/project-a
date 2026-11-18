import { AlertCircleIcon, MinusIcon } from "lucide-react";
import type { IssuePriority } from "../types";

interface IssuePriorityBadgeProps {
  priority: IssuePriority | string;
  className?: string;
}

/**
 * Priority is a measurement, not a colour: four ticks in ascending height.
 * Urgent replaces the ticks with a conflict mark, the way a chart marks the
 * one obstruction you must not fly into.
 */
const priorityConfig: Record<
  IssuePriority,
  {
    label: string;
    level: number;
    tone: string;
  }
> = {
  urgent: { label: "Urgent", level: 4, tone: "text-priority-urgent" },
  high: { label: "High", level: 3, tone: "text-priority-high" },
  medium: { label: "Medium", level: 2, tone: "text-priority-medium" },
  low: { label: "Low", level: 1, tone: "text-priority-low" },
  no_priority: { label: "No priority", level: 0, tone: "text-priority-none" },
};

const tickHeights = ["h-1", "h-1.5", "h-2", "h-2.5"];

export function IssuePriorityBadge({
  priority,
  className,
}: IssuePriorityBadgeProps) {
  const config =
    priority in priorityConfig
      ? priorityConfig[priority as IssuePriority]
      : {
          label: priority,
          level: 0,
          tone: "text-priority-none",
        };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] leading-none font-medium tracking-wide whitespace-nowrap ${config.tone} ${className ?? ""}`}
      title={`Priority: ${config.label}`}
    >
      {config.level === 0 ? (
        <MinusIcon className="size-3" aria-hidden />
      ) : (
        <span className="flex items-end gap-[2px]" aria-hidden>
          {tickHeights.map((height, index) => (
            <span
              key={height}
              className={`w-[2px] rounded-[1px] ${height} ${
                index < config.level ? "bg-current" : "bg-current/25"
              }`}
            />
          ))}
        </span>
      )}
      <span>{config.label}</span>
    </span>
  );
}

/** Conflict mark for urgent, reused where a single glyph is needed. */
export function PriorityConflictIcon({ className }: { className?: string }) {
  return (
    <AlertCircleIcon
      className={`text-priority-urgent size-3 ${className ?? ""}`}
      aria-hidden
    />
  );
}
