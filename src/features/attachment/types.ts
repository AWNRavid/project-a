import type { attachmentTable } from "@/db/drizzle/schema";
import type { z } from "zod";
import type {
  deleteAttachmentSchema,
  getIssueAttachmentsSchema,
  uploadAttachmentSchema,
} from "./schemas";

// Raw database row shape for an attachment.
export type Attachment = typeof attachmentTable.$inferSelect;

// Attachment data plus uploader details and a ready-to-use URL.
// The URL is either public or presigned (temporary) depending on the
// storage bucket.
export interface AttachmentWithUploader {
  id: string;
  issueId: string;
  uploadedById: string;
  uploaderName: string | null;
  uploaderEmail: string | null;
  uploaderImage: string | null;
  filename: string;
  contentType: string;
  url: string;
  size: number;
  createdAt: Date;
}

// Input types inferred from the Zod schemas so routes and services
// always agree on the payload shape.
export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;
export type GetIssueAttachmentsInput = z.infer<
  typeof getIssueAttachmentsSchema
>;
export type DeleteAttachmentInput = z.infer<typeof deleteAttachmentSchema>;
