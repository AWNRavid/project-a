import * as z from "zod";

/**
 * Shared, client-safe workspace schemas and constants. This file must
 * not import server-only modules (sharp, S3) so client components can
 * validate files before sending them through oRPC.
 */

// Practical cap for a human-entered workspace name: generous for
// display while keeping forms (and future URL segments) tidy.
export const WORKSPACE_NAME_MAX_LENGTH = 80;

// Hard cap on the upload BEFORE server-side compression: generous
// enough for photos, small enough to keep request payloads sane.
export const WORKSPACE_LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB pre-compression

// Formats sharp can reliably rasterize into WebP. Declared as plain
// strings so `.includes()` works against `File.type`.
export const SUPPORTED_LOGO_IMAGE_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

// Name rules shared by the create/update routes and the client forms:
// trimmed, non-empty, and capped for sane display.
export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Workspace name is required")
  .max(
    WORKSPACE_NAME_MAX_LENGTH,
    `Workspace name is too long (max ${WORKSPACE_NAME_MAX_LENGTH} characters)`,
  );

// Logo rules shared by client and server: must be an actual browser
// File, non-empty, at most 2MB, and in a supported image format. The
// client validates early (toast), the server enforces authoritatively.
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
