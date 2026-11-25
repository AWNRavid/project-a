import { db } from "@/db/drizzle/connection";
import { projectTable } from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import z from "zod";

const inputSchema = z.object({
  workspaceId: z.string().min(1),
  projectId: z.uuid(),
});

export const getProject = authProcedure
  .input(inputSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);

    await requireWorkspaceRole(user.id, input.workspaceId, [
      "admin",
      "owner",
      "member",
    ]);

    // Scope by workspace too: authorization alone is not enough, or a
    // member of one workspace could read a project id from another.
    const [project] = await db
      .select()
      .from(projectTable)
      .where(
        and(
          eq(projectTable.id, input.projectId),
          eq(projectTable.workspaceId, input.workspaceId),
        ),
      )
      .limit(1);

    if (!project) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    return project;
  });
