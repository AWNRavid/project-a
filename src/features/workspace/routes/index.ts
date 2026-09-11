// Workspace feature router. Each key maps to an oRPC route file in
// this folder; the object is merged into the global router in
// src/lib/orpc/router.ts, which exposes e.g.
// orpcClient.workspace.createWorkspace on the client.
import { createWorkspace } from "@/features/workspace/routes/create-workspace";
import { listWorkspaces } from "@/features/workspace/routes/list-workspaces";
import { updateWorkspace } from "@/features/workspace/routes/update-workspace";

const workspaceRouter = {
  // All workspaces the current user belongs to (oldest first).
  listWorkspaces,
  // Create a workspace; the creator becomes its owner.
  createWorkspace,
  // Rename a workspace and/or upload/remove its logo (owner/admin).
  updateWorkspace,
};

export default workspaceRouter;
