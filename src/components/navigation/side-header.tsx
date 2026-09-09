"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export function SideHeader() {
  const { state, isMobile, setOpenMobile } = useSidebar();

  const { data, isLoading } = useQuery(
    orpcTanstackQueryUtils.workspace.listWorkspaces.queryOptions({
      input: {},
    }),
  );

  // The active workspace is the first membership, oldest first, until a
  // workspace switcher exists.
  const activeWorkspace = data?.workspaces[0];

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isCollapsed = state === "collapsed";

  return (
    <SidebarHeader>
      <Link
        href="/dashboard/settings"
        onClick={handleLinkClick}
        title={activeWorkspace ? `${activeWorkspace.name} settings` : undefined}
        className={`flex items-center px-2 py-1 group-data-[collapsible=icon]:px-0 ${
          isCollapsed ? "justify-center" : ""
        }`}
      >
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
