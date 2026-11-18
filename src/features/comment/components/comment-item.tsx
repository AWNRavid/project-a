"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import type { CommentWithAuthor } from "../types";

interface CommentItemProps {
  comment: CommentWithAuthor;
  currentUserId?: string;
  canDelete?: boolean;
  onDelete?: (commentId: string) => void;
  isDeleting?: boolean;
}

export function CommentItem({
  comment,
  currentUserId,
  canDelete = false,
  onDelete,
  isDeleting = false,
}: CommentItemProps) {
  const formatDate = (date: Date): string => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isAuthor = currentUserId === comment.authorId;
  const showDelete = Boolean(onDelete && (isAuthor || canDelete));

  const initials = (comment.authorName ?? comment.authorEmail ?? "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="group flex gap-3 text-sm">
      <Avatar className="mt-0.5 size-7 shrink-0">
        {comment.authorImage ? (
          <AvatarImage
            src={comment.authorImage}
            alt={comment.authorName ?? "Avatar"}
          />
        ) : null}
        <AvatarFallback className="text-[11px] font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {comment.authorName ?? comment.authorEmail ?? "Member"}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          {showDelete && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => onDelete(comment.id)}
              className="hover:text-destructive text-muted-foreground h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              title="Delete comment"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          )}
        </div>

        <div
          className="comment-content border-border bg-muted/40 rounded-[2px] border p-3 text-[13px]"
          dangerouslySetInnerHTML={{ __html: comment.body }}
        />
      </div>
    </div>
  );
}
