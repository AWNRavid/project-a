import { createLabel } from "./create-label";
import { deleteLabel } from "./delete-label";
import { listLabels } from "./list-labels";
import { setIssueLabels } from "./set-issue-labels";
import { updateLabel } from "./update-label";

const labelRouter = {
  listLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  setIssueLabels,
};

export default labelRouter;
