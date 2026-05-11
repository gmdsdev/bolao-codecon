-- match_id was incorrectly declared as serial (auto-increment), causing Drizzle
-- to omit the column from INSERTs and store a sequence value instead of the
-- actual match ID. Dropping the default converts it to a plain integer FK.
ALTER TABLE "bet" ALTER COLUMN "match_id" DROP DEFAULT;
DROP SEQUENCE IF EXISTS "bet_match_id_seq";