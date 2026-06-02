ALTER TABLE "bet" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "bet_created_at_idx" ON "bet" USING btree ("created_at");