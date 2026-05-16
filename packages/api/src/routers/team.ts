import { db } from "@codecon/db";
import { team } from "@codecon/db/schema/team.schema";
import { asc } from "drizzle-orm";

import { protectedProcedure, router } from "../index";

export const teamRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db.select().from(team).orderBy(asc(team.name));
  }),
});
