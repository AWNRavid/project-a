import { db } from "@/db/drizzle/connection";
import { projectTable } from "@/db/drizzle/schema";
import { updateProjectSchema } from "@/features/project/schemas";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";

export const updateProject = authProcedure
  .input(updateProjectSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);

    await requireWorkspaceRole(user.id, input.workspaceId, ["admin", "owner"]);

    const [project] = await db
      .update(projectTable)
      .set({
        title: input.title,
        description: input.description || null,
        status: input.status,
      })
      .where(
        and(
          eq(projectTable.id, input.projectId),
          eq(projectTable.workspaceId, input.workspaceId),
        ),
      )
      .returning();

    if (!project) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    return project;
  });
