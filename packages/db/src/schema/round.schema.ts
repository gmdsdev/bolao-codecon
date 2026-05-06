import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

export const round = pgTable("round", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("pending"),
});
