// Members tab: renders every member of the workspace with role
// management controls (owner/admin), self Leave, and owner transfer.
"use client";

// Avatar for user image / initial fallback.
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Buttons (row actions + destructive confirm in the dialogs).
import { Button } from "@/components/ui/button";
// Dialog used as the confirm prompt for destructive actions.
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Role dropdown shell + its option list.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Row placeholder while the list loads.
import { Skeleton } from "@/components/ui/skeleton";
// Better Auth client hook: identifies the current user on rows.
import { authClient } from "@/lib/auth/client";
// Typed oRPC client + TanStack Query utils for query + cache keys.
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
// Query + mutations + invalidation for members list actions.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Icons: spinner, remove, transfer, leave.
import { Loader2, ShieldIcon, Trash2Icon, UserMinusIcon } from "lucide-react";
// Redirect when the user leaves the workspace.
import { useRouter } from "next/navigation";
// Local UI state for the confirm dialogs below.
import { useState } from "react";
// Toast feedback for every action outcome.
import { toast } from "sonner";

// Prop shape: the list belongs to a workspace.
type WorkspaceId = { workspaceId: string };

// Pending action the confirm dialog represents (null = closed).
type ConfirmAction = {
  kind: "transfer" | "leave";
  memberId: string;
  userId: string;
  name: string;
} | null;

