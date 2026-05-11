import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { match } from "./match.schema";

export const rankingLog = pgTable("ranking_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  matchId: integer("match_id")
    .notNull()
    .references(() => match.id, { onDelete: "cascade" }),
  // Pontos base: 3 (placar exato), 1 (vencedor certo), 0 (errou)
  basePoints: integer("base_points").notNull(),
  // Delta da roleta: pode ser negativo (half_points, invalid_bet) ou positivo (double_points, lucky_duck)
  modifierPoints: integer("modifier_points").notNull(),
  // Pontuação final creditada ao usuário
  totalPoints: integer("total_points").notNull(),
  // Modificador da roleta aplicado
  modifier: text("modifier").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
