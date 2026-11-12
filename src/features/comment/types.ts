import type { commentTable } from "@/db/drizzle/schema";
import type { z } from "zod";
import type {
  createCommentSchema,
  deleteCommentSchema,
  getIssueCommentsSchema,
} from "./schemas";

export type Comment = typeof commentTable.$inferSelect;

export interface CommentWithAuthor {
  id: string;
  issueId: string;
  authorId: string;
  authorName: string | null;
  authorEmail: string | null;
  authorImage: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type GetIssueCommentsInput = z.infer<typeof getIssueCommentsSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
