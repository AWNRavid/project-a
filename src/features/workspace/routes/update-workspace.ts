import { createDrizzleConnection } from "@/db/drizzle/connection";
import { workspaceMemberTable, workspaceTable } from "@/db/drizzle/schema";
import {
  workspaceLogoSchema,
  workspaceNameSchema,
} from "@/features/workspace/schemas";
import {
  parseWorkspaceRole,
  type WorkspaceRole,
} from "@/features/workspace/types";
import {
  deleteWorkspaceLogo,
  uploadWorkspaceLogo,
} from "@/features/workspace/utils/logo";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { getFileUrl } from "@/lib/s3-storage";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import * as z from "zod";

// Roles allowed to edit name/logo — the smallest slice of the
// phase-1 role management work; refine later as more actions appear.
const EDITABLE_WORKSPACE_ROLES: readonly WorkspaceRole[] = ["owner", "admin"];

// All fields except workspaceId are optional: the route handles
// rename, logo upload, and logo removal independently. The refines
// reject contradictory requests (upload + remove) and no-op requests
// (nothing to change).
const updateWorkspaceSchema = z
  .object({
    workspaceId: z.string().min(1, "Workspace ID is required"),
    name: workspaceNameSchema.optional(),
    logo: workspaceLogoSchema.optional(),
    removeLogo: z.boolean().optional(),
  })
  .refine((input) => !input.removeLogo || input.logo === undefined, {
    error: "Cannot update and remove the logo at the same time",
    path: ["logo"],
  })
  .refine(
    (input) =>
      input.name !== undefined ||
      input.logo !== undefined ||
      input.removeLogo === true,
    { error: "Nothing to update", path: ["name"] },
  );

export const updateWorkspace = authProcedure
  .input(updateWorkspaceSchema)
  .handler(async ({ context, input }) => {
    const user = requireUser(context.user);
    const db = createDrizzleConnection();

    // Authorization: look up the caller's membership in this
    // workspace. No membership or a review-only role is forbidden;
    // non-members get the same FORBIDDEN (no existence leak).
    const [membership] = await db
      .select({ role: workspaceMemberTable.role })
      .from(workspaceMemberTable)
      .where(
        and(
          eq(workspaceMemberTable.workspaceId, input.workspaceId),
          eq(workspaceMemberTable.userId, user.id),
        ),
      );

    const role = membership ? parseWorkspaceRole(membership.role) : null;
    if (!role || !EDITABLE_WORKSPACE_ROLES.includes(role)) {
      throw new ORPCError("FORBIDDEN", {
        message: "You do not have permission to edit this workspace",
      });
    }

    // Remember the old logo so it can be deleted once the new one is
    // safely persisted.
    const [existingWorkspace] = await db
      .select({ logo: workspaceTable.logo })
      .from(workspaceTable)
      .where(eq(workspaceTable.id, input.workspaceId));

    if (!existingWorkspace) {
      throw new ORPCError("NOT_FOUND", { message: "Workspace not found" });
    }

    const shouldRemoveLogo = input.removeLogo === true;
    // Upload the replacement before the DB update; if the update
    // fails the catch below cleans this upload up.
    const newLogoPath = input.logo
      ? await uploadWorkspaceLogo(input.workspaceId, input.logo)
      : null;

    try {
      // Only apply the fields actually requested: name is included
      // when provided, logo is touched when a file arrives or removal
      // was requested (null clears the column).
      const [workspace] = await db
        .update(workspaceTable)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.logo !== undefined || shouldRemoveLogo
            ? { logo: newLogoPath }
            : {}),
        })
        .where(eq(workspaceTable.id, input.workspaceId))
        .returning();

      if (!workspace) {
        throw new ORPCError("NOT_FOUND", { message: "Workspace not found" });
      }

      // Remove the replaced/removed logo after a successful update.
      if (
        (input.logo !== undefined || shouldRemoveLogo) &&
        existingWorkspace.logo &&
        existingWorkspace.logo !== workspace.logo
      ) {
        await deleteWorkspaceLogo(existingWorkspace.logo).catch(
          () => undefined,
        );
      }

      // Return the fresh row plus a ready-to-use logo URL.
      return { ...workspace, logoUrl: await getFileUrl(workspace.logo) };
    } catch (error) {
      // Roll back the uploaded logo when the update failed.
      if (newLogoPath) {
        await deleteWorkspaceLogo(newLogoPath).catch(() => undefined);
      }
      throw error;
    }
  });
