ALTER TABLE "ranking" ALTER COLUMN "points" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "ranking_log" ALTER COLUMN "base_points" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "ranking_log" ALTER COLUMN "modifier_points" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "ranking_log" ALTER COLUMN "total_points" SET DATA TYPE real;