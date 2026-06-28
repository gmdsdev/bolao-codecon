import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { round } from "./round.schema";
import { team } from "./team.schema";
import { stadium } from "./stadium.schema";

export const match = pgTable(
  "match",
  {
    id: serial("id").primaryKey(),
    teamAId: integer("team_a_id")
      .references(() => team.id, { onDelete: "cascade" }),
    teamBId: integer("team_b_id")
      .references(() => team.id, { onDelete: "cascade" }),
    roundId: integer("round_id")
      .notNull()
      .references(() => round.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull().defaultNow(),
    stadiumId: integer("stadium_id")
      .notNull()
      .references(() => stadium.id, { onDelete: "cascade" }),
    scoreA: integer("score_a"),
    scoreB: integer("score_b"),
    expectedWinnerId: integer("expected_winner_id").references(() => team.id, {
      onDelete: "cascade",
    }),
    matchNumber: integer("match_number"),
    teamASource: text("team_a_source"),
    teamBSource: text("team_b_source"),
    status: text("status").notNull().default("pending"),
    penaltyScoreA: integer("penalty_score_a"),
    penaltyScoreB: integer("penalty_score_b"),
  },
  (table) => [
    uniqueIndex("match_number_unique").on(table.matchNumber),
    index("match_round_id_idx").on(table.roundId),
    index("match_status_idx").on(table.status),
  ],
);
