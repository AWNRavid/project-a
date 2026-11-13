import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

// BETTER-AUTH
export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const sessionTable = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const accountTable = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verificationTable = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(userTable, ({ many }) => ({
  sessions: many(sessionTable),
  accounts: many(accountTable),
  workspaceMemberships: many(workspaceMemberTable),
  createdProjects: many(projectTable),
  comments: many(commentTable),
  attachments: many(attachmentTable),
  activities: many(activityTable),
}));

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

export const accountRelations = relations(accountTable, ({ one }) => ({
  user: one(userTable, {
    fields: [accountTable.userId],
    references: [userTable.id],
  }),
}));
// END OF BETTER-AUTH

export const workspaceTable = pgTable("workspace", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  // Full S3 storage path of the workspace logo
  // ("data/workspace/<id>/logo-<timestamp>.webp"), nullable until the
  // owner uploads one. Storing the path (not the URL) keeps the
  // scheme endpoint-agnostic; URLs are resolved via getFileUrl.
  logo: text("logo"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const workspaceMemberTable = pgTable(
  "workspace_member",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // "owner" | "admin" | "member"
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("workspace_member_workspace_user_idx").on(
      t.workspaceId,
      t.userId,
    ),
    index("workspace_member_user_id_idx").on(t.userId),
  ],
);

export const workspaceInviteTable = pgTable(
  "workspace_invite",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id, { onDelete: "cascade" }),
    // Email of the person being invited — may not have an account yet.
    email: text("email").notNull(),
    // Role the invitee will get on accept. "owner" invites are
    // blocked at the route boundary (ownership transfer is not a
    // phase-1 feature).
    role: text("role").notNull(), // "owner" | "admin" | "member"
    // Unguessable lookup key for the /invite/<token> page (crypto
    // random 32 bytes hex).
    token: text("token").notNull().unique(),
    // Who sent the invite; shown ("invited by ...") in the email and
    // the accept page.
    invitedById: text("invited_by_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    // When the invite stops being usable; cancels delete the row
    // entirely, so a short expiry keeps the pending set clean.
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One active invite per email per workspace; cancelling an invite
    // deletes the row, so the index frees the slot for a re-invite.
    uniqueIndex("workspace_invite_workspace_email_idx").on(
      t.workspaceId,
      t.email,
    ),
    // Lookups by invitee-joined-time (join user for the inviter name).
    index("workspace_invite_invited_by_id_idx").on(t.invitedById),
  ],
);

export const workspaceRelations = relations(workspaceTable, ({ many }) => ({
  members: many(workspaceMemberTable),
  invites: many(workspaceInviteTable),
  projects: many(projectTable),
}));

export const workspaceInviteRelations = relations(
  workspaceInviteTable,
  ({ one }) => ({
    workspace: one(workspaceTable, {
      fields: [workspaceInviteTable.workspaceId],
      references: [workspaceTable.id],
    }),
    inviter: one(userTable, {
      fields: [workspaceInviteTable.invitedById],
      references: [userTable.id],
    }),
  }),
);

