import { createIssue } from "./create-issue";
import { deleteIssue } from "./delete-issue";
import { getAllIssues } from "./get-all-issues";
import { getIssue } from "./get-issue";
import { updateIssue } from "./update-issue";

const issueRouter = {
  createIssue,
  getAllIssues,
  getIssue,
  updateIssue,
  deleteIssue,
};

export default issueRouter;
