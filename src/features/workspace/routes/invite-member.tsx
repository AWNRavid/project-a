// Invites a person (by email) into a workspace. Creates an invite
// row with an unguessable token and emails them a join link.
import { createDrizzleConnection } from "@/db/drizzle/connection";
import {
  userTable,
  workspaceInviteTable,
  workspaceMemberTable,
  workspaceTable,
} from "@/db/drizzle/schema";
import {
  inviteEmailSchema,
  invitedRoleSchema,
} from "@/features/workspace/schemas";
import type { WorkspaceRole } from "@/features/workspace/types";
import {
  buildInviteUrl,
  createInviteToken,
  getInviteExpiry,
} from "@/features/workspace/utils/invite";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { sendEmail } from "@/lib/email/send-email";
import { WorkspaceInviteEmail } from "@/lib/email/templates/workspace-invite";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import * as z from "zod";

// Roles allowed to send invites — workspace management is owner/admin
// territory (same rule as the other workspace management routes).
const INVITE_SENDER_ROLES: readonly WorkspaceRole[] = ["owner", "admin"];

// Workspace ID targets the invite; the role schema deliberately
// excludes "owner" so ownership can never be offered via an invite.
const inviteMemberSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  email: inviteEmailSchema,
  role: invitedRoleSchema,
});

export const inviteMember = authProcedure
  .input(inviteMemberSchema)
  .handler(async ({ context, input }) => {
    // The signed-in sender (their name is shown in the email).
    const inviter = requireUser(context.user);
    const db = createDrizzleConnection();

    // Guard: only owner/admin may send invites from this workspace.
    await requireWorkspaceRole(
      inviter.id,
      input.workspaceId,
      INVITE_SENDER_ROLES,
    );

    // A person already in the workspace does not need an invite —
    // sending one would be confusing (accepting it does nothing).
    const [existingMember] = await db
      .select({ id: workspaceMemberTable.id })
      .from(workspaceMemberTable)
      // Join users by their email because members login first, the
      // invite only carries the raw email.
      .innerJoin(userTable, eq(workspaceMemberTable.userId, userTable.id))
      .where(
        and(
          eq(workspaceMemberTable.workspaceId, input.workspaceId),
          eq(userTable.email, input.email),
        ),
      );

    if (existingMember) {
      throw new ORPCError("CONFLICT", {
        message: `${input.email} is already a member of this workspace`,
      });
    }

    // One pending invite per email per workspace (also backed by a
    // DB unique index). Offer resend/cancel instead.
    const [existingInvite] = await db
      .select({ id: workspaceInviteTable.id })
      .from(workspaceInviteTable)
      .where(
        and(
          eq(workspaceInviteTable.workspaceId, input.workspaceId),
          eq(workspaceInviteTable.email, input.email),
        ),
      );

    if (existingInvite) {
      throw new ORPCError("CONFLICT", {
        message: `A pending invitation for ${input.email} already exists — resend or cancel it from the settings page`,
      });
    }

    // Workspace display name used in the email copy; existence is
    // already guaranteed by the membership FK.
    const [workspace] = await db
      .select({ name: workspaceTable.name })
      .from(workspaceTable)
      .where(eq(workspaceTable.id, input.workspaceId));

    if (!workspace) {
      // Effectively unreachable (membership implies workspace), kept
      // for exhaustiveness.
      throw new ORPCError("NOT_FOUND", { message: "Workspace not found" });
    }

    // Persist the invite BEFORE sending, so the token exists in the
    // DB exactly once with its row as the source of truth.
    const [invite] = await db
      .insert(workspaceInviteTable)
      .values({
        id: uuidv7(),
        workspaceId: input.workspaceId,
        email: input.email,
        role: input.role,
        token: createInviteToken(),
        // Sender reference; the email joins by it to show the name.
        invitedById: inviter.id,
        expiresAt: getInviteExpiry(),
      })
      .returning();

    try {
      // Deliver the email; react-email renders the React template.
      await sendEmail({
        to: invite.email,
        subject: `You're invited to join "${workspace.name}" on Trackr`,
        react: (
          <WorkspaceInviteEmail
            inviterName={inviter.name}
            workspaceName={workspace.name}
            inviteUrl={buildInviteUrl(invite.token)}
            expiresAt={invite.expiresAt}
          />
        ),
      });

      // Success: caller gets the pending invite for immediate UI.
      return invite;
    } catch (error) {
      // The email IS the invite deliverable; when sending fails,
      // remove the row so a retry does not hit the duplicate-pending
      // error. Best-effort cleanup, then re-throw for the toast.
      await db
        .delete(workspaceInviteTable)
        .where(eq(workspaceInviteTable.id, invite.id))
        .catch(() => undefined);
      throw error;
    }
  });
