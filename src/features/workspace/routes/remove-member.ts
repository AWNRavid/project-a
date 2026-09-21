// Removes a workspace member. Only owner/admin may act; owners are
// never removable and self-removal goes through leaveWorkspace.
import { createDrizzleConnection } from "@/db/drizzle/connection";
// The membership row being deleted.
import { workspaceMemberTable } from "@/db/drizzle/schema";
import type { WorkspaceRole } from "@/features/workspace/types";
// Shared permission helper (owner/admin rule per the privilege matrix).
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
// Zod composes the route input schema.
import * as z from "zod";

// Actors allowed to remove other members.
const MEMBER_MANAGER_ROLES: readonly WorkspaceRole[] = ["owner", "admin"];

// memberId identifies the workspace_member row to delete.
const removeMemberSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  memberId: z.string().min(1, "Member ID is required"),
});

export const removeMember = authProcedure
  .input(removeMemberSchema)
  .handler(async ({ context, input }) => {
    const actor = requireUser(context.user);
    const db = createDrizzleConnection();

    // Guard: only owner/admin remove people.
    await requireWorkspaceRole(
      actor.id,
      input.workspaceId,
      MEMBER_MANAGER_ROLES,
    );

    // Locate the target membership inside this workspace.
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

    // Owners are un-removable by anyone except themselves — and even
    // they must transfer ownership first (invariant: a workspace
    // always has exactly one owner).
    if (target.role === "owner") {
      throw new ORPCError("FORBIDDEN", {
        message:
          "The workspace owner cannot be removed — transfer ownership first",
      });
    }

    // Removing yourself through this route would bypass the leave
    // flow; keep the separation explicit.
    if (target.userId === actor.id) {
      throw new ORPCError("FORBIDDEN", {
        message: "Use leave workspace to remove yourself",
      });
    }

    // Delete the membership. Their pending invites (if any) stay —
    // they were never a member while pending.
    const [removed] = await db
      .delete(workspaceMemberTable)
      .where(eq(workspaceMemberTable.id, input.memberId))
      .returning({ id: workspaceMemberTable.id });

    // Vanished between select and delete (rare race).
    if (!removed) {
      throw new ORPCError("NOT_FOUND", { message: "Member not found" });
    }

    return removed;
  });
