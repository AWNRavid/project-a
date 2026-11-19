import { db } from "@/db/drizzle/connection";
import { labelTable } from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { deleteLabelSchema } from "../schemas";

/**
 * Deletes a label. Issue links cascade through the join table.
 */
export const deleteLabel = authProcedure
  .input(deleteLabelSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);

    const [existing] = await db
      .select({ id: labelTable.id, workspaceId: labelTable.workspaceId })
      .from(labelTable)
      .where(eq(labelTable.id, input.labelId))
      .limit(1);

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Label not found" });
    }

    await requireWorkspaceRole(user.id, existing.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    await db.delete(labelTable).where(eq(labelTable.id, input.labelId));

    return { id: existing.id };
  });
