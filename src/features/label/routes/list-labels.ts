import { db } from "@/db/drizzle/connection";
import { labelTable } from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { asc, eq } from "drizzle-orm";
import { listLabelsSchema } from "../schemas";

/**
 * Lists every label of a workspace. All members may read labels.
 */
export const listLabels = authProcedure
  .input(listLabelsSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);

    await requireWorkspaceRole(user.id, input.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    const labels = await db
      .select()
      .from(labelTable)
      .where(eq(labelTable.workspaceId, input.workspaceId))
      .orderBy(asc(labelTable.name));

    return { labels };
  });
