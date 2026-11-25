import { db } from "@/db/drizzle/connection";
import { projectTable } from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { count, desc, eq } from "drizzle-orm";
import z from "zod";

const inputSchema = z.object({
  workspaceId: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
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

    const where = eq(projectTable.workspaceId, input.workspaceId);

    const [projects, [countRow]] = await Promise.all([
      db
        .select()
        .from(projectTable)
        .where(where)
        .orderBy(desc(projectTable.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db.select({ total: count() }).from(projectTable).where(where),
    ]);

    // total is not capped by limit/offset, so the client can say how
    // many projects exist instead of how many this page returned.
    return { projects, total: countRow?.total ?? 0 };
  });
