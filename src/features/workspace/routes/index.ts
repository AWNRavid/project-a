// Workspace feature router. Each key maps to an oRPC route file in
// this folder; the object is merged into the global router in
// src/lib/orpc/router.ts, which exposes e.g.
// orpcClient.workspace.createWorkspace on the client.
import { acceptInvite } from "@/features/workspace/routes/accept-invite";
import { cancelInvite } from "@/features/workspace/routes/cancel-invite";
import { createWorkspace } from "@/features/workspace/routes/create-workspace";
import { getInvite } from "@/features/workspace/routes/get-invite";
import { inviteMember } from "@/features/workspace/routes/invite-member";
import { listInvites } from "@/features/workspace/routes/list-invites";
import { listWorkspaces } from "@/features/workspace/routes/list-workspaces";
import { resendInvite } from "@/features/workspace/routes/resend-invite";
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
};

export default workspaceRouter;
