import { getIssueActivities } from "./get-issue-activities";

// Router keys become the client API: orpcClient.activity.<name>(...)
const activityRouter = {
  getIssueActivities,
};

export default activityRouter;
