"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserDropdown } from "./user-dropdown";

/**
 * The chart table's top edge: where you are on the left, who you are and
 * what light you work under on the right.
 */
export function DashboardNavbar() {
  return (
    <nav className="bg-background/85 supports-[backdrop-filter]:bg-background/65 sticky top-0 z-30 border-b backdrop-blur">
      <div className="flex h-12 items-center justify-between gap-3 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-0.5" />
          <span className="text-muted-foreground hidden font-mono text-[11px] tracking-[0.18em] uppercase sm:inline">
            Trackr / Chart
          </span>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <span className="bg-border mx-1 h-5 w-px" aria-hidden />
          <UserDropdown />
        </div>
      </div>
    </nav>
  );
}
