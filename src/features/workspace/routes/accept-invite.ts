// Accepts a workspace invite by token. Only the invited email's
// account can accept, and only while the invite is unexpired.
import { createDrizzleConnection } from "@/db/drizzle/connection";
import {
  workspaceInviteTable,
  workspaceMemberTable,
  workspaceTable,
} from "@/db/drizzle/schema";
import { parseWorkspaceRole } from "@/features/workspace/types";
import { isInviteExpired } from "@/features/workspace/utils/invite";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import * as z from "zod";

// Same 64-hex shape getInvite expects; the token is the whole key.
const acceptInviteSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{64}$/, "Invalid invite token"),
});

export const acceptInvite = authProcedure
  .input(acceptInviteSchema)
  .handler(async ({ context, input }) => {
    // Accepting requires a signed-in user; the /invite page enforces
    // the login redirect before this route is reachable.
    const user = requireUser(context.user);
    const db = createDrizzleConnection();

    // Token → unique invite row (token column has a unique index).
    const [invite] = await db
      .select()
      .from(workspaceInviteTable)
      .where(eq(workspaceInviteTable.token, input.token));

    // Wrong token or a cancelled invite both look identical here.
    if (!invite) {
      throw new ORPCError("NOT_FOUND", { message: "Invite not found" });
    }

    // Expired invites are dead: the row lingers (list hides it), but
    // joining is refused until a manager resends (which renews it).
    if (isInviteExpired(invite.expiresAt)) {
      throw new ORPCError("FORBIDDEN", {
        message: "This invitation has expired — ask to be re-invited",
      });
    }

    // Only the invited email's account may accept: prevents a member
    // being injected by whoever clicks the link first. Compare
    // lowercased on both sides so stored casing can never trip it.
    const email = user.email.toLowerCase();
    if (email !== invite.email.toLowerCase()) {
      throw new ORPCError("FORBIDDEN", {
        message: `Please sign in as ${invite.email} to accept this invitation`,
      });
    }

    // Workspace info for the response payload; existence is implied by
    // the cascade FKs but re-checked for exhaustiveness.
    const [workspace] = await db
      .select({ id: workspaceTable.id, name: workspaceTable.name })
      .from(workspaceTable)
      .where(eq(workspaceTable.id, invite.workspaceId));

    if (!workspace) {
      throw new ORPCError("NOT_FOUND", { message: "Invite not found" });
    }

    // Already a member? The invite is obsolete — consume it and report
    // "alreadyMember" so the client redirects them normally.
    const [existingMember] = await db
      .select({ id: workspaceMemberTable.id })
      .from(workspaceMemberTable)
      .where(
        and(
          eq(workspaceMemberTable.workspaceId, workspace.id),
          eq(workspaceMemberTable.userId, user.id),
        ),
      );

    if (existingMember) {
      // Delete the invite (the idempotency cleanup) and let the caller
      // treat the user as having joined.
      await db
        .delete(workspaceInviteTable)
        .where(eq(workspaceInviteTable.id, invite.id));

      return { alreadyMember: true as const, workspace };
    }

    // Parse the invite's stored role at the boundary (defense in
    // depth against corrupted values reaching members).
    const role = parseWorkspaceRole(invite.role);
    if (!role) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `Stored invite role "${invite.role}" is not a valid role`,
      });
    }

    // Membership creation + invite consumption are atomic: a token can
    // never join twice.
    return await db.transaction(async (tx) => {
      // Insert the membership conferring the invited role. The unique
      // (workspaceId, userId) index backs this up against races.
      await tx.insert(workspaceMemberTable).values({
        id: uuidv7(),
        workspaceId: workspace.id,
        userId: user.id,
        role,
      });

      // Consume the invite: the link "burns" after a successful join
      // (safer than leaving reusable join links around).
      await tx
        .delete(workspaceInviteTable)
        .where(eq(workspaceInviteTable.id, invite.id));

      // Caller redirects to the workspace they just joined.
      return { alreadyMember: false as const, workspace };
    });
  });
