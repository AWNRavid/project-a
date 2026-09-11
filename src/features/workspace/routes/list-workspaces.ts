import { createDrizzleConnection } from "@/db/drizzle/connection";
import { workspaceMemberTable, workspaceTable } from "@/db/drizzle/schema";
import { parseWorkspaceRole } from "@/features/workspace/types";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { getFileUrl } from "@/lib/s3-storage";
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";

/**
 * Lists the workspaces the current user is a member of, oldest
 * first. The first entry acts as the user's active workspace until a
 * workspace switcher exists.
 */
export const listWorkspaces = authProcedure.handler(async ({ context }) => {
  const user = requireUser(context.user);
  const db = createDrizzleConnection();

  // Join through the membership table so only workspaces the user
  // belongs to are returned; role comes from the membership row.
  const memberships = await db
    .select({
      id: workspaceTable.id,
      name: workspaceTable.name,
      slug: workspaceTable.slug,
      logo: workspaceTable.logo,
      createdAt: workspaceTable.createdAt,
      role: workspaceMemberTable.role,
    })
    .from(workspaceMemberTable)
    .innerJoin(
      workspaceTable,
      eq(workspaceMemberTable.workspaceId, workspaceTable.id),
    )
    .where(eq(workspaceMemberTable.userId, user.id))
    .orderBy(asc(workspaceTable.createdAt));

  // Parse roles at the boundary and resolve logo URLs. A role the
  // app does not know means corrupted data — fail loudly instead of
  // silently skipping memberships.
  const workspaces = await Promise.all(
    memberships.map(async (membership) => {
      const role = parseWorkspaceRole(membership.role);
      if (!role) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Stored workspace role "${membership.role}" is not a valid role`,
        });
      }

      return {
        id: membership.id,
        name: membership.name,
        slug: membership.slug,
        logo: membership.logo,
        // Resolved into a fetched-able URL (public bucket = direct
        // URL) so clients never need to understand storage paths.
        logoUrl: await getFileUrl(membership.logo),
        role,
        createdAt: membership.createdAt,
      };
    }),
  );

  return { workspaces };
});
