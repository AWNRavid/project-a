// Cancels (deletes) a pending workspace invite.
import { createDrizzleConnection } from "@/db/drizzle/connection";
import { workspaceInviteTable } from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as z from "zod";

// Roles allowed to cancel invites.
const INVITE_MANAGER_ROLES = ["owner", "admin"] as const;

// The invite is addressed by its id, not email — a stale list entry
// must still be cancellable.
const cancelInviteSchema = z.object({
  inviteId: z.string().min(1, "Invite ID is required"),
});

export const cancelInvite = authProcedure
  .input(cancelInviteSchema)
  .handler(async ({ context, input }) => {
    const user = requireUser(context.user);
    const db = createDrizzleConnection();

    // Locate the invite first; we need its workspace to authorize.
    const [invite] = await db
      .select({
        id: workspaceInviteTable.id,
        workspaceId: workspaceInviteTable.workspaceId,
      })
      .from(workspaceInviteTable)
      .where(eq(workspaceInviteTable.id, input.inviteId));

    // Unknown/already-cancelled invites are NOT_FOUND.
    if (!invite) {
      throw new ORPCError("NOT_FOUND", { message: "Invite not found" });
    }

    // Guard against the invite's workspace, not the caller's guess:
    // managers of another workspace can never remove this row.
    await requireWorkspaceRole(
      user.id,
      invite.workspaceId,
      INVITE_MANAGER_ROLES,
    );

    // Delete is the cancellation; the unique (workspace, email) index
    // frees up so the person can be re-invited immediately.
    const [cancelled] = await db
      .delete(workspaceInviteTable)
      .where(eq(workspaceInviteTable.id, input.inviteId))
      .returning({ id: workspaceInviteTable.id });

    // Race guard: gone between select and delete.
    if (!cancelled) {
      throw new ORPCError("NOT_FOUND", { message: "Invite not found" });
    }

    return cancelled;
  });
