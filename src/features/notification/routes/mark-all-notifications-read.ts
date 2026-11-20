import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { notificationService } from "../services/notification-service";

export const markAllNotificationsRead = authProcedure.handler(
  async ({ context }) => {
    const user = requireUser(context.user);
    return await notificationService.markAllRead(user.id);
  },
);
