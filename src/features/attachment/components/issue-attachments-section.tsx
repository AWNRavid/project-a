"use client";

import { Button } from "@/components/ui/button";
import {
  ATTACHMENT_MAX_LABEL,
  attachmentFileSchema,
} from "@/features/attachment/schemas";
import { authClient } from "@/lib/auth/client";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DownloadIcon,
  Loader2,
  PaperclipIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

// Converts a byte count into a short, human-friendly label.
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Long file names crowd the download/delete buttons; show a short
// label and keep the full name in the tooltip.
function shortenFilename(filename: string): string {
  return filename.length > 30 ? `${filename.slice(0, 27)}...` : filename;
}

interface IssueAttachmentsSectionProps {
  issueId: string;
}

/**
 * Shows all files attached to an issue and lets the current user
 * upload new files or delete their own.
 */
export function IssueAttachmentsSection({
  issueId,
}: IssueAttachmentsSectionProps) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  // Hidden input is opened by the visible "Upload file" button.
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query options are reused to read data and to invalidate the cache
  // after an upload/delete.
  const attachmentsQueryOptions =
    orpcTanstackQueryUtils.attachment.getIssueAttachments.queryOptions({
      input: { issueId },
    });

  const { data: attachments = [], isLoading } = useQuery(
    attachmentsQueryOptions,
  );

  // Sends one file to the server. The server stores it in MinIO and
  // saves the metadata row.
  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      orpcClient.attachment.uploadAttachment({ issueId, file }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attachmentsQueryOptions.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey:
          orpcTanstackQueryUtils.activity.getIssueActivities.queryOptions({
            input: { issueId },
          }).queryKey,
      });
      toast.success("Attachment uploaded");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload attachment");
    },
  });

  // Removes the file from MinIO and the database.
  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      orpcClient.attachment.deleteAttachment({ attachmentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: attachmentsQueryOptions.queryKey,
      });
      toast.success("Attachment deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete attachment");
    },
  });

  // Runs when the user picks a file. The client validates size/type
  // first so obvious mistakes show a toast without a network request.
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = attachmentFileSchema.safeParse(file);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Invalid file");
      event.target.value = "";
      return;
    }

    uploadMutation.mutate(file, {
      // Clear the input so picking the same file again still triggers
      // an upload.
      onSettled: () => {
        event.target.value = "";
      },
    });
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PaperclipIcon className="text-muted-foreground size-4" />
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Attachments ({attachments.length})
          </h4>
        </div>

        {/* Upload button triggers the hidden file input. */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          disabled={uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <UploadIcon className="size-3.5" />
          )}
          {uploadMutation.isPending ? "Uploading..." : "Upload file"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-2 text-center text-xs">
          Loading attachments...
        </p>
      ) : attachments.length === 0 ? (
        <p className="text-muted-foreground text-xs italic">
          No attachments yet. Upload a file up to {ATTACHMENT_MAX_LABEL}.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((attachment) => {
            const canDelete = attachment.uploadedById === currentUserId;

            return (
              <li
                key={attachment.id}
                className="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50/70 px-2.5 py-2 text-sm dark:border-slate-800/80 dark:bg-slate-900/50"
              >
                <PaperclipIcon className="text-muted-foreground size-3.5 shrink-0" />

                <div className="min-w-0 flex-1">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.filename}
                    className="block truncate font-medium text-slate-900 hover:underline dark:text-slate-100"
                    title={attachment.filename}
                  >
                    {shortenFilename(attachment.filename)}
                  </a>
                  <p className="text-muted-foreground text-[11px]">
                    {formatFileSize(attachment.size)} ·{" "}
                    {attachment.uploaderName ??
                      attachment.uploaderEmail ??
                      "Member"}
                  </p>
                </div>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-7 w-7 p-0"
                  title="Download"
                >
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.filename}
                  >
                    <DownloadIcon className="size-3.5" />
                  </a>
                </Button>

                {canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hover:text-destructive text-muted-foreground h-7 w-7 p-0"
                    disabled={deleteMutation.isPending}
                    title="Delete attachment"
                    onClick={() => deleteMutation.mutate(attachment.id)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
