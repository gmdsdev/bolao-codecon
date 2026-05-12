import { db } from "@codecon/db";
import { bet } from "@codecon/db/schema/bet.schema";
import { match } from "@codecon/db/schema/match.schema";
import { ranking } from "@codecon/db/schema/ranking.schema";
import { rankingLog } from "@codecon/db/schema/ranking_log.schema";
import { round } from "@codecon/db/schema/round.schema";
import { stadium } from "@codecon/db/schema/stadium.schema";
import { team } from "@codecon/db/schema/team.schema";
import { teamGroup } from "@codecon/db/schema/teamGroup.schema";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const teamA = alias(team, "teamA");
const teamB = alias(team, "teamB");
const teamAGroup = alias(teamGroup, "teamAGroup");
const teamBGroup = alias(teamGroup, "teamBGroup");
const expectedWinner = alias(team, "expectedWinner");

export const matchRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db.select().from(match);
  }),
  getByRound: protectedProcedure
    .input(
      z.object({
        roundId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await db
        .select({
          id: match.id,
          roundId: match.roundId,
          roundNumber: round.number,
          status: match.status,
          teamAGroupId: teamAGroup.id,
          teamAGroupName: teamAGroup.name,
          teamAName: teamA.name,
          teamAFlag: teamA.flag,
          teamBGroupId: teamBGroup.id,
          teamBName: teamB.name,
          teamBFlag: teamB.flag,
          date: match.date,
          scoreA: match.scoreA,
          scoreB: match.scoreB,
          stadiumId: stadium.id,
          stadiumName: stadium.name,
          stadiumCity: stadium.city,
          expectedWinnerName: expectedWinner.name,
          hasBet: sql<boolean>`${bet.id} is not null`,
          betScoreA: bet.scoreA,
          betScoreB: bet.scoreB,
          betModifier: bet.modifier,
          totalBets: sql<number>`(select count(*) from "bet" where "bet"."match_id" = ${match.id})`,
        })
        .from(match)
        .innerJoin(round, eq(match.roundId, round.id))
        .innerJoin(teamA, eq(match.teamAId, teamA.id))
        .innerJoin(teamB, eq(match.teamBId, teamB.id))
        .innerJoin(teamAGroup, eq(teamA.teamGroupId, teamAGroup.id))
        .innerJoin(teamBGroup, eq(teamB.teamGroupId, teamBGroup.id))
        .innerJoin(stadium, eq(match.stadiumId, stadium.id))
        .leftJoin(expectedWinner, eq(match.expectedWinnerId, expectedWinner.id))
        .leftJoin(
          bet,
          and(eq(bet.matchId, match.id), eq(bet.userId, ctx.session.user.id)),
        )
        .where(eq(match.roundId, input.roundId))
        .orderBy(asc(match.id));
    }),

  create: protectedProcedure
    .input(
      z.object({
        teamAId: z.number(),
        teamBId: z.number(),
        roundId: z.number(),
        stadiumId: z.number(),
        date: z.string().datetime(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.teamAId === input.teamBId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Uma partida precisa de dois times diferentes",
        });
      }

      const roundRows = await db
        .select({
          id: round.id,
          status: round.status,
        })
        .from(round)
        .where(eq(round.id, input.roundId))
        .limit(1);

      const roundRow = roundRows[0];

      if (!roundRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rodada não encontrada",
        });
      }

      if (roundRow.status === "complete") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Não é possível adicionar partidas a uma rodada concluída",
        });
      }

      const teams = await db
        .select({
          id: team.id,
        })
        .from(team)
        .where(inArray(team.id, [input.teamAId, input.teamBId]));
      const teamIds = new Set(teams.map((teamRow) => teamRow.id));

      if (!teamIds.has(input.teamAId) || !teamIds.has(input.teamBId)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Time não encontrado",
        });
      }

      const stadiumRows = await db
        .select({ id: stadium.id })
        .from(stadium)
        .where(eq(stadium.id, input.stadiumId))
        .limit(1);

      if (!stadiumRows[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Estádio não encontrado",
        });
      }

      return await db.insert(match).values({
        teamAId: input.teamAId,
        teamBId: input.teamBId,
        roundId: input.roundId,
        stadiumId: input.stadiumId,
        date: new Date(input.date),
      });
    }),

  updateResult: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
        scoreA: z.number().int().min(0),
        scoreB: z.number().int().min(0),
        stadiumId: z.number(),
        date: z.string().datetime(),
        expectedWinner: z.enum(["teamA", "teamB"]).nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const matchRows = await db
        .select({
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          status: match.status,
        })
        .from(match)
        .where(eq(match.id, input.matchId))
        .limit(1);

      const matchRow = matchRows[0];

      if (!matchRow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Partida não encontrada",
        });
      }

      if (matchRow.status === "complete") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Não é possível editar uma partida já concluída",
        });
      }

      const stadiumRows = await db
        .select({ id: stadium.id })
        .from(stadium)
        .where(eq(stadium.id, input.stadiumId))
        .limit(1);

      if (!stadiumRows[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Estádio não encontrado",
        });
      }

      const expectedWinnerId =
        input.expectedWinner === "teamA"
          ? matchRow.teamAId
          : input.expectedWinner === "teamB"
            ? matchRow.teamBId
            : null;

      return await db
        .update(match)
        .set({
          scoreA: input.scoreA,
          scoreB: input.scoreB,
          stadiumId: input.stadiumId,
          date: new Date(input.date),
          expectedWinnerId,
        })
        .where(eq(match.id, input.matchId));
    }),

  complete: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const matchRows = await tx
          .select({
            id: match.id,
            status: match.status,
            scoreA: match.scoreA,
            scoreB: match.scoreB,
            expectedWinnerId: match.expectedWinnerId,
          })
          .from(match)
          .where(eq(match.id, input.matchId))
          .limit(1);

        const matchRow = matchRows[0];

        if (!matchRow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Partida não encontrada",
          });
        }

        if (matchRow.status === "complete") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A partida já foi concluída",
          });
        }

        if (
          matchRow.scoreA === null ||
          matchRow.scoreB === null
        ) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "A partida precisa ter placar antes de ser concluída",
          });
        }

        const bets = await tx
          .select({
            userId: bet.userId,
            scoreA: bet.scoreA,
            scoreB: bet.scoreB,
            modifier: bet.modifier,
          })
          .from(bet)
          .where(eq(bet.matchId, input.matchId));

        console.log(
          `[match.complete] matchId=${input.matchId} → found ${bets.length} bet(s)`,
        );

        const pointsByUserId = new Map<string, number>();
        const logEntries: Array<{
          userId: string;
          matchId: number;
          basePoints: number;
          modifierPoints: number;
          totalPoints: number;
          modifier: string;
        }> = [];

        const finalWinner = getWinner(matchRow.scoreA, matchRow.scoreB);

        for (const betRow of bets) {
          const gotCorrectScore =
            betRow.scoreA === matchRow.scoreA &&
            betRow.scoreB === matchRow.scoreB;
          const betWinner = getWinner(betRow.scoreA, betRow.scoreB);
          const gotWinner = finalWinner !== null && finalWinner === betWinner;
          const basePoints = gotCorrectScore ? 3 : gotWinner ? 1 : 0;
          const totalPoints = applyBetModifier(basePoints, betRow.modifier);
          const modifierPoints = totalPoints - basePoints;

          logEntries.push({
            userId: betRow.userId,
            matchId: input.matchId,
            basePoints,
            modifierPoints,
            totalPoints,
            modifier: betRow.modifier,
          });

          if (totalPoints > 0) {
            pointsByUserId.set(
              betRow.userId,
              (pointsByUserId.get(betRow.userId) ?? 0) + totalPoints,
            );
          }
        }

        for (const [userId, points] of pointsByUserId) {
          const rankingRows = await tx
            .select({
              id: ranking.id,
              points: ranking.points,
            })
            .from(ranking)
            .where(eq(ranking.userId, userId))
            .limit(1);

          const rankingRow = rankingRows[0];

          if (rankingRow) {
            await tx
              .update(ranking)
              .set({ points: rankingRow.points + points })
              .where(eq(ranking.id, rankingRow.id));
          } else {
            await tx.insert(ranking).values({ userId, points });
          }
        }

        if (logEntries.length > 0) {
          await tx.insert(rankingLog).values(logEntries);
        }

        await tx
          .update(match)
          .set({ status: "complete" })
          .where(eq(match.id, input.matchId));

        return { awardedUsers: pointsByUserId.size, betsFound: bets.length };
      });
    }),
});

function getWinner(scoreA: number, scoreB: number) {
  if (scoreA > scoreB) {
    return "teamA";
  }

  if (scoreB > scoreA) {
    return "teamB";
  }

  return null;
}

function applyBetModifier(points: number, modifier: string) {
  if (points === 0) {
    return 0;
  }

  if (modifier === "double_points") {
    return points * 2;
  }

  if (modifier === "half_points") {
    return Math.floor(points / 2);
  }

  if (modifier === "invalid_bet") {
    return 0;
  }

  if (modifier === "lucky_duck") {
    return points + 1;
  }

  return points;
}
