CREATE TABLE "issue" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"project_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"status" text DEFAULT 'backlog' NOT NULL,
	"priority" text DEFAULT 'no_priority' NOT NULL,
	"assignee_id" text,
	"order" text DEFAULT '0' NOT NULL,
	"due_date" timestamp with time zone,
	"created_by_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issue_project_id_idx" ON "issue" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "issue_assignee_id_idx" ON "issue" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "issue_project_status_order_idx" ON "issue" USING btree ("project_id","status","order");--> statement-breakpoint
CREATE UNIQUE INDEX "issue_project_number_idx" ON "issue" USING btree ("project_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_project_key_idx" ON "project" USING btree ("workspace_id","key");