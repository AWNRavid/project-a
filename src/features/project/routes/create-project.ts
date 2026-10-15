import { db } from "@/db/drizzle/connection";
import { projectTable } from "@/db/drizzle/schema";
import { requireWorkspaceRole } from "@/features/workspace/utils/workspace-access";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { requireUser } from "@/lib/orpc/auth/require-user";
import { customAlphabet } from "nanoid";
import z from "zod";

const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  description: z.string().optional(),
});

const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 4);

export const createProject = authProcedure
  .input(createProjectSchema)
  .handler(async ({ input, context }) => {
    const user = requireUser(context.user);

    await requireWorkspaceRole(user.id, input.workspaceId, [
      "admin",
      "member",
      "owner",
    ]);

    const cleanTitle = input.title.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const prefix = cleanTitle.slice(0, 3).padEnd(3, "X");
    const projectKey = `${prefix}-${nanoid()}`; // e.g. "MOB-4F2A"

    const [project] = await db
      .insert(projectTable)
      .values({
        title: input.title,
        workspaceId: input.workspaceId,
        createdById: user.id,
        description: input.description,
        key: projectKey,
        status: "active",
      })
      .returning();

    return project;
  });
