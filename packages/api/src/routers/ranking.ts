import { db } from "@codecon/db";
import { user } from "@codecon/db/schema/auth";
import { bet } from "@codecon/db/schema/bet.schema";
import { match } from "@codecon/db/schema/match.schema";
import { ranking } from "@codecon/db/schema/ranking.schema";
import { rankingLog } from "@codecon/db/schema/ranking_log.schema";
import { round } from "@codecon/db/schema/round.schema";
import { team } from "@codecon/db/schema/team.schema";
import { and, asc, count, desc, eq, gt, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import z from "zod";

import { protectedProcedure, router } from "../index";

const teamA = alias(team, "teamA");
const teamB = alias(team, "teamB");

export const rankingRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({ limit: z.number().int().min(1).max(100).optional() }).optional(),
    )
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
    .input(z.object({ userId: z.string().min(1) }))
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
          betScoreA: bet.scoreA,
          betScoreB: bet.scoreB,
          matchScoreA: match.scoreA,
          matchScoreB: match.scoreB,
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
        .innerJoin(
          bet,
          and(
            eq(bet.matchId, rankingLog.matchId),
            eq(bet.userId, input.userId),
          ),
        )
        .where(eq(rankingLog.userId, input.userId))
        .orderBy(desc(rankingLog.createdAt), asc(rankingLog.id));
    }),

  getMySummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [myRanking] = await db
      .select({ points: ranking.points })
      .from(ranking)
      .where(eq(ranking.userId, userId))
      .limit(1);

    const [positionResult, betsPlacedResult, pendingMatchesResult, lastLogEntry] =
      await Promise.all([
        // Count higher scores instead of loading the full leaderboard.
        db
          .select({ count: count() })
          .from(ranking)
          .where(
            myRanking
              ? gt(ranking.points, myRanking.points)
              : eq(ranking.userId, userId),
          ),

        // Total bets placed by the user
        db
          .select({ count: count() })
          .from(bet)
          .where(eq(bet.userId, userId)),

        // Matches without a result that the user hasn't bet on yet
        db
          .select({ count: count() })
          .from(match)
          .leftJoin(
            bet,
            and(eq(bet.matchId, match.id), eq(bet.userId, userId)),
          )
          .where(and(isNull(match.scoreA), isNull(bet.id))),

        // Last points earned
        db
          .select({
            totalPoints: rankingLog.totalPoints,
            basePoints: rankingLog.basePoints,
            modifierPoints: rankingLog.modifierPoints,
            modifier: rankingLog.modifier,
          })
          .from(rankingLog)
          .where(eq(rankingLog.userId, userId))
          .orderBy(desc(rankingLog.createdAt))
          .limit(1),
      ]);

    return {
      position: myRanking ? (positionResult[0]?.count ?? 0) + 1 : null,
      totalPoints: myRanking?.points ?? 0,
      betsPlaced: betsPlacedResult[0]?.count ?? 0,
      pendingMatches: pendingMatchesResult[0]?.count ?? 0,
      lastPoints: lastLogEntry[0] ?? null,
    };
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
        betScoreA: bet.scoreA,
        betScoreB: bet.scoreB,
        matchScoreA: match.scoreA,
        matchScoreB: match.scoreB,
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
      .innerJoin(
        bet,
        and(
          eq(bet.matchId, rankingLog.matchId),
          eq(bet.userId, ctx.session.user.id),
        ),
      )
      .where(eq(rankingLog.userId, ctx.session.user.id))
      .orderBy(desc(rankingLog.createdAt), asc(rankingLog.id));
  }),
});
