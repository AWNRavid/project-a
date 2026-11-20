import { listNotifications } from "./list-notifications";
import { markAllNotificationsRead } from "./mark-all-notifications-read";
import { markNotificationRead } from "./mark-notification-read";

// Router keys become the client API: orpcClient.notification.<name>(...)
const notificationRouter = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};

export default notificationRouter;
