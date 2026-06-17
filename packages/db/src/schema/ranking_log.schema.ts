import {
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { match } from "./match.schema";

export const rankingLog = pgTable(
  "ranking_log",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    matchId: integer("match_id")
      .notNull()
      .references(() => match.id, { onDelete: "cascade" }),
    // Pontos base: 3 (placar exato), 1 (vencedor certo), 0 (errou)
    basePoints: real("base_points").notNull(),
    // Delta da roleta: pode ser fracionário/negativo (half_points, invalid_bet) ou positivo (double_points, lucky_duck)
    modifierPoints: real("modifier_points").notNull(),
    // Pontuação final creditada ao usuário (pode ser fracionária, ex.: 1.5 com half_points)
    totalPoints: real("total_points").notNull(),
    // Modificador da roleta aplicado
    modifier: text("modifier").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ranking_log_user_match_unique").on(
      table.userId,
      table.matchId,
    ),
    index("ranking_log_user_id_idx").on(table.userId),
    index("ranking_log_match_id_idx").on(table.matchId),
  ],
);
