import { createWorkspace } from "@/features/workspace/routes/create-workspace";
import { listWorkspaces } from "@/features/workspace/routes/list-workspaces";
import { updateWorkspace } from "@/features/workspace/routes/update-workspace";

const workspaceRouter = {
  listWorkspaces,
  createWorkspace,
  updateWorkspace,
};

export default workspaceRouter;
