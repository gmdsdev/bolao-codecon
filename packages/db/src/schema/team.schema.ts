import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { teamGroup } from "./teamGroup.schema";

export const team = pgTable("team", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  flag: text("flag").notNull(),
  teamGroupId: integer("team_group_id")
    .notNull()
    .references(() => teamGroup.id, { onDelete: "cascade" }),
  deletedAt: timestamp("deleted_at"),
});
