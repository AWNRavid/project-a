// Returns the live (pending, unexpired) invites of a workspace.
import { createDrizzleConnection } from "@/db/drizzle/connection";
import { userTable, workspaceInviteTable } from "@/db/drizzle/schema";
import { parseWorkspaceRole } from "@/features/workspace/types";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { ORPCError } from "@orpc/server";
import { and, desc, eq, gt } from "drizzle-orm";
import * as z from "zod";

// Who may view pending invites — same managers as cancel/resend.
const INVITE_MANAGER_ROLES = ["owner", "admin"] as const;

// Workspace targeted by the listing.
const listInvitesSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const listInvites = authProcedure
  .input(listInvitesSchema)
  .handler(async ({ context, input }) => {
    const user = requireUser(context.user);
    const db = createDrizzleConnection();

    // Guard: only owner/admin may inspect the workspace invite set.
    await requireWorkspaceRole(
      user.id,
      input.workspaceId,
      INVITE_MANAGER_ROLES,
    );

    // Join the inviter's user row so the UI can show who invited who.
    const invites = await db
      .select({
        id: workspaceInviteTable.id,
        email: workspaceInviteTable.email,
        role: workspaceInviteTable.role,
        createdAt: workspaceInviteTable.createdAt,
        expiresAt: workspaceInviteTable.expiresAt,
        invitedByName: userTable.name,
      })
      .from(workspaceInviteTable)
      .innerJoin(userTable, eq(workspaceInviteTable.invitedById, userTable.id))
      // Pending in real time: bound to this workspace and not yet
      // expired (expired rows linger until accepted/cancelled; they
      // simply become invisible here).
      .where(
        and(
          eq(workspaceInviteTable.workspaceId, input.workspaceId),
          gt(workspaceInviteTable.expiresAt, new Date()),
        ),
      )
      // Newest invites first — matches invite-dialog recency UX.
      .orderBy(desc(workspaceInviteTable.createdAt));

    // Parse the raw role text at the boundary; corrupted rows fail
    // loudly instead of silently disappearing (consistent with
    // listWorkspaces).
    return {
      invites: await Promise.all(
        invites.map(async (invite) => {
          const role = parseWorkspaceRole(invite.role);
          if (!role) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", {
              message: `Stored invite role "${invite.role}" is not a valid role`,
            });
          }
          // Shape consumed by the pending-invites list component.
          return { ...invite, role };
        }),
      ),
    };
  });
