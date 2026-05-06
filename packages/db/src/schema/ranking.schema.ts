import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const ranking = pgTable("ranking", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
});
