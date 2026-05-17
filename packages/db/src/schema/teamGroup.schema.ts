import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const teamGroup = pgTable("team_group", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});
