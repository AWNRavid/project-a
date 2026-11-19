import { db } from "@/db/drizzle/connection";
import { labelTable } from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { and, eq, ne } from "drizzle-orm";
import { updateLabelSchema } from "../schemas";

/**
 * Renames or recolors a label after checking workspace membership.
 */
export const updateLabel = authProcedure
  .input(updateLabelSchema)
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

    const [duplicate] = await db
      .select({ id: labelTable.id })
      .from(labelTable)
      .where(
        and(
          eq(labelTable.workspaceId, existing.workspaceId),
          eq(labelTable.name, input.name),
          ne(labelTable.id, input.labelId),
        ),
      )
      .limit(1);

    if (duplicate) {
      throw new ORPCError("CONFLICT", {
        message: "A label with this name already exists",
      });
    }

    const [label] = await db
      .update(labelTable)
      .set({ name: input.name, color: input.color })
      .where(eq(labelTable.id, input.labelId))
      .returning();

    if (!label) {
      throw new ORPCError("NOT_FOUND", { message: "Label not found" });
    }

    return label;
  });