export const workspaceMemberRelations = relations(
  workspaceMemberTable,
  ({ one }) => ({
    workspace: one(workspaceTable, {
      fields: [workspaceMemberTable.workspaceId],
      references: [workspaceTable.id],
    }),
    user: one(userTable, {
      fields: [workspaceMemberTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const projectTable = pgTable(
  "project",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    title: text("title").notNull(),
    description: text("description"),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaceTable.id),
    createdById: text("created_by_id")
      .notNull()
      .references(() => userTable.id),
    status: text("status").default("active").notNull(),
    key: text("key").notNull().unique(),
  },
  (table) => [
    uniqueIndex("workspace_project_key_idx").on(table.workspaceId, table.key),
  ],
);

export const postsTable = pgTable("posts", {
  id: uuid("id").primaryKey().$defaultFn(uuidv7),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  title: text("title").notNull(),
  description: text("description"),
});

export const projectRelations = relations(projectTable, ({ one, many }) => ({
  workspace: one(workspaceTable, {
    fields: [projectTable.workspaceId],
    references: [workspaceTable.id],
  }),
  createdBy: one(userTable, {
    fields: [projectTable.createdById],
    references: [userTable.id],
  }),
  issues: many(issueTable),
}));

export const issueTable = pgTable(
  "issue",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    title: text("title").notNull(),
    description: text("description"),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projectTable.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    status: text("status").notNull().default("backlog"),
    priority: text("priority").notNull().default("no_priority"),
    assigneeId: text("assignee_id").references(() => userTable.id, {
      onDelete: "set null",
    }),
    order: text("order").notNull().default("0"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("issue_project_id_idx").on(table.projectId),
    index("issue_assignee_id_idx").on(table.assigneeId),
    index("issue_project_status_order_idx").on(
      table.projectId,
      table.status,
      table.order,
    ),
    uniqueIndex("issue_project_number_idx").on(table.projectId, table.number),
  ],
);

export const issueRelations = relations(issueTable, ({ one, many }) => ({
  project: one(projectTable, {
    fields: [issueTable.projectId],
    references: [projectTable.id],
  }),
  assignee: one(userTable, {
    fields: [issueTable.assigneeId],
    references: [userTable.id],
  }),
  createdBy: one(userTable, {
    fields: [issueTable.createdById],
    references: [userTable.id],
  }),
  comments: many(commentTable),
  attachments: many(attachmentTable),
  activities: many(activityTable),
}));

export const commentTable = pgTable(
  "comment",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issueTable.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("comment_issue_id_idx").on(table.issueId)],
);

export const commentRelations = relations(commentTable, ({ one }) => ({
  issue: one(issueTable, {
    fields: [commentTable.issueId],
    references: [issueTable.id],
  }),
  author: one(userTable, {
    fields: [commentTable.authorId],
    references: [userTable.id],
  }),
}));

// One row per file uploaded to an issue. The actual file bytes live in
// MinIO; this table only stores metadata plus the storage path.
export const attachmentTable = pgTable(
  "attachment",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    // Deleting the issue also deletes its attachment rows (CASCADE).
    // The files in MinIO are removed by the delete route.
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issueTable.id, { onDelete: "cascade" }),
    uploadedById: text("uploaded_by_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    // Original file name shown to users, e.g. "design.pdf".
    filename: text("filename").notNull(),
    // MIME type, e.g. "image/png" or "application/pdf".
    contentType: text("content_type").notNull(),
    // Full MinIO path including bucket, e.g.
    // "private-data/attachment/<issueId>/<uuid>-design.pdf".
    // Store the path (not a URL) so the endpoint can change; URLs are
    // generated on demand with getFileUrl.
    url: text("url").notNull(),
    // File size in bytes.
    size: integer("size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("attachment_issue_id_idx").on(table.issueId)],
);

export const attachmentRelations = relations(attachmentTable, ({ one }) => ({
  issue: one(issueTable, {
    fields: [attachmentTable.issueId],
    references: [issueTable.id],
  }),
  uploadedBy: one(userTable, {
    fields: [attachmentTable.uploadedById],
    references: [userTable.id],
  }),
}));

// One row per change made to an issue, e.g. "status changed from todo
// to done". The detail of the change lives in `payload` as JSON text.
export const activityTable = pgTable(
  "activity",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    // Deleting the issue also deletes its history (CASCADE).
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issueTable.id, { onDelete: "cascade" }),
    // Who performed the change; deleting the user removes their
    // history rows (CASCADE), matching the other child tables.
    actorId: text("actor_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    // Event name, e.g. "status_changed". Parsed into a typed union at
    // the service boundary.
    type: text("type").notNull(),
    // JSON text with change details, e.g. {"from":"todo","to":"done"}.
    payload: text("payload").notNull().default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activity_issue_id_idx").on(table.issueId),
    index("activity_actor_id_idx").on(table.actorId),
  ],
);

export const activityRelations = relations(activityTable, ({ one }) => ({
  issue: one(issueTable, {
    fields: [activityTable.issueId],
    references: [issueTable.id],
  }),
  actor: one(userTable, {
    fields: [activityTable.actorId],
    references: [userTable.id],
  }),
}));

// export const userRelations = relations(userTable, ({ many }) => ({
//   sessions: many(sessionTable),
//   accounts: many(accountTable),
//   workspaceMemberships: many(workspaceMemberTable),
// }));

// export const userTable = pgTable("user", {
//   id: text("id").primaryKey(),
//   name: text("name").notNull(),
//   email: text("email").notNull().unique(),
//   emailVerified: boolean("email_verified").default(false).notNull(),
//   image: text("image"),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updatedAt: timestamp("updated_at")
//     .defaultNow()
//     .$onUpdate(() => /* @__PURE__ */ new Date())
//     .notNull(),
//   role: text("role"),
//   banned: boolean("banned").default(false),
//   banReason: text("ban_reason"),
//   banExpires: timestamp("ban_expires"),
// });

// export const sessionRelations = relations(sessionTable, ({ one }) => ({
//   user: one(userTable, {
//     fields: [sessionTable.userId],
//     references: [userTable.id],
//   }),
// }));

// export const sessionTable = pgTable(
//   "session",
//   {
//     id: text("id").primaryKey(),
//     expiresAt: timestamp("expires_at").notNull(),
//     token: text("token").notNull().unique(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at")
//       .$onUpdate(() => /* @__PURE__ */ new Date())
//       .notNull(),
//     ipAddress: text("ip_address"),
//     userAgent: text("user_agent"),
//     userId: text("user_id")
//       .notNull()
//       .references(() => userTable.id, { onDelete: "cascade" }),
//     impersonatedBy: text("impersonated_by"),
//   },
//   (table) => [index("session_userId_idx").on(table.userId)],
// );

// export const accountTable = pgTable(
//   "account",
//   {
//     id: text("id").primaryKey(),
//     accountId: text("account_id").notNull(),
//     providerId: text("provider_id").notNull(),
//     userId: text("user_id")
//       .notNull()
//       .references(() => userTable.id, { onDelete: "cascade" }),
//     accessToken: text("access_token"),
//     refreshToken: text("refresh_token"),
//     idToken: text("id_token"),
//     accessTokenExpiresAt: timestamp("access_token_expires_at"),
//     refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
//     scope: text("scope"),
//     password: text("password"),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at")
//       .$onUpdate(() => /* @__PURE__ */ new Date())
//       .notNull(),
//   },
//   (table) => [index("account_userId_idx").on(table.userId)],
// );

// export const postsTable = pgTable("posts", {
//   id: uuid("id").primaryKey().$defaultFn(uuidv7),
//   createdAt: timestamp("created_at", {
//     withTimezone: true,
//   })
//     .notNull()
//     .defaultNow(),
//   updatedAt: timestamp("updated_at", {
//     withTimezone: true,
//   })
//     .notNull()
//     .defaultNow()
//     .$onUpdate(() => new Date()),
//   title: text("title").notNull(),
//   description: text("description"),

// export const postsTable = pgTable("posts", {
//   id: uuid("id").primaryKey().$defaultFn(uuidv7),
//   createdAt: timestamp("created_at", {
//     withTimezone: true,
//   })
//     .notNull()
//     .defaultNow(),
//   updatedAt: timestamp("updated_at", {
//     withTimezone: true,
//   })
//     .notNull()
//     .defaultNow()
//     .$onUpdate(() => new Date()),
//   title: text("title").notNull(),
//   description: text("description"),
// });
