import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { getIssueSchema } from "../schemas";
import { issueService } from "../services/issue-service";

/**
 * Controller procedure for retrieving single issue details by ID.
 */
export const getIssue = authProcedure
  .input(getIssueSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await issueService.getIssueById(user.id, input.issueId);
  });
