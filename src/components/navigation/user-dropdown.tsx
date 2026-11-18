"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDownIcon, Loader2, LogOutIcon } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";

function initials(name: string | undefined) {
  if (!name) return "—";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserDropdown() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: session } = authClient.useSession();

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Clear all TanStack Query cache on logout
            queryClient.clear();
            router.push("/");
          },
        },
      });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-[3px] py-1 pr-1.5 pl-1 text-sm font-medium outline-none focus-visible:ring-1">
        <span className="border-border bg-muted font-mono flex size-7 items-center justify-center rounded-[2px] border text-[11px] tracking-wider">
          {initials(session?.user?.name)}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">
          {session?.user?.name || "Signed out"}
        </span>
        <ChevronDownIcon className="text-muted-foreground size-3.5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
          {session?.user?.email ?? "No session"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={(e) => {
            e.preventDefault();
            signOutMutation.mutate();
          }}
          disabled={signOutMutation.isPending}
        >
          {signOutMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOutIcon className="mr-2 h-4 w-4" />
          )}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
