import { db } from "@/db/drizzle/connection";
import { labelTable } from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { createLabelSchema } from "../schemas";

/**
 * Creates a workspace label. The unique index on (workspace, name)
 * keeps duplicates impossible even if two requests race.
 */
export const createLabel = authProcedure
  .input(createLabelSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);

    await requireWorkspaceRole(user.id, input.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    const [existing] = await db
      .select({ id: labelTable.id })
      .from(labelTable)
      .where(
        and(
          eq(labelTable.workspaceId, input.workspaceId),
          eq(labelTable.name, input.name),
        ),
      )
      .limit(1);

    if (existing) {
      throw new ORPCError("CONFLICT", {
        message: "A label with this name already exists",
      });
    }

    const [label] = await db
      .insert(labelTable)
      .values({
        workspaceId: input.workspaceId,
        name: input.name,
        color: input.color,
      })
      .returning();

    if (!label) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create label",
      });
    }

    return label;
  });
