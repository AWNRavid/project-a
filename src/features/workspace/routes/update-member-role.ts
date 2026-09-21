// Changes a workspace member's role. Only owner/admin may act; owners
// are untouchable (ownership moves via transferOwnership) and nobody
// may change their own role.
import { createDrizzleConnection } from "@/db/drizzle/connection";
// The membership row being re-role'd.
import { workspaceMemberTable } from "@/db/drizzle/schema";
// invitedRoleSchema = member/admin ("owner" is deliberately excluded
// — granting ownership happens only via transferOwnership).
import { invitedRoleSchema } from "@/features/workspace/schemas";
import type { WorkspaceRole } from "@/features/workspace/types";
// Shared permission helper (owner/admin rule per the privilege matrix).
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
// Zod composes the route input schema.
import * as z from "zod";

// Actors allowed to change other members' roles.
const ROLE_MANAGER_ROLES: readonly WorkspaceRole[] = ["owner", "admin"];

// memberId identifies the workspace_member row; role is bounded to
// member/admin at the schema level (owner never flows through here).
const updateMemberRoleSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  memberId: z.string().min(1, "Member ID is required"),
  role: invitedRoleSchema,
});

export const updateMemberRole = authProcedure
  .input(updateMemberRoleSchema)
  .handler(async ({ context, input }) => {
    const actor = requireUser(context.user);
    const db = createDrizzleConnection();

    // Guard: only owner/admin manage roles.
    await requireWorkspaceRole(actor.id, input.workspaceId, ROLE_MANAGER_ROLES);

    // Load the target membership row inside this workspace.
    const [target] = await db
      .select({
        id: workspaceMemberTable.id,
        userId: workspaceMemberTable.userId,
        role: workspaceMemberTable.role,
      })
      .from(workspaceMemberTable)
      .where(
        and(
          eq(workspaceMemberTable.id, input.memberId),
          eq(workspaceMemberTable.workspaceId, input.workspaceId),
        ),
      );

    if (!target) {
      throw new ORPCError("NOT_FOUND", { message: "Member not found" });
    }

    // An owner's role is immutable here: ownership changes only via
    // the explicit transferOwnership route.
    if (target.role === "owner") {
      throw new ORPCError("FORBIDDEN", {
        message:
          "Ownership cannot be changed here — use transfer ownership instead",
      });
    }

    // Self-modification is forbidden: an admin demoting themselves or
    // mutating their own role is a footgun; leave/transfer are the
    // designed paths.
    if (target.userId === actor.id) {
      throw new ORPCError("FORBIDDEN", {
        message: "You cannot change your own role — leave or transfer instead",
      });
    }

    // Apply the new role; `.returning()` proves the row was updated.
    const [updated] = await db
      .update(workspaceMemberTable)
      .set({ role: input.role })
      .where(eq(workspaceMemberTable.id, input.memberId))
      .returning({ id: workspaceMemberTable.id });

    // Vanished between select and update (rare race).
    if (!updated) {
      throw new ORPCError("NOT_FOUND", { message: "Member not found" });
    }

    return updated;
  });
