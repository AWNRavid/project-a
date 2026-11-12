import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { uploadAttachmentSchema } from "../schemas";
import { attachmentService } from "../services/attachment-service";

// Route wrapper: check login, validate input, then call the service.
export const uploadAttachment = authProcedure
  .input(uploadAttachmentSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await attachmentService.uploadAttachment(user.id, input);
  });
