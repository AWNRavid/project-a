// Transfers workspace ownership to an existing member: the target
// becomes the (single) owner and the previous owner falls back to
// admin. One atomic swap keeps the invariant "exactly one owner".
import { createDrizzleConnection } from "@/db/drizzle/connection";
// Both memberships are updated in one transaction below.
import { workspaceMemberTable } from "@/db/drizzle/schema";
import type { WorkspaceRole } from "@/features/workspace/types";
// Only the owner may transfer ownership (privilege matrix).
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
// Zod composes the route input schema.
import * as z from "zod";

// Owner-only action.
const TRANSFER_ALLOWED_ROLES: readonly WorkspaceRole[] = ["owner"];

// Addressed by workspace + the target USER id (UI shows the member
// list, which carries user ids).
const transferOwnershipSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  toUserId: z.string().min(1, "Recipient user is required"),
});

export const transferOwnership = authProcedure
  .input(transferOwnershipSchema)
  .handler(async ({ context, input }) => {
    const currentOwner = requireUser(context.user);
    const db = createDrizzleConnection();

    // Guard: only the owner may transfer ownership.
    await requireWorkspaceRole(
      currentOwner.id,
      input.workspaceId,
      TRANSFER_ALLOWED_ROLES,
    );

    // Transferring to yourself is a no-op — reject loudly instead.
    if (input.toUserId === currentOwner.id) {
      throw new ORPCError("FORBIDDEN", {
        message: "You already own this workspace",
      });
    }

    // The target must be an existing member (any role; ownership is
    // not tied to their previous role).
    const [targetMembership] = await db
      .select({ id: workspaceMemberTable.id, role: workspaceMemberTable.role })
      .from(workspaceMemberTable)
      .where(
        and(
          eq(workspaceMemberTable.workspaceId, input.workspaceId),
          eq(workspaceMemberTable.userId, input.toUserId),
        ),
      );

    if (!targetMembership) {
      throw new ORPCError("NOT_FOUND", {
        message: "That person is not a member of this workspace",
      });
    }

    // Atomic swap: target → owner, current owner → admin. A partially
    // applied change would break the one-owner invariant.
    await db.transaction(async (tx) => {
      // Promote the target to owner.
      await tx
        .update(workspaceMemberTable)
        .set({ role: "owner" })
        .where(eq(workspaceMemberTable.id, targetMembership.id));

      // Demote the previous owner to admin so they keep management
      // rights (per the privilege matrix) without ownership.
      const previousOwnerRole: WorkspaceRole = "admin";
      await tx
        .update(workspaceMemberTable)
        .set({ role: previousOwnerRole })
        .where(
          and(
            eq(workspaceMemberTable.workspaceId, input.workspaceId),
            eq(workspaceMemberTable.userId, currentOwner.id),
          ),
        );
    });

    return { toUserId: input.toUserId };
  });
