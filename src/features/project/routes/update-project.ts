import { db } from "@/db/drizzle/connection";
import { projectTable, workspaceTable } from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/client";
import { and, eq } from "drizzle-orm";
import z from "zod";

const updateProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.string(),
  workspaceId: z.string(),
});

export const updateProject = authProcedure
  .input(updateProjectSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);

    await requireWorkspaceRole(user.id, input.workspaceId, ["admin", "owner"]);

    const [project] = await db
      .update(projectTable)
      .set({
        title: input.title,
        description: input.description,
      })
      .where(
        and(
          eq(projectTable.id, input.projectId),
          eq(workspaceTable.id, input.workspaceId),
        ),
      )
      .returning();

    if (!project) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    return project;
  });
