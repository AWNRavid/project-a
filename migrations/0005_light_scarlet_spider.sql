ALTER TABLE "project" RENAME COLUMN "created_by_workspace_member_id" TO "created_by_id";--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT "project_created_by_workspace_member_id_workspace_member_id_fk";
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_key_unique" UNIQUE("key");