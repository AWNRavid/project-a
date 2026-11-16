import { db } from "@/db/drizzle/connection";
import {
  attachmentTable,
  issueTable,
  projectTable,
  userTable,
} from "@/db/drizzle/schema";
import { recordActivities } from "@/features/activity/services/activity-service";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import {
  deleteFile,
  getFileUrl,
  StorageBucket,
  uploadFile,
} from "@/lib/s3-storage";
import { ORPCError } from "@orpc/server";
import { randomUUID } from "crypto";
import { asc, eq } from "drizzle-orm";
import type {
  AttachmentWithUploader,
  DeleteAttachmentInput,
  GetIssueAttachmentsInput,
  UploadAttachmentInput,
} from "../types";

/**
 * Turns any user-supplied file name into something safe to use as an
 * object key in MinIO. We keep letters, numbers, dots, dashes, and
 * underscores; everything else becomes "_".
 */
function toSafeFilename(filename: string): string {
  const safe = filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(-120);

  return safe || "file";
}

/**
 * Builds the full MinIO path for a new attachment. Example:
 * "private-data/attachment/<issueId>/<uuid>-screenshot.png".
 *
 * The random UUID prevents two files with the same name from
 * overwriting each other.
 */
function buildAttachmentPath(issueId: string, filename: string): string {
  return `${StorageBucket.PRIVATE}/attachment/${issueId}/${randomUUID()}-${toSafeFilename(filename)}`;
}

export class AttachmentService {
  /**
   * Checks that the issue exists and that the user belongs to the
   * workspace that owns the issue. Returns the workspace ID for
   * callers that need it (for example, admin-only checks).
   */
  private async requireIssueAccess(
    userId: string,
    issueId: string,
  ): Promise<string> {
    // Join issue -> project so we can read the workspace ID.
    const [issue] = await db
      .select({
        id: issueTable.id,
        workspaceId: projectTable.workspaceId,
      })
      .from(issueTable)
      .innerJoin(projectTable, eq(issueTable.projectId, projectTable.id))
      .where(eq(issueTable.id, issueId))
      .limit(1);

    if (!issue) {
      throw new ORPCError("NOT_FOUND", { message: "Issue not found" });
    }

    // Any workspace member (owner, admin, member) may upload and view.
    await requireWorkspaceRole(userId, issue.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    return issue.workspaceId;
  }

  /**
   * Uploads a file to MinIO, then saves its metadata in the database.
   * If saving metadata fails, the uploaded file is removed again so no
   * unused object is left in storage.
   */
  async uploadAttachment(
    userId: string,
    input: UploadAttachmentInput,
  ): Promise<AttachmentWithUploader> {
    await this.requireIssueAccess(userId, input.issueId);

    // 1. Put the file bytes into the private MinIO bucket.
    const storagePath = await uploadFile(
      buildAttachmentPath(input.issueId, input.file.name),
      input.file,
      // Fall back to a generic type when the browser sends none.
      input.file.type || "application/octet-stream",
    );

    try {
      // 2. Save the metadata row and its activity entry together.
      const created = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(attachmentTable)
          .values({
            issueId: input.issueId,
            uploadedById: userId,
            filename: input.file.name,
            contentType: input.file.type || "application/octet-stream",
            url: storagePath,
            size: input.file.size,
          })
          .returning();

        if (!row) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to save attachment",
          });
        }

        await recordActivities(tx, input.issueId, userId, [
          {
            type: "attachment_added",
            payload: { filename: row.filename },
          },
        ]);

        return row;
      });

      // 3. Load uploader details for the UI.
      const [uploader] = await db
        .select({
          name: userTable.name,
          email: userTable.email,
          image: userTable.image,
        })
        .from(userTable)
        .where(eq(userTable.id, userId))
        .limit(1);

      return {
        id: created.id,
        issueId: created.issueId,
        uploadedById: created.uploadedById,
        uploaderName: uploader?.name ?? null,
        uploaderEmail: uploader?.email ?? null,
        uploaderImage: uploader?.image ?? null,
        filename: created.filename,
        contentType: created.contentType,
        // Private files get a temporary presigned URL.
        url: (await getFileUrl(created.url)) ?? "",
        size: created.size,
        createdAt: created.createdAt,
      };
    } catch (error) {
      // Metadata insert failed: remove the orphaned file.
      await deleteFile(storagePath).catch(() => undefined);
      throw error;
    }
  }

  /**
   * Lists all attachments of an issue, oldest first. Each stored path
   * is converted into a URL the browser can open (presigned for the
   * private bucket).
   */
  async getIssueAttachments(
    userId: string,
    input: GetIssueAttachmentsInput,
  ): Promise<AttachmentWithUploader[]> {
    await this.requireIssueAccess(userId, input.issueId);

    const rows = await db
      .select({
        id: attachmentTable.id,
        issueId: attachmentTable.issueId,
        uploadedById: attachmentTable.uploadedById,
        uploaderName: userTable.name,
        uploaderEmail: userTable.email,
        uploaderImage: userTable.image,
        filename: attachmentTable.filename,
        contentType: attachmentTable.contentType,
        storagePath: attachmentTable.url,
        size: attachmentTable.size,
        createdAt: attachmentTable.createdAt,
      })
      .from(attachmentTable)
      .innerJoin(userTable, eq(attachmentTable.uploadedById, userTable.id))
      .where(eq(attachmentTable.issueId, input.issueId))
      .orderBy(asc(attachmentTable.createdAt));

    return Promise.all(
      rows.map(async ({ storagePath, ...row }) => ({
        ...row,
        url: (await getFileUrl(storagePath)) ?? "",
      })),
    );
  }

  /**
   * Deletes an attachment row and its file in MinIO. The uploader may
   * delete their own file; other users need to be workspace admin or
   * owner.
   */
  async deleteAttachment(
    userId: string,
    input: DeleteAttachmentInput,
  ): Promise<{ success: boolean }> {
    const [existing] = await db
      .select({
        id: attachmentTable.id,
        uploadedById: attachmentTable.uploadedById,
        storagePath: attachmentTable.url,
        workspaceId: projectTable.workspaceId,
      })
      .from(attachmentTable)
      .innerJoin(issueTable, eq(attachmentTable.issueId, issueTable.id))
      .innerJoin(projectTable, eq(issueTable.projectId, projectTable.id))
      .where(eq(attachmentTable.id, input.attachmentId))
      .limit(1);

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Attachment not found" });
    }

    // Uploaders can remove their own attachment. Everyone else must be
    // an admin/owner of the workspace.
    if (existing.uploadedById !== userId) {
      await requireWorkspaceRole(userId, existing.workspaceId, [
        "admin",
        "owner",
      ]);
    }

    await db
      .delete(attachmentTable)
      .where(eq(attachmentTable.id, input.attachmentId));

    // Best effort: if removing the object fails, the database row is
    // already gone and the user still sees a successful delete. The
    // leftover object can be cleaned up later.
    await deleteFile(existing.storagePath).catch(() => undefined);

    return { success: true };
  }
}

export const attachmentService = new AttachmentService();
