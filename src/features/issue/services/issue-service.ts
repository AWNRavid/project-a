import { db } from "@/db/drizzle/connection";
import {
  issueTable,
  projectTable,
  userTable,
  workspaceMemberTable,
} from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { ORPCError } from "@orpc/server";
import { and, asc, eq, ilike, sql } from "drizzle-orm";
import type {
  CreateIssueInput,
  GetAllIssuesInput,
  Issue,
  IssueDetail,
  UpdateIssueInput,
} from "../types";

/**
 * Service encapsulating business logic, domain constraints, authorization, and data access for Issues.
 */
export class IssueService {
  /**
   * Helper to verify if a user belongs to a workspace before assignment.
   */
  private async isWorkspaceMember(
    userId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const [member] = await db
      .select({ id: workspaceMemberTable.id })
      .from(workspaceMemberTable)
      .where(
        and(
          eq(workspaceMemberTable.workspaceId, workspaceId),
          eq(workspaceMemberTable.userId, userId),
        ),
      )
      .limit(1);

    return Boolean(member);
  }

  /**
   * Creates a new issue in a project with atomic issue numbering and workspace authorization.
   *
   * @param userId - ID of the authenticated user creating the issue.
   * @param input - Validated issue creation payload.
   * @returns Newly created issue record.
   */
  async createIssue(userId: string, input: CreateIssueInput): Promise<Issue> {
    // 1. Fetch project to verify existence and retrieve associated workspace ID.
    const [project] = await db
      .select({ id: projectTable.id, workspaceId: projectTable.workspaceId })
      .from(projectTable)
      .where(eq(projectTable.id, input.projectId))
      .limit(1);

    if (!project) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    // 2. Enforce workspace access matrix (owner, admin, member can create issues).
    await requireWorkspaceRole(userId, project.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    // 3. Verify assignee belongs to the same workspace if provided.
    if (input.assigneeId) {
      const isMember = await this.isWorkspaceMember(
        input.assigneeId,
        project.workspaceId,
      );
      if (!isMember) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Assignee must be an active member of this workspace",
        });
      }
    }

    // 4. Atomically compute sequential issue number within a transaction.
    const newIssue = await db.transaction(async (tx) => {
      // Row lock project to avoid sequence race conditions on concurrent issue creation.
      await tx
        .select({ id: projectTable.id })
        .from(projectTable)
        .where(eq(projectTable.id, input.projectId))
        .for("update");

      const [nextNumberResult] = await tx
        .select({
          nextNumber: sql<number>`COALESCE(MAX(${issueTable.number}), 0) + 1`,
        })
        .from(issueTable)
        .where(eq(issueTable.projectId, input.projectId));

      const issueNumber = Number(nextNumberResult?.nextNumber ?? 1);

      const [created] = await tx
        .insert(issueTable)
        .values({
          title: input.title,
          description: input.description,
          projectId: input.projectId,
          number: issueNumber,
          status: input.status,
          priority: input.priority,
          assigneeId: input.assigneeId ?? null,
          order: input.order,
          dueDate: input.dueDate ?? null,
          createdById: userId,
        })
        .returning();

      return created;
    });

    if (!newIssue) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create issue",
      });
    }

    return newIssue;
  }

  /**
   * Retrieves a single issue by its ID with full project and assignee relations.
   *
   * @param userId - ID of the authenticated user requesting the issue.
   * @param issueId - UUID of the issue to retrieve.
   * @returns Detailed issue object.
   */
  async getIssueById(userId: string, issueId: string): Promise<IssueDetail> {
    const [issue] = await db
      .select({
        id: issueTable.id,
        number: issueTable.number,
        title: issueTable.title,
        description: issueTable.description,
        status: issueTable.status,
        priority: issueTable.priority,
        order: issueTable.order,
        dueDate: issueTable.dueDate,
        projectId: issueTable.projectId,
        projectKey: projectTable.key,
        projectTitle: projectTable.title,
        workspaceId: projectTable.workspaceId,
        assigneeId: issueTable.assigneeId,
        assigneeName: userTable.name,
        assigneeEmail: userTable.email,
        assigneeImage: userTable.image,
        createdById: issueTable.createdById,
        createdAt: issueTable.createdAt,
        updatedAt: issueTable.updatedAt,
      })
      .from(issueTable)
      .innerJoin(projectTable, eq(issueTable.projectId, projectTable.id))
      .leftJoin(userTable, eq(issueTable.assigneeId, userTable.id))
      .where(eq(issueTable.id, issueId))
      .limit(1);

    if (!issue) {
      throw new ORPCError("NOT_FOUND", { message: "Issue not found" });
    }

    // Verify workspace access.
    await requireWorkspaceRole(userId, issue.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    return issue;
  }

  /**
   * Queries issues belonging to a project with optional filtering, search, and pagination.
   *
   * @param userId - ID of the authenticated user.
   * @param input - Filter and pagination criteria.
   * @returns List of issue details matching the criteria.
   */
  async listIssues(
    userId: string,
    input: GetAllIssuesInput,
  ): Promise<Array<IssueDetail>> {
    // Verify project and workspace membership.
    const [project] = await db
      .select({ id: projectTable.id, workspaceId: projectTable.workspaceId })
      .from(projectTable)
      .where(eq(projectTable.id, input.projectId))
      .limit(1);

    if (!project) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    await requireWorkspaceRole(userId, project.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    // Build dynamic query conditions.
    const conditions = [eq(issueTable.projectId, input.projectId)];

    if (input.status) {
      conditions.push(eq(issueTable.status, input.status));
    }

    if (input.priority) {
      conditions.push(eq(issueTable.priority, input.priority));
    }

    if (input.assigneeId) {
      conditions.push(eq(issueTable.assigneeId, input.assigneeId));
    }

    if (input.search) {
      conditions.push(ilike(issueTable.title, `%${input.search}%`));
    }

    const issues = await db
      .select({
        id: issueTable.id,
        number: issueTable.number,
        title: issueTable.title,
        description: issueTable.description,
        status: issueTable.status,
        priority: issueTable.priority,
        order: issueTable.order,
        dueDate: issueTable.dueDate,
        projectId: issueTable.projectId,
        projectKey: projectTable.key,
        projectTitle: projectTable.title,
        workspaceId: projectTable.workspaceId,
        assigneeId: issueTable.assigneeId,
        assigneeName: userTable.name,
        assigneeEmail: userTable.email,
        assigneeImage: userTable.image,
        createdById: issueTable.createdById,
        createdAt: issueTable.createdAt,
        updatedAt: issueTable.updatedAt,
      })
      .from(issueTable)
      .innerJoin(projectTable, eq(issueTable.projectId, projectTable.id))
      .leftJoin(userTable, eq(issueTable.assigneeId, userTable.id))
      .where(and(...conditions))
      .orderBy(asc(issueTable.order), asc(issueTable.number))
      .limit(input.limit)
      .offset(input.offset);

    return issues;
  }

  /**
   * Updates mutable fields of an existing issue.
   *
   * @param userId - ID of the authenticated user performing the update.
   * @param input - Payload containing issueId and modified fields.
   * @returns Updated issue record.
   */
  async updateIssue(userId: string, input: UpdateIssueInput): Promise<Issue> {
    const [existing] = await db
      .select({
        id: issueTable.id,
        workspaceId: projectTable.workspaceId,
      })
      .from(issueTable)
      .innerJoin(projectTable, eq(issueTable.projectId, projectTable.id))
      .where(eq(issueTable.id, input.issueId))
      .limit(1);

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Issue not found" });
    }

    await requireWorkspaceRole(userId, existing.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    // Validate new assignee membership if updating assigneeId.
    if (input.assigneeId) {
      const isMember = await this.isWorkspaceMember(
        input.assigneeId,
        existing.workspaceId,
      );
      if (!isMember) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Assignee must be an active member of this workspace",
        });
      }
    }

    const { issueId, ...updateFields } = input;

    const [updated] = await db
      .update(issueTable)
      .set({
        ...updateFields,
        updatedAt: new Date(),
      })
      .where(eq(issueTable.id, issueId))
      .returning();

    if (!updated) {
      throw new ORPCError("NOT_FOUND", { message: "Issue not found" });
    }

    return updated;
  }

  /**
   * Deletes an issue after verifying workspace authorization.
   *
   * @param userId - ID of the authenticated user.
   * @param issueId - UUID of the issue to delete.
   * @returns Deleted issue record.
   */
  async deleteIssue(userId: string, issueId: string): Promise<Issue> {
    const [existing] = await db
      .select({
        id: issueTable.id,
        workspaceId: projectTable.workspaceId,
      })
      .from(issueTable)
      .innerJoin(projectTable, eq(issueTable.projectId, projectTable.id))
      .where(eq(issueTable.id, issueId))
      .limit(1);

    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Issue not found" });
    }

    await requireWorkspaceRole(userId, existing.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    const [deleted] = await db
      .delete(issueTable)
      .where(eq(issueTable.id, issueId))
      .returning();

    if (!deleted) {
      throw new ORPCError("NOT_FOUND", { message: "Issue not found" });
    }

    return deleted;
  }
}

export const issueService = new IssueService();
