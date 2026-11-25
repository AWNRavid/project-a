import * as z from "zod";
import { projectStatusSchema } from "./types";

/**
 * Shared, client-safe project schemas and constants. This file must
 * not import server-only modules so client components can validate
 * with the exact rules the routes enforce.
 */

export const PROJECT_TITLE_MAX_LENGTH = 120;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 500;

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(
    PROJECT_TITLE_MAX_LENGTH,
    `Title is too long (max ${PROJECT_TITLE_MAX_LENGTH} characters)`,
  );

// An empty or cleared description is normalized to null by the routes,
// so the column stays null instead of holding "".
const descriptionSchema = z
  .string()
  .trim()
  .max(
    PROJECT_DESCRIPTION_MAX_LENGTH,
    `Description is too long (max ${PROJECT_DESCRIPTION_MAX_LENGTH} characters)`,
  )
  .nullable()
  .optional();

const workspaceIdSchema = z.string().min(1, "Workspace ID is required");

export const projectFormSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const createProjectSchema = projectFormSchema.extend({
  workspaceId: workspaceIdSchema,
});

export const updateProjectSchema = projectFormSchema.extend({
  projectId: z.uuid(),
  workspaceId: workspaceIdSchema,
  status: projectStatusSchema,
});

export const editProjectFormSchema = projectFormSchema.extend({
  status: projectStatusSchema,
});

export type EditProjectFormValues = z.infer<typeof editProjectFormSchema>;
