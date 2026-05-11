import { db } from "@codecon/db";
import { round } from "@codecon/db/schema/round.schema";
import { asc } from "drizzle-orm";

import { protectedProcedure, router } from "../index";

export const roundRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db.select().from(round).orderBy(asc(round.id));
  }),
});
