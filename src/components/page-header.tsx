import * as React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Real navigation, not a label: links back through the hierarchy. */
  breadcrumb?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Every working screen opens the same way: where you are, what this is,
 * and what you can do about it, closed by an engraved rule.
 */
export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("px-6 pt-5 pb-4", className)}>
      {breadcrumb ? (
        <div className="mb-3 flex items-center gap-2 text-[11px]">
          {breadcrumb}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] leading-tight font-semibold tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground mt-1 max-w-prose text-[13px]">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>

      <div className="chart-rule mt-4" />
    </header>
  );
}
