import type { projectTable } from "@/db/drizzle/schema";
import z from "zod";

// Single source of truth for project statuses. The database stores the
// status as plain text, so every read goes through parseProjectStatus.
export const projectStatuses = [
  "active",
  "paused",
  "completed",
  "archived",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

export const projectStatusSchema = z.enum(projectStatuses);

// One accent per status, shared by the project list and the project
// header so the two never disagree about what a status looks like.
export const projectStatusTone: Record<ProjectStatus, string> = {
  active: "var(--status-todo)",
  paused: "var(--status-backlog)",
  completed: "var(--status-done)",
  archived: "var(--status-backlog)",
};

/**
 * Parses a raw status string coming from the database into a typed
 * status. Returns null when the value is not a known status so callers
 * can decide how to surface the illegal state.
 */
export function parseProjectStatus(value: string): ProjectStatus | null {
  const result = projectStatusSchema.safeParse(value);
  return result.success ? result.data : null;
}

export type Project = typeof projectTable.$inferSelect;
