import { createComment } from "./create-comment";
import { deleteComment } from "./delete-comment";
import { getIssueComments } from "./get-issue-comments";

const commentRouter = {
  createComment,
  getIssueComments,
  deleteComment,
};

export default commentRouter;
