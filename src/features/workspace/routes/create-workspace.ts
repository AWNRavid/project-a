import { createDrizzleConnection } from "@/db/drizzle/connection";
import {
  workspaceLogoSchema,
  workspaceNameSchema,
} from "@/features/workspace/schemas";
import { uploadWorkspaceLogo } from "@/features/workspace/utils/logo";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { v7 as uuidv7 } from "uuid";
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
    } catch (error) {}
  });
