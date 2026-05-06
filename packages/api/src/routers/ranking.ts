import { db } from "@codecon/db";
import { user } from "@codecon/db/schema/auth";
import { ranking } from "@codecon/db/schema/ranking.schema";
import { desc, eq } from "drizzle-orm";

import { protectedProcedure, router } from "../index";

export const rankingRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db
      .select({
        id: ranking.id,
        userId: ranking.userId,
        userName: user.name,
        points: ranking.points,
      })
      .from(ranking)
      .innerJoin(user, eq(ranking.userId, user.id))
      .orderBy(desc(ranking.points), user.name);
  }),
});
