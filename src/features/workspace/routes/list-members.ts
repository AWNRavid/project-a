// Lists every member of a workspace (visible to all members); role
// mutations live in the dedicated update/remove/transfer routes.
import { createDrizzleConnection } from "@/db/drizzle/connection";
// Membership rows join users for display data (name/email/avatar).
import { userTable, workspaceMemberTable } from "@/db/drizzle/schema";
// Domain role parsing: DB stores plain text, parse at the boundary.
import { parseWorkspaceRole } from "@/features/workspace/types";
// Access check: viewing the team is member-level permission.
import { getWorkspaceMembershipRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
// Ordering: owners on top, then the longest-standing members.
import { asc, eq, sql } from "drizzle-orm";
// Zod composes the route input schema.
import * as z from "zod";

// Workspace targeted by the listing.
const listMembersSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const listMembers = authProcedure
  .input(listMembersSchema)
  .handler(async ({ context, input }) => {
    const user = requireUser(context.user);
    const db = createDrizzleConnection();

    // Guard: viewers must belong to the workspace (any role).
    const viewerRole = await getWorkspaceMembershipRole(
      user.id,
      input.workspaceId,
    );
    if (!viewerRole) {
      throw new ORPCError("FORBIDDEN", {
        message: "You are not a member of this workspace",
      });
    }

    // Join users for display data; sort owner first (`sql` boolean
    // lower-cased) and oldest members after.
    const members = await db
      .select({
        id: workspaceMemberTable.id,
        userId: userTable.id,
        name: userTable.name,
        email: userTable.email,
        image: userTable.image,
        role: workspaceMemberTable.role,
        joinedAt: workspaceMemberTable.joinedAt,
      })
      .from(workspaceMemberTable)
      .innerJoin(userTable, eq(workspaceMemberTable.userId, userTable.id))
      .where(eq(workspaceMemberTable.workspaceId, input.workspaceId))
      // Owner-first then joinedAt: CASE 1 for owners keeps them on top.
      .orderBy(
        sql`case when ${workspaceMemberTable.role} = 'owner' then 0 else 1 end`,
        asc(workspaceMemberTable.joinedAt),
      );

    // Parse each stored role at the boundary; corrupted values fail
    // loudly (same policy as listWorkspaces/listInvites).
    return {
      members: members.map((member) => {
        const role = parseWorkspaceRole(member.role);
        if (!role) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: `Stored member role "${member.role}" is not a valid role`,
          });
        }
        return { ...member, role };
      }),
    };
  });
