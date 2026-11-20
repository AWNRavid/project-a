import { notificationService } from "@/features/notification/services/notification-service";

/**
 * Deletes read notifications past the retention window. Intended for
 * an external scheduler (cron, systemd timer, container job):
 * `pnpm notifications:purge`.
 */
async function main() {
  const { deleted } = await notificationService.purgeReadNotifications();
  console.log(`Purged ${deleted} read notification(s).`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
