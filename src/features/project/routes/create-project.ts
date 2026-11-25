import { db } from "@/db/drizzle/connection";
import { projectTable } from "@/db/drizzle/schema";
import {
  isUniqueViolation,
  MAX_KEY_ATTEMPTS,
  projectKey,
} from "@/features/project/project-key";
import { createProjectSchema } from "@/features/project/schemas";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";

export const createProject = authProcedure
  .input(createProjectSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);

    await requireWorkspaceRole(user.id, input.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    // The key suffix is random, so a collision is rare but possible;
    // retry a few times instead of surfacing a 500 to the caller.
    for (let attempt = 0; attempt < MAX_KEY_ATTEMPTS; attempt++) {
      try {
        const [project] = await db
          .insert(projectTable)
          .values({
            title: input.title,
            workspaceId: input.workspaceId,
            createdById: user.id,
            description: input.description || null,
            key: projectKey(input.title),
            status: "active",
          })
          .returning();

        return project;
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }
      }
    }

    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Could not generate a unique project key",
    });
  });
