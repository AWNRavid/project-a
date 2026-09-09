import postRouter from "@/features/EXAMPLE-post/routes";
import workspaceRouter from "@/features/workspace/routes";

export const router = {
  post: postRouter,
  workspace: workspaceRouter,
};

export type Router = typeof router;
