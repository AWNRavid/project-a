// Shared membership/permission helpers for workspace oRPC routes.
// Every route that touches a specific workspace funnels its
// authorization through this file so the rules live in one place.
import { createDrizzleConnection } from "@/db/drizzle/connection";
import { workspaceMemberTable } from "@/db/drizzle/schema";
import {
  parseWorkspaceRole,
  type WorkspaceRole,
} from "@/features/workspace/types";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";

/**
 * Returns the caller's role in the given workspace (parsed from the
 * raw DB text at the boundary), or null when they are not a member.
 */
export async function getWorkspaceMembershipRole(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceRole | null> {
  const db = createDrizzleConnection();

  // Fetch just this user's membership row for the given workspace.
  const [membership] = await db
    .select({ role: workspaceMemberTable.role })
    .from(workspaceMemberTable)
    .where(
      and(
        // Membership in this specific workspace...
        eq(workspaceMemberTable.workspaceId, workspaceId),
        // ...for this user. Other users' rows are irrelevant.
        eq(workspaceMemberTable.userId, userId),
      ),
    );

  // No membership row in the workspace at all — treated the same as
  // an unknown role by callers.
  if (!membership) {
    return null;
  }

  // Parse the stored text role into the typed union; returns null on
  // corrupted/unknown values (rare data error).
  return parseWorkspaceRole(membership.role);
}

/**
 * Access guard for workspace routes: throws FORBIDDEN unless the
 * user's membership role is in `allowedRoles`. Returns the parsed
 * role so callers can differentiate (e.g. only owners do X).
 */
export async function requireWorkspaceRole(
  userId: string,
  workspaceId: string,
  allowedRoles: readonly WorkspaceRole[],
): Promise<WorkspaceRole> {
  // Cheap membership lookup with boundary role parsing.
  const role = await getWorkspaceMembershipRole(userId, workspaceId);

  // Non-members and insufficient roles both get FORBIDDEN, so the
  // existence of (non-)memberships is never leaked.
  if (!role || !allowedRoles.includes(role)) {
    throw new ORPCError("FORBIDDEN", {
      message: "You do not have permission to perform this action",
    });
  }

  return role;
}
