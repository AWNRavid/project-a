import * as z from "zod";

export const workspaceRoles = ["owner", "admin", "member"] as const;

export type WorkspaceRole = (typeof workspaceRoles)[number];

export const workspaceRoleSchema = z.enum(workspaceRoles);

/**
 * Parses a raw role string coming from the database into a typed
 * role. Returns null when the value is not a known role so callers
 * can decide how to surface the illegal state.
 */
export function parseWorkspaceRole(value: string): WorkspaceRole | null {
  const result = workspaceRoleSchema.safeParse(value);
  return result.success ? result.data : null;
}
