import { z } from "zod";

// Maximum file size accepted before upload. 10 MB is enough for
// screenshots, PDFs, and small documents without letting a single
// request become too heavy for the server.
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

// Human-readable limit reused by the UI ("Max 10 MB").
export const ATTACHMENT_MAX_LABEL = "10 MB";

// Validation rules shared by the browser and the server. The browser
// checks first for a fast error message; the server checks again
// because client-side validation can be bypassed.
export const attachmentFileSchema = z
  .instanceof(File, { error: "Attachment must be a file" })
  .refine((file) => file.size > 0, "Attachment file is empty")
  .refine(
    (file) => file.size <= ATTACHMENT_MAX_BYTES,
    `Attachment must be smaller than ${ATTACHMENT_MAX_LABEL}`,
  );

// Upload needs the target issue and one file.
export const uploadAttachmentSchema = z.object({
  issueId: z.string().uuid("Invalid issue ID format"),
  file: attachmentFileSchema,
});

// Listing only needs the issue ID.
export const getIssueAttachmentsSchema = z.object({
  issueId: z.string().uuid("Invalid issue ID format"),
});

// Deleting needs the attachment ID.
export const deleteAttachmentSchema = z.object({
  attachmentId: z.string().uuid("Invalid attachment ID format"),
});
