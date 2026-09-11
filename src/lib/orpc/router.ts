// Global oRPC router. Features register their route objects here as
// one key per feature folder; the shape of this object IS the
// client-side API surface (orpcClient.<feature>.<route>), and the
// exported Router type drives end-to-end type inference.
import postRouter from "@/features/EXAMPLE-post/routes";
// Workspace routes (create/list/update) added for the workspace
// feature.
import workspaceRouter from "@/features/workspace/routes";

export const router = {
  post: postRouter,
  workspace: workspaceRouter,
};

// Type export used by clients (React components) and the server-side
// client to keep every call type-safe.
export type Router = typeof router;
