import { db } from "@/db/drizzle/connection";
import { projectTable } from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { desc, eq } from "drizzle-orm";
import z from "zod";

const inputSchema = z.object({
  workspaceId: z.string(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const getAllProject = authProcedure
  .input(inputSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);

    await requireWorkspaceRole(user.id, input.workspaceId, [
      "admin",
      "owner",
      "member",
    ]);

    const result = await db
      .select()
      .from(projectTable)
      .where(eq(projectTable.workspaceId, input.workspaceId))
      .orderBy(desc(projectTable.createdAt))
      .limit(input.limit)
      .offset(input.offset);

    return result;
  });
