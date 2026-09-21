// Workspace feature router. Each key maps to an oRPC route file in
// this folder; the object is merged into the global router in
// src/lib/orpc/router.ts, which exposes e.g.
// orpcClient.workspace.createWorkspace on the client.
import { acceptInvite } from "@/features/workspace/routes/accept-invite";
import { cancelInvite } from "@/features/workspace/routes/cancel-invite";
import { createWorkspace } from "@/features/workspace/routes/create-workspace";
import { deleteWorkspace } from "@/features/workspace/routes/delete-workspace";
import { getInvite } from "@/features/workspace/routes/get-invite";
import { inviteMember } from "@/features/workspace/routes/invite-member";
import { leaveWorkspace } from "@/features/workspace/routes/leave-workspace";
import { listInvites } from "@/features/workspace/routes/list-invites";
import { listMembers } from "@/features/workspace/routes/list-members";
import { listWorkspaces } from "@/features/workspace/routes/list-workspaces";
import { removeMember } from "@/features/workspace/routes/remove-member";
import { resendInvite } from "@/features/workspace/routes/resend-invite";
import { transferOwnership } from "@/features/workspace/routes/transfer-ownership";
import { updateMemberRole } from "@/features/workspace/routes/update-member-role";
import { updateWorkspace } from "@/features/workspace/routes/update-workspace";

const workspaceRouter = {
  // Workspaces the current user belongs to (oldest first).
  listWorkspaces,
  // Create a workspace; the creator becomes its owner.
  createWorkspace,
  // Rename a workspace and/or upload/remove its logo (owner/admin).
  updateWorkspace,
  // Email an invite (owner/admin); creates a pending workspace_invite.
  inviteMember,
  // Pending, unexpired invites of a workspace (owner/admin).
  listInvites,
  // Delete a pending invite (owner/admin).
  cancelInvite,
  // Re-send a pending invite email; renew if expired (owner/admin).
  resendInvite,
  // Public pre-auth preview of an invite by token.
  getInvite,
  // Consume an invite: create the membership (must be logged in as
  // the invited email, invite unexpired).
  acceptInvite,
  // All members of a workspace (any member may view).
  listMembers,
  // Change a member's role to member/admin (owner/admin; never from
  // or to "owner").
  updateMemberRole,
  // Remove a member (owner/admin; owners unremovable, not self).
  removeMember,
  // Make another member the owner; ex-owner becomes admin (owner).
  transferOwnership,
  // Leave the workspace (any member except the owner).
  leaveWorkspace,
  // Delete the workspace with all memberships/invites (owner).
  deleteWorkspace,
};

export default workspaceRouter;
