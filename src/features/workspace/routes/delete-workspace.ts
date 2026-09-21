// Deletes a whole workspace (owner-only). Cascades memberships and
// invites; also removes the workspace's stored logo file from MinIO.
import { createDrizzleConnection } from "@/db/drizzle/connection";
// The workspace row removed below (members/invites cascade via FKs).
import { workspaceTable } from "@/db/drizzle/schema";
import type { WorkspaceRole } from "@/features/workspace/types";
// Logo cleanup helper (best-effort file deletion).
import { deleteWorkspaceLogo } from "@/features/workspace/utils/logo";
// Owner-only action per the privilege matrix.
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
// Zod composes the route input schema.
import * as z from "zod";

// Owner-only action.
const DELETE_ALLOWED_ROLES: readonly WorkspaceRole[] = ["owner"];

const deleteWorkspaceSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const deleteWorkspace = authProcedure
  .input(deleteWorkspaceSchema)
  .handler(async ({ context, input }) => {
    const user = requireUser(context.user);
    const db = createDrizzleConnection();

    // Guard: only the owner may delete the workspace.
    await requireWorkspaceRole(
      user.id,
      input.workspaceId,
      DELETE_ALLOWED_ROLES,
    );

    // Remember the logo path first — the row (and its FK cascade of
    // memberships/invites) stops existing after the delete.
    const [workspace] = await db
      .select({ id: workspaceTable.id, logo: workspaceTable.logo })
      .from(workspaceTable)
      .where(eq(workspaceTable.id, input.workspaceId));

    if (!workspace) {
      throw new ORPCError("NOT_FOUND", { message: "Workspace not found" });
    }

    // Delete the row: memberships + invites cascade here (FK
    // onDelete: cascade), and phase-2 tables will inherit the same
    // behavior through their workspace FKs.
    await db
      .delete(workspaceTable)
      .where(eq(workspaceTable.id, input.workspaceId));

    // Storage is outside the transaction: try to clean the logo file
    // (best-effort — a stray object is tolerable).
    await deleteWorkspaceLogo(workspace.logo).catch(() => undefined);

    return { id: workspace.id };
  });
