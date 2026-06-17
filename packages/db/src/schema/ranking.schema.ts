import { pgTable, real, serial, text, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const ranking = pgTable(
  "ranking",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    points: real("points").notNull(),
  },
  (table) => [uniqueIndex("ranking_user_id_unique").on(table.userId)],
);
