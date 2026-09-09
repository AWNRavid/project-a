import { compressImageWebp } from "@/lib/media-converter";
import { deleteFile, StorageBucket, uploadFile } from "@/lib/s3-storage";

const WORKSPACE_LOGO_WIDTH = 256;
const WORKSPACE_LOGO_MAX_COMPRESSED_BYTES = 50 * 1024; // 50 KB after compression

/**
 * Builds the public storage path for a workspace logo. A timestamp in
 * the file name keeps replaced logos apart so CDN/browser caches are
 * never served stale content.
 */
export function buildWorkspaceLogoPath(workspaceId: string): string {
  const timestamp = Date.now();
  return `${StorageBucket.PUBLIC}/workspace/${workspaceId}/logo-${timestamp}.webp`;
}

/**
 * Compresses and uploads a workspace logo to the public storage
 * bucket, returning the stored file path.
 */
export async function uploadWorkspaceLogo(
  workspaceId: string,
  file: File,
): Promise<string> {
  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const compressedBuffer = await compressImageWebp({
    buffer: rawBuffer,
    width: WORKSPACE_LOGO_WIDTH,
    maxSize: WORKSPACE_LOGO_MAX_COMPRESSED_BYTES,
  });

  return uploadFile(
    buildWorkspaceLogoPath(workspaceId),
    compressedBuffer,
    "image/webp",
  );
}

/**
 * Deletes a stored workspace logo. Accepts null/undefined so callers
 * can pass the logo column value directly.
 */
export async function deleteWorkspaceLogo(
  logoPath: string | null | undefined,
): Promise<void> {
  if (!logoPath) return;
  await deleteFile(logoPath);
}
