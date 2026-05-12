import { db } from "@codecon/db";
import { stadium } from "@codecon/db/schema/stadium.schema";
import { asc } from "drizzle-orm";

import { protectedProcedure, router } from "../index";

export const stadiumRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db.select().from(stadium).orderBy(asc(stadium.name));
  }),
});
