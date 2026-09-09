import { createDrizzleConnection } from "@/db/drizzle/connection";
import { workspaceMemberTable, workspaceTable } from "@/db/drizzle/schema";
import {
  workspaceLogoSchema,
  workspaceNameSchema,
} from "@/features/workspace/schemas";
import type { WorkspaceRole } from "@/features/workspace/types";
import {
  deleteWorkspaceLogo,
  uploadWorkspaceLogo,
} from "@/features/workspace/utils/logo";
import { buildSlugCandidates } from "@/features/workspace/utils/slug";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { v7 as uuidv7 } from "uuid";
import * as z from "zod";

const UNIQUE_CONSTRAINT_ERROR_CODE = "23505";

const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  logo: workspaceLogoSchema.optional(),
});

function isUniqueConstraintViolation(error: unknown): boolean {
  // Drizzle wraps driver errors (e.g. DrizzleQueryError with the pg
  // error as `cause`), so walk down the cause chain looking for the
  // Postgres unique-violation code.
  for (
    let current: unknown = error;
    current instanceof Error;
    current = current.cause
  ) {
    if ("code" in current && current.code === UNIQUE_CONSTRAINT_ERROR_CODE) {
      return true;
    }
  }
  return false;
}

export const createWorkspace = authProcedure
  .input(createWorkspaceSchema)
  .handler(async ({ context, input }) => {
    const user = requireUser(context.user);
    const db = createDrizzleConnection();

    const workspaceId = uuidv7();
    const logoPath = input.logo
      ? await uploadWorkspaceLogo(workspaceId, input.logo)
      : null;

    try {
      for (const slug of buildSlugCandidates(input.name)) {
        try {
          const workspace = await db.transaction(async (tx) => {
            const [createdWorkspace] = await tx
              .insert(workspaceTable)
              .values({
                id: workspaceId,
                name: input.name,
                slug,
                logo: logoPath,
              })
              .returning();

            const ownerRole: WorkspaceRole = "owner";
            await tx.insert(workspaceMemberTable).values({
              id: uuidv7(),
              workspaceId,
              userId: user.id,
              role: ownerRole,
            });

            return createdWorkspace;
          });

          return workspace;
        } catch (error) {
          if (!isUniqueConstraintViolation(error)) {
            throw error;
          }
          // Slug got taken concurrently, try the next candidate.
        }
      }

      throw new ORPCError("CONFLICT", {
        message: "Could not find an available slug for this workspace name",
      });
    } catch (error) {
      // Roll back the uploaded logo when workspace creation failed.
      if (logoPath) {
        await deleteWorkspaceLogo(logoPath).catch(() => undefined);
      }
      throw error;
    }
  });
