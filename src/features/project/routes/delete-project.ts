import { db } from "@/db/drizzle/connection";
import { projectTable } from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import z from "zod";

export const deleteProject = authProcedure
  .input(z.object({ projectId: z.uuid() }))
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);

    // Fetch the project first to learn its workspace, so the role
    // check runs against the workspace that actually owns it.
    const [project] = await db
      .select({ id: projectTable.id, workspaceId: projectTable.workspaceId })
      .from(projectTable)
      .where(eq(projectTable.id, input.projectId))
      .limit(1);

    if (!project) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    await requireWorkspaceRole(user.id, project.workspaceId, [
      "owner",
      "admin",
    ]);

    const [deleted] = await db
      .delete(projectTable)
      .where(eq(projectTable.id, project.id))
      .returning();

    return deleted;
  });
