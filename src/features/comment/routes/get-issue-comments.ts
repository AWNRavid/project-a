import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { getIssueCommentsSchema } from "../schemas";
import { commentService } from "../services/comment-service";

export const getIssueComments = authProcedure
  .input(getIssueCommentsSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await commentService.getIssueComments(user.id, input);
  });
