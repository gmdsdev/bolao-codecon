import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const stadium = pgTable("stadium", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
});
