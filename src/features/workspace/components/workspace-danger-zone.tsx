// Danger zone: owner-only workspace deletion with confirmation.
// The server still enforces ownership regardless of UI visibility.
"use client";

// Confirm dialog shell.
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// Typed oRPC client + TanStack cache invalidation utilities.
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
// Mutation hook for the delete call.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Warn triangle + spinner icons.
import { Loader2, TriangleAlertIcon } from "lucide-react";
// Redirect to onboarding after the workspace is gone.
import { useRouter } from "next/navigation";
// Toast feedback.
import { toast } from "sonner";

export type WorkspaceDangerZoneProps = {
  // Workspace being deleted (also scopes cache invalidation).
  workspaceId: string;
};

export function WorkspaceDangerZone({ workspaceId }: WorkspaceDangerZoneProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Deletes the workspace; cascades + logo cleanup happen server-side.
  const deleteWorkspaceMutation = useMutation({
    mutationFn: () => orpcClient.workspace.deleteWorkspace({ workspaceId }),
    onSuccess: () => {
      toast.success("Workspace deleted");
      // Workspace list/user session data may now be empty.
      queryClient.invalidateQueries({
        queryKey: orpcTanstackQueryUtils.workspace.listWorkspaces
          .queryOptions({ input: {} })
          .queryKey.slice(0, 2),
      });
      // No workspace left (you were the owner) → onboarding.
      router.push("/onboarding");
    },
    onError: (error) => {
      // Owner-only and other failures surface here.
      toast.error(
        error instanceof Error ? error.message : "Failed to delete workspace",
      );
    },
  });

  return (
    // A visually separate destructive section.
    <div className="border-destructive/30 bg-destructive/5 rounded-md border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm">
          <p className="text-destructive flex items-center gap-2 font-medium">
            <TriangleAlertIcon className="size-4" />
            Delete workspace
          </p>
          <p className="text-muted-foreground mt-1">
            Permanently removes the workspace, its members, and pending
            invitations. This cannot be undone.
          </p>
        </div>
        {/* Confirm dialog around the destructive action. */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="shrink-0"
            >
              Delete workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete this workspace?</DialogTitle>
              <DialogDescription>
                All members lose access immediately. Members and pending
                invitations are removed and cannot be recovered.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              {/* Dismiss without doing anything. */}
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              {/* Fires the oRPC delete inside the same mutation logic
                  (toast + redirect handled on success). */}
              <Button
                type="button"
                variant="destructive"
                disabled={deleteWorkspaceMutation.isPending}
                onClick={() => deleteWorkspaceMutation.mutate()}
              >
                {deleteWorkspaceMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {deleteWorkspaceMutation.isPending
                  ? "Deleting..."
                  : "Delete forever"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
