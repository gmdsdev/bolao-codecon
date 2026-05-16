WITH duplicate_bets AS (
	SELECT "id", row_number() OVER (
		PARTITION BY "user_id", "match_id"
		ORDER BY "id"
	) AS "row_number"
	FROM "bet"
)
DELETE FROM "bet"
USING duplicate_bets
WHERE "bet"."id" = duplicate_bets."id"
	AND duplicate_bets."row_number" > 1;
--> statement-breakpoint
WITH merged_rankings AS (
	SELECT "user_id", min("id") AS "id", sum("points")::integer AS "points"
	FROM "ranking"
	GROUP BY "user_id"
	HAVING count(*) > 1
)
UPDATE "ranking"
SET "points" = merged_rankings."points"
FROM merged_rankings
WHERE "ranking"."id" = merged_rankings."id";
--> statement-breakpoint
WITH merged_rankings AS (
	SELECT "user_id", min("id") AS "id"
	FROM "ranking"
	GROUP BY "user_id"
	HAVING count(*) > 1
)
DELETE FROM "ranking"
USING merged_rankings
WHERE "ranking"."user_id" = merged_rankings."user_id"
	AND "ranking"."id" <> merged_rankings."id";
--> statement-breakpoint
WITH duplicate_logs AS (
	SELECT "id", row_number() OVER (
		PARTITION BY "user_id", "match_id"
		ORDER BY "id"
	) AS "row_number"
	FROM "ranking_log"
)
DELETE FROM "ranking_log"
USING duplicate_logs
WHERE "ranking_log"."id" = duplicate_logs."id"
	AND duplicate_logs."row_number" > 1;
--> statement-breakpoint
CREATE UNIQUE INDEX "bet_user_match_unique" ON "bet" USING btree ("user_id","match_id");--> statement-breakpoint
CREATE INDEX "bet_match_id_idx" ON "bet" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "bet_user_id_idx" ON "bet" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "match_round_id_idx" ON "match" USING btree ("round_id");--> statement-breakpoint
CREATE INDEX "match_status_idx" ON "match" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ranking_user_id_unique" ON "ranking" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ranking_log_user_match_unique" ON "ranking_log" USING btree ("user_id","match_id");--> statement-breakpoint
CREATE INDEX "ranking_log_user_id_idx" ON "ranking_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ranking_log_match_id_idx" ON "ranking_log" USING btree ("match_id");
