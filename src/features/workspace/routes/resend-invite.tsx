// Re-sends the email for a pending workspace invite. Keeps the same
// token (an already-sent link stays valid) unless the invite has
// expired, in which case the token is regenerated and the expiry
// extended.
import { createDrizzleConnection } from "@/db/drizzle/connection";
import { workspaceInviteTable, workspaceTable } from "@/db/drizzle/schema";
import {
  buildInviteUrl,
  createInviteToken,
  getInviteExpiry,
  isInviteExpired,
} from "@/features/workspace/utils/invite";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { sendEmail } from "@/lib/email/send-email";
import { WorkspaceInviteEmail } from "@/lib/email/templates/workspace-invite";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as z from "zod";

// Roles allowed to resend invites — managed by the same managers as
// cancel/invite (owner/admin).
const INVITE_MANAGER_ROLES = ["owner", "admin"] as const;

// Addressed by id, like cancel — the entry may come from the list UI.
const resendInviteSchema = z.object({
  inviteId: z.string().min(1, "Invite ID is required"),
});

export const resendInvite = authProcedure
  .input(resendInviteSchema)
  .handler(async ({ context, input }) => {
    // The resender's name is re-shown in the email ("X invited you...").
    const sender = requireUser(context.user);
    const db = createDrizzleConnection();

    // Load the full pending invite we are about to (re)send.
    const [invite] = await db
      .select()
      .from(workspaceInviteTable)
      .where(eq(workspaceInviteTable.id, input.inviteId));

    if (!invite) {
      throw new ORPCError("NOT_FOUND", { message: "Invite not found" });
    }

    // Guard against the invite's own workspace so managers of other
    // workspaces (or users with stale ids) cannot touch this row.
    await requireWorkspaceRole(
      sender.id,
      invite.workspaceId,
      INVITE_MANAGER_ROLES,
    );

    // Workspace display name for the email copy.
    const [workspace] = await db
      .select({ name: workspaceTable.name })
      .from(workspaceTable)
      .where(eq(workspaceTable.id, invite.workspaceId));

    if (!workspace) {
      // Effectively unreachable (workspace FK), kept for type narrowing.
      throw new ORPCError("NOT_FOUND", { message: "Workspace not found" });
    }

    // Expired invites get a fresh token + extended window; still-valid
    // ones keep their token so any earlier email link keeps working.
    const isExpired = isInviteExpired(invite.expiresAt);
    const token = isExpired ? createInviteToken() : invite.token;
    const expiresAt = isExpired ? getInviteExpiry() : invite.expiresAt;

    if (isExpired) {
      // Persist the renewed token/expiry before sending.
      await db
        .update(workspaceInviteTable)
        .set({ token, expiresAt })
        .where(eq(workspaceInviteTable.id, invite.id));
    }

    // Re-render and send the invite email with the (possibly renewed)
    // join link.
    await sendEmail({
      to: invite.email,
      subject: `Reminder: you're invited to join "${workspace.name}" on Trackr`,
      react: (
        <WorkspaceInviteEmail
          inviterName={sender.name}
          workspaceName={workspace.name}
          inviteUrl={buildInviteUrl(token)}
          expiresAt={expiresAt}
        />
      ),
    });

    // Return the (possibly renewed) invite for immediate UI refresh.
    return { ...invite, token, expiresAt };
  });
