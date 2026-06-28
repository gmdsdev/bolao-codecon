import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { match } from "./match.schema";

export const bet = pgTable(
  "bet",
  {
    id: serial("id").primaryKey(),
    scoreA: integer("score_a").notNull(),
    scoreB: integer("score_b").notNull(),
    penaltyScoreA: integer("penalty_score_a"),
    penaltyScoreB: integer("penalty_score_b"),
    modifier: text("modifier").notNull().default("normal"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    matchId: integer("match_id")
      .notNull()
      .references(() => match.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("bet_user_match_unique").on(table.userId, table.matchId),
    index("bet_match_id_idx").on(table.matchId),
    index("bet_user_id_idx").on(table.userId),
    index("bet_created_at_idx").on(table.createdAt),
  ],
);
