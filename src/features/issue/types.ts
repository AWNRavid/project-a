import type { issueTable } from "@/db/drizzle/schema";
import type { z } from "zod";
import type {
  createIssueSchema,
  deleteIssueSchema,
  getAllIssuesSchema,
  getIssueSchema,
  issuePrioritySchema,
  issueStatusSchema,
  updateIssueSchema,
} from "./schemas";

/**
 * Status lifecycle values supported by issues in kanban/backlog.
 */
export type IssueStatus = z.infer<typeof issueStatusSchema>;

/**
 * Priority levels assignable to an issue.
 */
export type IssuePriority = z.infer<typeof issuePrioritySchema>;

/**
 * Inferred database model record for an issue.
 */
export type Issue = typeof issueTable.$inferSelect;

/**
 * Detailed representation of an issue, including joined project identifier and assignee details.
 */
export interface IssueDetail {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  order: string;
  dueDate: Date | null;
  projectId: string;
  projectKey: string;
  projectTitle: string;
  workspaceId: string;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  assigneeImage: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type GetAllIssuesInput = z.infer<typeof getAllIssuesSchema>;
export type GetIssueInput = z.infer<typeof getIssueSchema>;
export type DeleteIssueInput = z.infer<typeof deleteIssueSchema>;
