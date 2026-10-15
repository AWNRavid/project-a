import z from "zod";

export const projectStatus = ["active", "archived", "paused"] as const;

export type ProjectStatus = (typeof projectStatus)[number];

export const projectStatusSchema = z.enum(projectStatus);

export const parsedProjectStatus = (value: string) => {
  const result = projectStatusSchema.safeParse(value);
  return result.success ? result.data : null;
};
