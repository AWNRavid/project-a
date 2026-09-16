// Public (pre-auth) invite preview: given a token, return just enough
// info for the /invite/<token> page to render before the user logs in
// or accepts. No membership mutation happens here.
import "server-only";

import { createDrizzleConnection } from "@/db/drizzle/connection";
import {
  userTable,
  workspaceInviteTable,
  workspaceTable,
} from "@/db/drizzle/schema";
import { parseWorkspaceRole } from "@/features/workspace/types";
import { isInviteExpired } from "@/features/workspace/utils/invite";
import { authBase } from "@/lib/orpc/auth/auth-base";
import { loggingMiddleware } from "@/lib/orpc/logging-middleware";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as z from "zod";

// Invite pages carry the raw token in the URL.
const getInviteSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{64}$/, "Invalid invite token"),
});

export const getInvite = authBase
  .use(loggingMiddleware) // trace like every other route; no auth gate
  .input(getInviteSchema)
  .handler(async ({ input }) => {
    const db = createDrizzleConnection();

    // Token -> unique invite row (token column has a unique index).
    const [invite] = await db
      .select()
      .from(workspaceInviteTable)
      .where(eq(workspaceInviteTable.token, input.token));

    // No such invite: token wrong or invite cancelled → page can show
    // its invalid state (same shape, valid=false).
    if (!invite) {
      return { valid: false as const };
    }

    // Expired invites are previewable but clearly marked; they cannot
    // be accepted.
    const expired = isInviteExpired(invite.expiresAt);

    // Corrupted role text aborts loudly (same policy as other
    // workspace routes).
    const role = parseWorkspaceRole(invite.role);
    if (!role) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `Stored invite role "${invite.role}" is not a valid role`,
      });
    }

    // Workspace display name for the preview card.
    const [workspace] = await db
      .select({ name: workspaceTable.name })
      .from(workspaceTable)
      .where(eq(workspaceTable.id, invite.workspaceId));

    if (!workspace) {
      // Effectively unreachable (cascade FK), kept for exhaustiveness.
      throw new ORPCError("NOT_FOUND", { message: "Invite not found" });
    }

    // The inviter's display name ("X has invited you...").
    const [inviter] = await db
      .select({ name: userTable.name })
      .from(userTable)
      .where(eq(userTable.id, invite.invitedById));

    if (!inviter) {
      // Effectively unreachable (cascade FK on user), kept for narrowing.
      throw new ORPCError("NOT_FOUND", { message: "Invite not found" });
    }

    // Preview payload consumed by the accept-invite client card.
    return {
      valid: true as const,
      expired,
      workspaceName: workspace.name,
      inviterName: inviter.name,
      email: invite.email,
      role,
      expiresAt: invite.expiresAt,
    };
  });
