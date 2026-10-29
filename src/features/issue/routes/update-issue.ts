import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { updateIssueSchema } from "../schemas";
import { issueService } from "../services/issue-service";

/**
 * Controller procedure for modifying an existing issue.
 */
export const updateIssue = authProcedure
  .input(updateIssueSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await issueService.updateIssue(user.id, input);
  });
