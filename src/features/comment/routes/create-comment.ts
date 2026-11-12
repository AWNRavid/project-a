import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { createCommentSchema } from "../schemas";
import { commentService } from "../services/comment-service";

export const createComment = authProcedure
  .input(createCommentSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await commentService.createComment(user.id, input);
  });
