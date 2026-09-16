// Invites a workspace into existence: validates, uploads the logo,
// then inserts the workspace plus the creator's owner membership.
import { createDrizzleConnection } from "@/db/drizzle/connection";
// Workspace + membership tables written in one transaction below.
import { workspaceMemberTable, workspaceTable } from "@/db/drizzle/schema";
// Shared (client-safe) Zod schemas so validation matches the client.
import {
  workspaceLogoSchema,
  workspaceNameSchema,
} from "@/features/workspace/schemas";
// Compile-time role guarantee for the bare ownership literal below.
import type { WorkspaceRole } from "@/features/workspace/types";
// Logo storage helpers: compress → upload to MinIO, best-effort delete.
import {
  deleteWorkspaceLogo,
  uploadWorkspaceLogo,
} from "@/features/workspace/utils/logo";
// Slug helpers: build candidates to try against the unique constraint.
import { buildSlugCandidates } from "@/features/workspace/utils/slug";
// Base procedure chain: auth middleware sets context.user.
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
// Type-safe narrowing helper (throws UNAUTHORIZED when null).
import { requireUser } from "@/lib/orpc/auth/require-user";
// oRPC error type for typed client errors.
import { ORPCError } from "@orpc/server";
// uuid v7 = time-sortable ids for the new workspace rows.
import { v7 as uuidv7 } from "uuid";
// Zod to compose the route input schema.
import * as z from "zod";

// Postgres error code raised when an INSERT breaks a UNIQUE
// constraint — used to detect slug collisions and retry.
const UNIQUE_CONSTRAINT_ERROR_CODE = "23505";

// Name is required; the logo is optional and uploaded only when sent.
// Validation errors are returned to the client before the handler
// runs.
const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  logo: workspaceLogoSchema.optional(),
});

/**
 * Reads driver errors (Drizzle wraps pg errors as `cause` chains) and
 * answers whether the unique constraint was the reason the insert
 * failed (e.g. slug already taken by another workspace).
 */
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
    // Auth middleware guarantees a session; this narrows the type
    // (and still throws for defense in depth).
    const user = requireUser(context.user);
    // Shared per-process pool; the handler only runs queries.
    const db = createDrizzleConnection();

    // Generate the ID up front so the logo can land in its final
    // storage location before any database write happens.
    const workspaceId = uuidv7();
    // Upload happens before any DB write: S3 I/O inside a transaction
    // would hold the DB connection open for nothing.
    const logoPath = input.logo
      ? await uploadWorkspaceLogo(workspaceId, input.logo)
      : null;

    try {
      // Try each slug candidate in order until an insert succeeds; the
      // DB's unique constraint is the source of truth.
      for (const slug of buildSlugCandidates(input.name)) {
        try {
          // Atomic so a workspace can never exist without its owner
          // membership (or vice versa).
          const workspace = await db.transaction(async (tx) => {
            // First: the workspace row itself with the candidate slug.
            const [createdWorkspace] = await tx
              .insert(workspaceTable)
              .values({
                id: workspaceId,
                name: input.name,
                slug,
                logo: logoPath,
              })
              .returning();

            // The creator always becomes the first owner. `satisfies`
            // keeps the literal tied to the WorkspaceRole union.
            const ownerRole: WorkspaceRole = "owner";
            await tx.insert(workspaceMemberTable).values({
              id: uuidv7(),
              workspaceId,
              userId: user.id,
              role: ownerRole,
            });

            return createdWorkspace;
          });

          // Freshly created workspace is returned to the client so it
          // can redirect/refresh immediately.
          return workspace;
        } catch (error) {
          // Any unique violation (slug or membership) triggers the
          // "try the next slug" path; other errors propagate.
          if (!isUniqueConstraintViolation(error)) {
            throw error;
          }
          // Slug got taken concurrently, try the next candidate.
        }
      }

      // All candidates colliding is practically impossible, but the
      // loop must still terminate with a clear error.
      throw new ORPCError("CONFLICT", {
        message: "Could not find an available slug for this workspace name",
      });
    } catch (error) {
      // Roll back the uploaded logo when workspace creation failed
      // (best-effort; a stray object in MinIO is harmless).
      if (logoPath) {
        await deleteWorkspaceLogo(logoPath).catch(() => undefined);
      }
      // Re-throw so the client sees a real error (e.g. FORBIDDEN).
      throw error;
    }
  });
