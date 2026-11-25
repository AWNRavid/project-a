import { z } from "zod";

/**
 * Labels are workspace-scoped, so every mutation carries or derives the
 * workspace. Names are trimmed so " bug " and "bug" cannot coexist.
 */
export const labelNameSchema = z
  .string()
  .trim()
  .min(1, "Label name is required")
  .max(50, "Label name cannot exceed 50 characters");

/**
 * Label colors are stored as six-digit hex (e.g. "#a21862"). The UI
 * picks from a fixed palette, so this is the trust-boundary check.
 */
export const labelColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #a21862");

export const listLabelsSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

export const createLabelSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  name: labelNameSchema,
  color: labelColorSchema,
});

export const updateLabelSchema = z.object({
  labelId: z.uuid("Invalid label ID"),
  name: labelNameSchema,
  color: labelColorSchema,
});

export const deleteLabelSchema = z.object({
  labelId: z.uuid("Invalid label ID"),
});

export const setIssueLabelsSchema = z.object({
  issueId: z.uuid("Invalid issue ID"),
  // The complete desired set; the route replaces what the issue has.
  labelIds: z.array(z.uuid("Invalid label ID")),
});
