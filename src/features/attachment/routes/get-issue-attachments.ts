import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { getIssueAttachmentsSchema } from "../schemas";
import { attachmentService } from "../services/attachment-service";

// Returns every attachment for one issue.
export const getIssueAttachments = authProcedure
  .input(getIssueAttachmentsSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await attachmentService.getIssueAttachments(user.id, input);
  });
