import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
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
    status: text("status").notNull().default("pending"),
  },
  (table) => [
    index("match_round_id_idx").on(table.roundId),
    index("match_status_idx").on(table.status),
  ],
);
