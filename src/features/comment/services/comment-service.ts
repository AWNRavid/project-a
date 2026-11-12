import { db } from "@/db/drizzle/connection";
import {
  commentTable,
  issueTable,
  projectTable,
  userTable,
} from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import type {
  CommentWithAuthor,
  CreateCommentInput,
  DeleteCommentInput,
  GetIssueCommentsInput,
} from "../types";

export class CommentService {
  /**
   * Creates a comment for an issue after verifying workspace membership.
   */
  async createComment(
    userId: string,
    input: CreateCommentInput,
  ): Promise<CommentWithAuthor> {
    const [issue] = await db
      .select({
        id: issueTable.id,
        projectId: issueTable.projectId,
        workspaceId: projectTable.workspaceId,
      })
      .from(issueTable)
      .innerJoin(projectTable, eq(issueTable.projectId, projectTable.id))
      .where(eq(issueTable.id, input.issueId))
      .limit(1);

    if (!issue) {
      throw new ORPCError("NOT_FOUND", { message: "Issue not found" });
    }

    await requireWorkspaceRole(userId, issue.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    const [newComment] = await db
      .insert(commentTable)
      .values({
        issueId: input.issueId,
        authorId: userId,
        body: input.body,
      })
      .returning();

    if (!newComment) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create comment",
      });
    }

    const [author] = await db
      .select({
        name: userTable.name,
        email: userTable.email,
        image: userTable.image,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    return {
      id: newComment.id,
      issueId: newComment.issueId,
      authorId: newComment.authorId,
      authorName: author?.name ?? null,
      authorEmail: author?.email ?? null,
      authorImage: author?.image ?? null,
      body: newComment.body,
      createdAt: newComment.createdAt,
      updatedAt: newComment.updatedAt,
    };
  }

  /**
   * Lists all comments for a specific issue in chronological order.
   */
  async getIssueComments(
    userId: string,
    input: GetIssueCommentsInput,
  ): Promise<CommentWithAuthor[]> {
    const [issue] = await db
      .select({
        id: issueTable.id,
        workspaceId: projectTable.workspaceId,
      })
      .from(issueTable)
      .innerJoin(projectTable, eq(issueTable.projectId, projectTable.id))
      .where(eq(issueTable.id, input.issueId))
      .limit(1);

    if (!issue) {
      throw new ORPCError("NOT_FOUND", { message: "Issue not found" });
    }

    await requireWorkspaceRole(userId, issue.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    const rows = await db
      .select({
        id: commentTable.id,
        issueId: commentTable.issueId,
        authorId: commentTable.authorId,
        authorName: userTable.name,
        authorEmail: userTable.email,
        authorImage: userTable.image,
        body: commentTable.body,
        createdAt: commentTable.createdAt,
        updatedAt: commentTable.updatedAt,
      })
      .from(commentTable)
      .innerJoin(userTable, eq(commentTable.authorId, userTable.id))
      .where(eq(commentTable.issueId, input.issueId))
      .orderBy(asc(commentTable.createdAt));

    return rows;
  }

  /**
   * Deletes a comment if the requesting user is the author or workspace admin/owner.
   */
  async deleteComment(
    userId: string,
    input: DeleteCommentInput,
  ): Promise<{ success: boolean }> {
    const [comment] = await db
      .select({
        id: commentTable.id,
        authorId: commentTable.authorId,
        workspaceId: projectTable.workspaceId,
      })
      .from(commentTable)
      .innerJoin(issueTable, eq(commentTable.issueId, issueTable.id))
      .innerJoin(projectTable, eq(issueTable.projectId, projectTable.id))
      .where(eq(commentTable.id, input.commentId))
      .limit(1);

    if (!comment) {
      throw new ORPCError("NOT_FOUND", { message: "Comment not found" });
    }

    if (comment.authorId !== userId) {
      await requireWorkspaceRole(userId, comment.workspaceId, [
        "admin",
        "owner",
      ]);
    }

    await db.delete(commentTable).where(eq(commentTable.id, input.commentId));

    return { success: true };
  }
}

export const commentService = new CommentService();
