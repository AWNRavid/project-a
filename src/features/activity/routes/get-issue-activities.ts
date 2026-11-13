import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { getIssueActivitiesSchema } from "../schemas";
import { activityService } from "../services/activity-service";

// Route wrapper: validate input, check login, then call the service.
export const getIssueActivities = authProcedure
  .input(getIssueActivitiesSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await activityService.getIssueActivities(user.id, input);
  });
