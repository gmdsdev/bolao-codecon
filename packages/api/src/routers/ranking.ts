import { db } from "@codecon/db";
import { user } from "@codecon/db/schema/auth";
import { match } from "@codecon/db/schema/match.schema";
import { ranking } from "@codecon/db/schema/ranking.schema";
import { rankingLog } from "@codecon/db/schema/ranking_log.schema";
import { round } from "@codecon/db/schema/round.schema";
import { team } from "@codecon/db/schema/team.schema";
import { asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import z from "zod";

import { protectedProcedure, router } from "../index";

const teamA = alias(team, "teamA");
const teamB = alias(team, "teamB");

export const rankingRouter = router({
  getAll: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return await db
        .select({
          id: ranking.id,
          userId: ranking.userId,
          userName: user.name,
          points: ranking.points,
        })
        .from(ranking)
        .innerJoin(user, eq(ranking.userId, user.id))
        .orderBy(desc(ranking.points), user.name)
        .limit(input?.limit ?? 100);
    }),

  getLog: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await db
        .select({
          id: rankingLog.id,
          matchId: rankingLog.matchId,
          teamAName: teamA.name,
          teamAFlag: teamA.flag,
          teamBName: teamB.name,
          teamBFlag: teamB.flag,
          roundTitle: round.title,
          basePoints: rankingLog.basePoints,
          modifierPoints: rankingLog.modifierPoints,
          totalPoints: rankingLog.totalPoints,
          modifier: rankingLog.modifier,
          createdAt: rankingLog.createdAt,
        })
        .from(rankingLog)
        .innerJoin(match, eq(rankingLog.matchId, match.id))
        .innerJoin(round, eq(match.roundId, round.id))
        .innerJoin(teamA, eq(match.teamAId, teamA.id))
        .innerJoin(teamB, eq(match.teamBId, teamB.id))
        .where(eq(rankingLog.userId, input.userId))
        .orderBy(desc(rankingLog.createdAt), asc(rankingLog.id));
    }),

  getMyLog: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select({
        id: rankingLog.id,
        matchId: rankingLog.matchId,
        teamAName: teamA.name,
        teamAFlag: teamA.flag,
        teamBName: teamB.name,
        teamBFlag: teamB.flag,
        roundTitle: round.title,
        basePoints: rankingLog.basePoints,
        modifierPoints: rankingLog.modifierPoints,
        totalPoints: rankingLog.totalPoints,
        modifier: rankingLog.modifier,
        createdAt: rankingLog.createdAt,
      })
      .from(rankingLog)
      .innerJoin(match, eq(rankingLog.matchId, match.id))
      .innerJoin(round, eq(match.roundId, round.id))
      .innerJoin(teamA, eq(match.teamAId, teamA.id))
      .innerJoin(teamB, eq(match.teamBId, teamB.id))
      .where(eq(rankingLog.userId, ctx.session.user.id))
      .orderBy(desc(rankingLog.createdAt), asc(rankingLog.id));
  }),
});
