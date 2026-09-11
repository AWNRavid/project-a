import * as z from "zod";

// Single source of truth for workspace membership roles. The database
// stores the role as plain text, so every read goes through
// parseWorkspaceRole to turn it back into one of these values.
export const workspaceRoles = ["owner", "admin", "member"] as const;

// The union type derived from the list above, making it a compile
// error to reference a role that does not exist.
export type WorkspaceRole = (typeof workspaceRoles)[number];

// Zod schema mirroring the role list; used to validate/parse values
// coming from the database or API payloads at boundaries.
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
