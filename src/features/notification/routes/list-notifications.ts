import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { listNotificationsSchema } from "../schemas";
import { notificationService } from "../services/notification-service";

// Route wrapper: validate input, check login, then call the service.
export const listNotifications = authProcedure
  .input(listNotificationsSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);
    return await notificationService.listNotifications(user.id, input);
  });
