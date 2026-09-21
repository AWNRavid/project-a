// Lets a member leave the workspace on their own. Owners must
// transfer ownership first — a workspace always needs its owner.
import { createDrizzleConnection } from "@/db/drizzle/connection";
// The caller's own membership row is deleted below.
import { workspaceMemberTable } from "@/db/drizzle/schema";
import { getWorkspaceMembershipRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
// Zod composes the route input schema.
import * as z from "zod";

const leaveWorkspaceSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const leaveWorkspace = authProcedure
  .input(leaveWorkspaceSchema)
  .handler(async ({ context, input }) => {
    const user = requireUser(context.user);
    const db = createDrizzleConnection();

    // Their membership role: null when they are not a member at all.
    const role = await getWorkspaceMembershipRole(user.id, input.workspaceId);

    // Not a member → nothing to leave (also blocks non-members from
    // probing workspace existence).
    if (!role) {
      throw new ORPCError("FORBIDDEN", {
        message: "You are not a member of this workspace",
      });
    }

    // Owners cannot walk away: the one-owner invariant holds until
    // ownership is transferred to someone else.
    if (role === "owner") {
      throw new ORPCError("FORBIDDEN", {
        message:
          "Transfer ownership to another member before leaving the workspace",
      });
    }

    // Remove the caller's own membership row.
    const [left] = await db
      .delete(workspaceMemberTable)
      .where(
        and(
          eq(workspaceMemberTable.workspaceId, input.workspaceId),
          eq(workspaceMemberTable.userId, user.id),
        ),
      )
      .returning({ id: workspaceMemberTable.id });

    // Vanished between the role lookup and this delete (rare race).
    if (!left) {
      throw new ORPCError("NOT_FOUND", { message: "Membership not found" });
    }

    return left;
  });
