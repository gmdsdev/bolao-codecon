import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { match } from "./match.schema";

export const bet = pgTable("bet", {
  id: serial("id").primaryKey(),
  scoreA: integer("score_a").notNull(),
  scoreB: integer("score_b").notNull(),
  modifier: text("modifier").notNull().default("normal"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  matchId: integer("match_id")
    .notNull()
    .references(() => match.id, { onDelete: "cascade" }),
});
