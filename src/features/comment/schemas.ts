import { z } from "zod";

export const createCommentSchema = z.object({
  issueId: z.uuid("Invalid issue ID format"),
  body: z.string().min(1, "Comment cannot be empty"),
});

export const getIssueCommentsSchema = z.object({
  issueId: z.uuid("Invalid issue ID format"),
});

export const deleteCommentSchema = z.object({
  commentId: z.uuid("Invalid comment ID format"),
});
