import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { deleteIssueSchema } from "../schemas";
import { issueService } from "../services/issue-service";

/**
 * Controller procedure for deleting an issue by ID.
 */
export const deleteIssue = authProcedure
  .input(deleteIssueSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await issueService.deleteIssue(user.id, input.issueId);
  });
