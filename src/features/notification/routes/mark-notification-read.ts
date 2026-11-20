import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { markNotificationReadSchema } from "../schemas";
import { notificationService } from "../services/notification-service";

// Route wrapper: validate input, check login, then call the service.
export const markNotificationRead = authProcedure
  .input(markNotificationReadSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await notificationService.markRead(user.id, input);
  });
