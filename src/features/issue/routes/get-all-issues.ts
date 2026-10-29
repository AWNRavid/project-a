import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { getAllIssuesSchema } from "../schemas";
import { issueService } from "../services/issue-service";

/**
 * Controller procedure for querying and filtering issues within a project.
 */
export const getAllIssues = authProcedure
  .input(getAllIssuesSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await issueService.listIssues(user.id, input);
  });
