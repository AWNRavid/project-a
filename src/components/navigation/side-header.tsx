// Sidebar header: shows the active workspace's logo + name and links
// to its settings page.
"use client";

// Avatar primitives render the logo image with a letter fallback.
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarHeader, useSidebar } from "@/components/ui/sidebar";
// oRPC TanStack Query utils power the client-side workspace fetch.
import { orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export function SideHeader() {
  // Sidebar state drives the collapsed/mobile presentation below.
  const { state, isMobile, setOpenMobile } = useSidebar();

  // Client-side fetch (no SSR prefetch): the name/logo appear right
  // after hydration.
  const { data, isLoading } = useQuery(
    orpcTanstackQueryUtils.workspace.listWorkspaces.queryOptions({
      input: {},
    }),
  );

  // The active workspace is the first membership, oldest first, until a
  // workspace switcher exists.
  const activeWorkspace = data?.workspaces[0];

  // Close the mobile sheet after navigating.
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isCollapsed = state === "collapsed";

  return (
    // Clicking the header opens workspace settings (rename/logo).
    <SidebarHeader>
      <Link
        // Tooltip title only when a workspace is loaded.
        href="/dashboard/settings"
        onClick={handleLinkClick}
        title={activeWorkspace ? `${activeWorkspace.name} settings` : undefined}
        className={`flex items-center px-2 py-1 group-data-[collapsible=icon]:px-0 ${
          isCollapsed ? "justify-center" : ""
        }`}
      >
        {/* Logo image when available; the fallback shows the first
            letter of the workspace name (empty while loading). */}
        <Avatar className="size-8 shrink-0 rounded-lg">
          {activeWorkspace?.logoUrl ? (
            <AvatarImage
              src={activeWorkspace.logoUrl}
              alt={`${activeWorkspace.name} logo`}
            />
          ) : null}
          <AvatarFallback className="rounded-lg text-xs font-semibold">
            {isLoading
              ? ""
              : (activeWorkspace?.name.charAt(0).toUpperCase() ?? "")}
          </AvatarFallback>
        </Avatar>
        {/* Workspace name, hidden entirely in the collapsed sidebar
            (the avatar alone remains centered). */}
        <span
          className={`ml-2 truncate text-xl font-semibold text-gray-900 transition-opacity duration-200 ${
            isCollapsed ? "hidden opacity-0" : "opacity-100"
          }`}
        >
          {activeWorkspace?.name ?? ""}
        </span>
      </Link>
    </SidebarHeader>
  );
}
