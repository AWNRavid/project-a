import * as z from "zod";

/**
 * Shared, client-safe workspace schemas and constants. This file must
 * not import server-only modules (sharp, S3) so client components can
 * validate files before sending them through oRPC.
 */

export const WORKSPACE_NAME_MAX_LENGTH = 80;

export const WORKSPACE_LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB pre-compression

export const SUPPORTED_LOGO_IMAGE_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Workspace name is required")
  .max(
    WORKSPACE_NAME_MAX_LENGTH,
    `Workspace name is too long (max ${WORKSPACE_NAME_MAX_LENGTH} characters)`,
  );

export const workspaceLogoSchema = z
  .instanceof(File, { error: "Logo must be a file" })
  .refine((file) => file.size > 0, "Logo file is empty")
  .refine(
    (file) => file.size <= WORKSPACE_LOGO_MAX_BYTES,
    "Logo must be smaller than 2MB",
  )
  .refine(
    (file) => SUPPORTED_LOGO_IMAGE_TYPES.includes(file.type),
    "Logo must be a PNG, JPEG, WebP, GIF, or SVG image",
  );
