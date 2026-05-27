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
import { and, asc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import z from "zod";

import { adminProcedure, protectedProcedure, router } from "../index";
import { calculateBetPoints } from "../lib/bet-scoring";

const teamA = alias(team, "teamA");
const teamB = alias(team, "teamB");
const teamAGroup = alias(teamGroup, "teamAGroup");
const teamBGroup = alias(teamGroup, "teamBGroup");
const expectedWinner = alias(team, "expectedWinner");
const idSchema = z.number().int().positive();
const scoreSchema = z.number().int().min(0).max(99);
const editableMatchStatusSchema = z.enum(["draft", "pending"]);

export const matchRouter = router({
  getAll: adminProcedure.query(async () => {
    return await db.select().from(match);
  }),
  getByRound: protectedProcedure
    .input(
      z.object({
        roundId: idSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereConditions = [eq(match.roundId, input.roundId)];

      if (!ctx.session.user.isAdmin) {
        whereConditions.push(ne(match.status, "draft"));
      }

      return await db
        .select({
          id: match.id,
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          roundId: match.roundId,
          roundNumber: round.number,
          status: match.status,
          teamAGroupId: sql<number>`coalesce(${teamAGroup.id}, 0)`,
          teamAGroupName: sql<string>`coalesce(${teamAGroup.name}, 'A definir')`,
          teamAName: sql<string>`coalesce(${teamA.name}, 'A definir')`,
          teamAFlag: sql<string>`coalesce(${teamA.flag}, '')`,
          teamBGroupId: sql<number>`coalesce(${teamBGroup.id}, 0)`,
          teamBName: sql<string>`coalesce(${teamB.name}, 'A definir')`,
          teamBFlag: sql<string>`coalesce(${teamB.flag}, '')`,
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
        .leftJoin(teamA, eq(match.teamAId, teamA.id))
        .leftJoin(teamB, eq(match.teamBId, teamB.id))
        .leftJoin(teamAGroup, eq(teamA.teamGroupId, teamAGroup.id))
        .leftJoin(teamBGroup, eq(teamB.teamGroupId, teamBGroup.id))
        .innerJoin(stadium, eq(match.stadiumId, stadium.id))
        .leftJoin(expectedWinner, eq(match.expectedWinnerId, expectedWinner.id))
        .leftJoin(
          bet,
          and(eq(bet.matchId, match.id), eq(bet.userId, ctx.session.user.id)),
        )
        .where(and(...whereConditions))
        .orderBy(asc(match.id));
    }),

  create: adminProcedure
    .input(
      z.object({
        teamAId: idSchema.nullable().optional(),
        teamBId: idSchema.nullable().optional(),
        roundId: idSchema,
        stadiumId: idSchema,
        date: z.string().datetime(),
        status: editableMatchStatusSchema.default("pending"),
      }),
    )
    .mutation(async ({ input }) => {
      const teamAId = input.teamAId ?? null;
      const teamBId = input.teamBId ?? null;

      if (input.status === "pending" && (!teamAId || !teamBId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Publique apenas partidas com dois times definidos",
        });
      }

      if (teamAId !== null && teamBId !== null && teamAId === teamBId) {
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

      const requestedTeamIds = [...new Set([teamAId, teamBId].filter(isId))];

      if (requestedTeamIds.length > 0) {
        const teams = await db
          .select({
            id: team.id,
          })
          .from(team)
          .where(
            and(inArray(team.id, requestedTeamIds), isNull(team.deletedAt)),
          );
        const teamIds = new Set(teams.map((teamRow) => teamRow.id));

        if (requestedTeamIds.some((teamId) => !teamIds.has(teamId))) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Time não encontrado",
          });
        }
      }

      const stadiumRows = await db
        .select({ id: stadium.id })
        .from(stadium)
        .where(and(eq(stadium.id, input.stadiumId), isNull(stadium.deletedAt)))
        .limit(1);

      if (!stadiumRows[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Estádio não encontrado",
        });
      }

      return await db.insert(match).values({
        teamAId,
        teamBId,
        roundId: input.roundId,
        stadiumId: input.stadiumId,
        date: new Date(input.date),
        status: input.status,
      });
    }),

  updateResult: adminProcedure
    .input(
      z.object({
        matchId: idSchema,
        teamAId: idSchema.nullable().optional(),
        teamBId: idSchema.nullable().optional(),
        scoreA: scoreSchema.nullable().optional(),
        scoreB: scoreSchema.nullable().optional(),
        stadiumId: idSchema,
        date: z.string().datetime(),
        expectedWinner: z.enum(["teamA", "teamB"]).nullable().optional(),
        status: editableMatchStatusSchema.optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const matchRows = await db
        .select({
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          scoreA: match.scoreA,
          scoreB: match.scoreB,
          expectedWinnerId: match.expectedWinnerId,
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

      const nextStatus = input.status ?? matchRow.status;
      const teamAId =
        input.teamAId === undefined ? matchRow.teamAId : input.teamAId;
      const teamBId =
        input.teamBId === undefined ? matchRow.teamBId : input.teamBId;
      const scoreA = input.scoreA === undefined ? matchRow.scoreA : input.scoreA;
      const scoreB = input.scoreB === undefined ? matchRow.scoreB : input.scoreB;

      if (nextStatus === "pending" && (!teamAId || !teamBId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Publique apenas partidas com dois times definidos",
        });
      }

      if (teamAId !== null && teamBId !== null && teamAId === teamBId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Uma partida precisa de dois times diferentes",
        });
      }

      const requestedTeamIds = [...new Set([teamAId, teamBId].filter(isId))];

      if (requestedTeamIds.length > 0) {
        const teams = await db
          .select({ id: team.id })
          .from(team)
          .where(
            and(inArray(team.id, requestedTeamIds), isNull(team.deletedAt)),
          );
        const teamIds = new Set(teams.map((teamRow) => teamRow.id));

        if (requestedTeamIds.some((teamId) => !teamIds.has(teamId))) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Time não encontrado",
          });
        }
      }

      const stadiumRows = await db
        .select({ id: stadium.id })
        .from(stadium)
        .where(and(eq(stadium.id, input.stadiumId), isNull(stadium.deletedAt)))
        .limit(1);

      if (!stadiumRows[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Estádio não encontrado",
        });
      }

      const expectedWinnerId =
        input.expectedWinner === undefined
          ? matchRow.expectedWinnerId
          : input.expectedWinner === "teamA"
            ? teamAId
            : input.expectedWinner === "teamB"
              ? teamBId
              : null;

      if (input.expectedWinner && expectedWinnerId === null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Defina o time antes de marcar o vencedor esperado",
        });
      }

      const [updatedMatch] = await db
        .update(match)
        .set({
          teamAId,
          teamBId,
          scoreA,
          scoreB,
          stadiumId: input.stadiumId,
          date: new Date(input.date),
          expectedWinnerId,
          status: nextStatus,
        })
        .where(and(eq(match.id, input.matchId), ne(match.status, "complete")))
        .returning({ id: match.id });

      if (!updatedMatch) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Não é possível editar uma partida já concluída",
        });
      }

      return updatedMatch;
    }),

  complete: adminProcedure
    .input(
      z.object({
        matchId: idSchema,
      }),
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const [matchRow] = await tx
          .update(match)
          .set({ status: "complete" })
          .where(and(eq(match.id, input.matchId), eq(match.status, "pending")))
          .returning({
            id: match.id,
            status: match.status,
            scoreA: match.scoreA,
            scoreB: match.scoreB,
            expectedWinnerId: match.expectedWinnerId,
          });

        if (!matchRow) {
          const existingMatch = await tx
            .select({ id: match.id, status: match.status })
            .from(match)
            .where(eq(match.id, input.matchId))
            .limit(1);

          if (!existingMatch[0]) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Partida não encontrada",
            });
          }

          if (existingMatch[0].status === "draft") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Publique a partida antes de concluí-la",
            });
          }

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

        const pointsByUserId = new Map<string, number>();
        const logEntries: Array<{
          userId: string;
          matchId: number;
          basePoints: number;
          modifierPoints: number;
          totalPoints: number;
          modifier: string;
        }> = [];

        for (const betRow of bets) {
          const { basePoints, modifierPoints, totalPoints } = calculateBetPoints(
            {
              scoreA: betRow.scoreA,
              scoreB: betRow.scoreB,
            },
            {
              scoreA: matchRow.scoreA,
              scoreB: matchRow.scoreB,
            },
            betRow.modifier,
          );

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
          await tx
            .insert(ranking)
            .values({ userId, points })
            .onConflictDoUpdate({
              target: ranking.userId,
              set: {
                points: sql`${ranking.points} + ${points}`,
              },
            });
        }

        if (logEntries.length > 0) {
          await tx.insert(rankingLog).values(logEntries);
        }

        return { awardedUsers: pointsByUserId.size, betsFound: bets.length };
      });
    }),
});

function isId(value: number | null): value is number {
  return value !== null;
}