export function MembersList({ workspaceId }: WorkspaceId) {
  // Session user id: identifies "self" rows (role dropdown hidden on
  // your own membership; Leave lives there instead).
  const { data: authSession } = authClient.useSession();
  const currentUserId = authSession?.user?.id;

  // Post-leave redirect target.
  const router = useRouter();

  // Mutations invalidate this list, so the client instance is shared.
  const queryClient = useQueryClient();

  // Invalidate every listMembers query for this workspace.
  const refreshMembers = () => {
    queryClient.invalidateQueries({
      queryKey: orpcTanstackQueryUtils.workspace.listMembers
        .queryOptions({ input: { workspaceId } })
        .queryKey.slice(0, 3),
    });
  };

  // Live member list; states branch on label/error later.
  const { data, isLoading } = useQuery(
    orpcTanstackQueryUtils.workspace.listMembers.queryOptions({
      input: { workspaceId },
    }),
  );

  // Permission flags derived from the viewer's own membership.
  const isOwner =
    currentUserId !== undefined &&
    data?.members.some(
      (member) => member.userId === currentUserId && member.role === "owner",
    ) === true;
  const isManager =
    isOwner ||
    (currentUserId !== undefined &&
      data?.members.some(
        (member) => member.userId === currentUserId && member.role === "admin",
      ) === true);

  // Applies a role change to a member row (owner/admin actors only;
  // the server re-checks authority anyway).
  const updateRoleMutation = useMutation({
    mutationFn: (input: { memberId: string; role: "member" | "admin" }) =>
      orpcClient.workspace.updateMemberRole({
        workspaceId,
        memberId: input.memberId,
        role: input.role,
      }),
    onSuccess: () => {
      toast.success("Member role updated");
      refreshMembers();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update role",
      );
    },
  });

  // Removes another member (owner/admin actors only).
  const removeMemberMutation = useMutation({
    mutationFn: (input: { memberId: string }) =>
      orpcClient.workspace.removeMember({
        workspaceId,
        memberId: input.memberId,
      }),
    onSuccess: () => {
      toast.success("Member removed");
      refreshMembers();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member",
      );
    },
  });

  // Hands the workspace to another member (owner actor only).
  const transferMutation = useMutation({
    mutationFn: (input: { toUserId: string }) =>
      orpcClient.workspace.transferOwnership({
        workspaceId,
        toUserId: input.toUserId,
      }),
    onSuccess: () => {
      toast.success("Ownership transferred");
      // Own and others' roles may have changed — refresh rows.
      refreshMembers();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to transfer ownership",
      );
    },
  });

  // Self-kick: removes your own membership (non-owner actors only).
  const leaveMutation = useMutation({
    mutationFn: () => orpcClient.workspace.leaveWorkspace({ workspaceId }),
    onSuccess: () => {
      toast.success("You left the workspace");
      refreshMembers();
      // With no workspace left, dashboard bounces to onboarding — go
      // there explicitly so the state matches.
      router.push("/onboarding");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to leave workspace",
      );
    },
  });

  // Pending destructive/irreversible action + its target member.
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  // Run whichever mutation the confirmed dialog mapped to.
  const runConfirmedAction = () => {
    if (!confirmAction) return;
    if (confirmAction.kind === "transfer") {
      transferMutation.mutate({ toUserId: confirmAction.userId });
    } else {
      leaveMutation.mutate();
    }
    // Close after dispatching.
    setConfirmAction(null);
  };

  // Skeleton rows while the list resolves.
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // Sorted list from the server (owner first, then oldest joined).
  const members = data?.members ?? [];

  return (
    <>
      {/* One row per member. */}
      <ul className="flex flex-col divide-y">
        {members.map((member) => {
          // Is this row the signed-in user?
          const isSelf = member.userId === currentUserId;
          // Managers can edit this row's role (not owners/self).
          const canEditRole = isManager && member.role !== "owner" && !isSelf;
          // Remove rights mirror role management minus self.
          const canRemove = isManager && member.role !== "owner" && !isSelf;
          // Owner offers the transfer action on any other member.
          const canTransfer = isOwner && member.role !== "owner" && !isSelf;

          return (
            <li
              key={member.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              {/* Identity block: avatar + name + email. */}
              <div className="flex min-w-0 items-center gap-3">
                {/* Avatar image or the fallback initial. */}
                <Avatar className="size-8 shrink-0">
                  {member.image ? (
                    <AvatarImage src={member.image} alt={member.name} />
                  ) : null}
                  <AvatarFallback>
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-sm">
                  {/* Name with a small (you) marker for your row. */}
                  <p className="truncate font-medium">
                    {member.name}
                    {isSelf ? " (you)" : ""}
                  </p>
                  <p className="text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>
              </div>

              {/* Role display / role editor (managers only). */}
              <div className="flex shrink-0 items-center gap-2">
                {/* Owner row: a fixed badge — immune to everything. */}
                {member.role === "owner" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    <ShieldIcon className="size-3" />
                    Owner
                  </span>
                ) : canEditRole ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => {
                      // Validate to "member"/"admin" before storing.
                      if (value === "member" || value === "admin") {
                        updateRoleMutation.mutate({
                          memberId: member.id,
                          role: value,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  // Non-managers read the plain role label.
                  <span className="text-muted-foreground text-xs">
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                )}

                {/* Transfer: promotes this member to owner (owner-only
                    action; confirmed because you lose ownership). */}
                {canTransfer && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setConfirmAction({
                        kind: "transfer",
                        memberId: member.id,
                        userId: member.userId,
                        name: member.name,
                      })
                    }
                  >
                    {/* Icon communicates "make owner". */}
                    <ShieldIcon className="size-4" />
                    Make owner
                  </Button>
                )}

                {/* Remove row action for managers on editable rows. */}
                {canRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hover:text-destructive"
                    disabled={removeMemberMutation.isPending}
                    onClick={() =>
                      removeMemberMutation.mutate({ memberId: member.id })
                    }
                  >
                    {/* Spinner while the deletion is in flight. */}
                    {removeMemberMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2Icon className="size-4" />
                    )}
                    Remove
                  </Button>
                )}

                {/* Leave: only on your own non-owner row. */}
                {isSelf && !isOwner && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hover:text-destructive"
                    onClick={() =>
                      setConfirmAction({
                        kind: "leave",
                        memberId: member.id,
                        userId: member.userId,
                        name: member.name,
                      })
                    }
                  >
                    {/* Spinner while the leave call runs. */}
                    {leaveMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserMinusIcon className="size-4" />
                    )}
                    Leave
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Confirm dialog for transfer/leave destructive-ish flows. */}
      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          // Closing (including backdrop/Esc) clears the pending state.
          if (!open) setConfirmAction(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.kind === "transfer"
                ? "Transfer ownership?"
                : "Leave this workspace?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.kind === "transfer"
                ? // Net effect spelled out so the owner isn't surprised.
                  `${confirmAction.name} will become the owner and you will become an admin.`
                : "You will lose access to this workspace and its content."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {/* Cancel returns without running anything. */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </Button>
            {/* The action button carries through to the mutation. */}
            <Button
              type="button"
              variant="destructive"
              disabled={transferMutation.isPending || leaveMutation.isPending}
              onClick={runConfirmedAction}
            >
              {(transferMutation.isPending || leaveMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {confirmAction?.kind === "transfer"
                ? "Transfer"
                : "Leave workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
