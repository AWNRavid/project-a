import { z } from "zod";

/**
 * Valid lifecycle statuses for an issue.
 */
export const issueStatusSchema = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "done",
  "cancelled",
]);

/**
 * Priority levels for issue categorization and triage.
 */
export const issuePrioritySchema = z.enum([
  "urgent",
  "high",
  "medium",
  "low",
  "no_priority",
]);

/**
 * Validation schema for creating a new issue under a project.
 */
export const createIssueSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title cannot exceed 255 characters"),
  description: z.string().optional(),
  status: issueStatusSchema.default("backlog"),
  priority: issuePrioritySchema.default("no_priority"),
  assigneeId: z.string().nullable().optional(),
  order: z.string().default("0"),
  dueDate: z.coerce.date().nullable().optional(),
});

/**
 * Validation schema for retrieving a single issue by its unique identifier.
 */
export const getIssueSchema = z.object({
  issueId: z.string().uuid("Invalid issue ID"),
});

/**
 * Validation schema for querying and filtering issues inside a project.
 */
export const getAllIssuesSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  assigneeId: z.string().optional(),
  search: z.string().trim().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

/**
 * Validation schema for updating an existing issue. All mutable fields are optional.
 */
export const updateIssueSchema = z.object({
  issueId: z.string().uuid("Invalid issue ID"),
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title cannot exceed 255 characters")
    .optional(),
  description: z.string().nullable().optional(),
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  assigneeId: z.string().nullable().optional(),
  order: z.string().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

/**
 * Validation schema for deleting an issue by its ID.
 */
export const deleteIssueSchema = z.object({
  issueId: z.string().uuid("Invalid issue ID"),
});
