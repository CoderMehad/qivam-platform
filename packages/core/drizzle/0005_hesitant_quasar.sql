ALTER TABLE "invitations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "invitations" CASCADE;--> statement-breakpoint
ALTER TABLE "admins" DROP CONSTRAINT "admins_mosque_id_mosques_id_fk";
--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "mosque_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_mosque_id_mosques_id_fk" FOREIGN KEY ("mosque_id") REFERENCES "public"."mosques"("id") ON DELETE set null ON UPDATE no action;