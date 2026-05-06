import { db } from "@codecon/db";
import { bet } from "@codecon/db/schema/bet.schema";
import { match } from "@codecon/db/schema/match.schema";
import { ranking } from "@codecon/db/schema/ranking.schema";
import { round } from "@codecon/db/schema/round.schema";
import { TRPCError } from "@trpc/server";
import { asc, eq, inArray } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

export const roundRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db.select().from(round).orderBy(asc(round.id));
  }),

  complete: protectedProcedure
    .input(
      z.object({
        roundId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const roundRows = await tx
          .select({
            id: round.id,
            status: round.status,
          })
          .from(round)
          .where(eq(round.number, input.roundId))
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
            message: "A rodada já foi concluída",
          });
        }

        const matches = await tx
          .select({
            id: match.id,
            scoreA: match.scoreA,
            scoreB: match.scoreB,
            expectedWinnerId: match.expectedWinnerId,
          })
          .from(match)
          .where(eq(match.roundId, input.roundId));

        if (matches.length === 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "A rodada não possui partidas",
          });
        }

        if (
          matches.some((matchRow) => {
            return (
              matchRow.scoreA === null ||
              matchRow.scoreB === null ||
              matchRow.expectedWinnerId === null
            );
          })
        ) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Toda partida precisa ter placar e vencedor esperado antes da conclusão da rodada",
          });
        }

        const matchIds = matches.map((matchRow) => matchRow.id);
        const bets = await tx
          .select({
            userId: bet.userId,
            matchId: bet.matchId,
            scoreA: bet.scoreA,
            scoreB: bet.scoreB,
            modifier: bet.modifier,
          })
          .from(bet)
          .where(inArray(bet.matchId, matchIds));

        const matchesById = new Map(
          matches.map((matchRow) => [matchRow.id, matchRow]),
        );
        const pointsByUserId = new Map<string, number>();

        for (const betRow of bets) {
          const matchRow = matchesById.get(betRow.matchId);

          if (
            !matchRow ||
            matchRow.scoreA === null ||
            matchRow.scoreB === null
          ) {
            continue;
          }

          const gotCorrectScore =
            betRow.scoreA === matchRow.scoreA &&
            betRow.scoreB === matchRow.scoreB;
          const finalWinner = getWinner(matchRow.scoreA, matchRow.scoreB);
          const betWinner = getWinner(betRow.scoreA, betRow.scoreB);
          const gotWinner = finalWinner !== null && finalWinner === betWinner;
          const basePoints = gotCorrectScore ? 3 : gotWinner ? 1 : 0;
          const points = applyBetModifier(basePoints, betRow.modifier);

          if (points > 0) {
            pointsByUserId.set(
              betRow.userId,
              (pointsByUserId.get(betRow.userId) ?? 0) + points,
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
              .set({
                points: rankingRow.points + points,
              })
              .where(eq(ranking.id, rankingRow.id));
          } else {
            await tx.insert(ranking).values({
              userId,
              points,
            });
          }
        }

        await tx
          .update(round)
          .set({
            status: "complete",
          })
          .where(eq(round.id, input.roundId));

        return {
          awardedUsers: pointsByUserId.size,
        };
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
