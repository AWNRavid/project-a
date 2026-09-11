"use client";

// Pre-built sidebar pieces: workspace header, generated nav renderer,
// and the collapsible shell.
import { SideHeader } from "@/components/navigation/side-header";
import { SideNav, type SidebarItem } from "@/components/navigation/side-nav";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import { HomeIcon, SettingsIcon } from "lucide-react";
import * as React from "react";

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  // Top-level nav sections. A Settings entry is included because the
  // workspace name/logo editor lives under /dashboard/settings.
  const navItems: SidebarItem[] = [
    {
      label: "Dashboard",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: HomeIcon,
        },
        {
          title: "Settings",
          url: "/dashboard/settings",
          icon: SettingsIcon,
        },
      ],
    },
  ];

  // Icon-collapsible sidebar: workspace header on top, nav in the
  // middle, and a drag rail for resizing/collapsing.
  return (
    <Sidebar collapsible="icon" {...props}>
      <SideHeader />
      <SidebarContent>
        <SideNav items={navItems} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
