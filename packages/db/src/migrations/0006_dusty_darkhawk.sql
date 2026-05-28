ALTER TABLE "match" ADD COLUMN IF NOT EXISTS "match_number" integer;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN IF NOT EXISTS "team_a_source" text;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN IF NOT EXISTS "team_b_source" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "match_number_unique" ON "match" USING btree ("match_number");
