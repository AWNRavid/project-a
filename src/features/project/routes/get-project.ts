import { db } from "@/db/drizzle/connection";
import { projectTable } from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { eq } from "drizzle-orm";
import z from "zod";

const inputSchema = z.object({
  workspaceId: z.string(),
  projectId: z.string(),
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

    const [result] = await db
      .select()
      .from(projectTable)
      .where(eq(projectTable.id, input.projectId))
      .limit(1);

    return result;
  });
