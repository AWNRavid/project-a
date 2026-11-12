import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { deleteAttachmentSchema } from "../schemas";
import { attachmentService } from "../services/attachment-service";

// Removes one attachment (database row + MinIO object).
export const deleteAttachment = authProcedure
  .input(deleteAttachmentSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await attachmentService.deleteAttachment(user.id, input);
  });
