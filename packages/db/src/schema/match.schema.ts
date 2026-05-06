import { integer, pgTable, serial } from "drizzle-orm/pg-core";
import { round } from "./round.schema";
import { team } from "./team.schema";

export const match = pgTable("match", {
  id: serial("id").primaryKey(),
  teamAId: integer("team_a_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  teamBId: integer("team_b_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  roundId: integer("round_id")
    .notNull()
    .references(() => round.id, { onDelete: "cascade" }),
  scoreA: integer("score_a"),
  scoreB: integer("score_b"),
  expectedWinnerId: integer("expected_winner_id").references(() => team.id, {
    onDelete: "cascade",
  }),
});
