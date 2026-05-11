-- Drop the sequence default that was left over from when match_id was declared
-- as serial(). The previous migration (0002) only changed the DATA TYPE to integer
-- but did not remove the DEFAULT nextval(...), which caused Drizzle ORM to use
-- sequence-generated values instead of the explicitly provided match IDs.
ALTER TABLE "bet" ALTER COLUMN "match_id" DROP DEFAULT;--> statement-breakpoint
DROP SEQUENCE IF EXISTS "bet_match_id_seq";
