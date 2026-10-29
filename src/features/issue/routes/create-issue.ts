import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { createIssueSchema } from "../schemas";
import { issueService } from "../services/issue-service";

/**
 * Controller procedure for creating a new issue within a project.
 */
export const createIssue = authProcedure
  .input(createIssueSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await issueService.createIssue(user.id, input);
  });
