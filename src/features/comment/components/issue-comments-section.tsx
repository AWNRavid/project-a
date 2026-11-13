"use client";

import { authClient } from "@/lib/auth/client";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareIcon } from "lucide-react";
import { toast } from "sonner";
import { CommentEditor } from "./comment-editor";
import { CommentItem } from "./comment-item";

interface IssueCommentsSectionProps {
  issueId: string;
}

export function IssueCommentsSection({ issueId }: IssueCommentsSectionProps) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  const commentsQueryOptions =
    orpcTanstackQueryUtils.comment.getIssueComments.queryOptions({
      input: { issueId },
    });

  const { data: comments = [], isLoading } = useQuery(commentsQueryOptions);

  const createCommentMutation = useMutation({
    mutationFn: async (body: string) => {
      return await orpcClient.comment.createComment({
        issueId,
        body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentsQueryOptions.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey:
          orpcTanstackQueryUtils.activity.getIssueActivities.queryOptions({
            input: { issueId },
          }).queryKey,
      });
      toast.success("Comment added");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to post comment");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await orpcClient.comment.deleteComment({
        commentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentsQueryOptions.queryKey,
      });
      toast.success("Comment deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete comment");
    },
  });

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2">
        <MessageSquareIcon className="text-muted-foreground size-4" />
        <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          Comments ({comments.length})
        </h4>
      </div>

      {/* Comment List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-muted-foreground py-4 text-center text-xs">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground text-xs italic">
            No comments yet. Leave a comment below.
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onDelete={(id) => deleteCommentMutation.mutate(id)}
              isDeleting={deleteCommentMutation.isPending}
            />
          ))
        )}
      </div>

      {/* Rich Text Editor */}
      <div className="pt-2">
        <CommentEditor
          onSubmit={async (html) => {
            await createCommentMutation.mutateAsync(html);
          }}
          isSubmitting={createCommentMutation.isPending}
        />
      </div>
    </div>
  );
}
