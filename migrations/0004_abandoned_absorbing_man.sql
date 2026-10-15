CREATE TABLE "project" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by_workspace_member_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_created_by_workspace_member_id_workspace_member_id_fk" FOREIGN KEY ("created_by_workspace_member_id") REFERENCES "public"."workspace_member"("id") ON DELETE no action ON UPDATE no action;