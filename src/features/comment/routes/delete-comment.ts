import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { deleteCommentSchema } from "../schemas";
import { commentService } from "../services/comment-service";

export const deleteComment = authProcedure
  .input(deleteCommentSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await commentService.deleteComment(user.id, input);
  });
