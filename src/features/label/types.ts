import type { labelTable } from "@/db/drizzle/schema";
import type { z } from "zod";
import type {
  createLabelSchema,
  deleteLabelSchema,
  listLabelsSchema,
  setIssueLabelsSchema,
  updateLabelSchema,
} from "./schemas";

/** Raw database row for one workspace label. */
export type Label = typeof labelTable.$inferSelect;

/** The subset every issue surface needs to render a label. */
export interface IssueLabelSummary {
  id: string;
  name: string;
  color: string;
}

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
export type DeleteLabelInput = z.infer<typeof deleteLabelSchema>;
export type ListLabelsInput = z.infer<typeof listLabelsSchema>;
export type SetIssueLabelsInput = z.infer<typeof setIssueLabelsSchema>;
