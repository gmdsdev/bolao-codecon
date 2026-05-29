import { db } from "@codecon/db";
import { bet } from "@codecon/db/schema/bet.schema";
import { match } from "@codecon/db/schema/match.schema";
import { ranking } from "@codecon/db/schema/ranking.schema";
import { rankingLog } from "@codecon/db/schema/ranking_log.schema";
import { round } from "@codecon/db/schema/round.schema";
import { stadium } from "@codecon/db/schema/stadium.schema";
import { team } from "@codecon/db/schema/team.schema";
import { teamGroup } from "@codecon/db/schema/teamGroup.schema";
import { roundOf32Assignments } from "@codecon/db/world-cup-2026";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import z from "zod";

import { adminProcedure, protectedProcedure, router } from "../index";
import { calculateBetPoints } from "../lib/bet-scoring";
import {
  BracketRuleError,
  applyKnockoutPlacement,
  getKnockoutPlacements,
  getRoundOf32Updates,
} from "../lib/world-cup-2026-bracket";

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

      return await db
        .select({
          id: match.id,
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          roundId: match.roundId,
          roundNumber: round.number,
          matchNumber: match.matchNumber,
          teamASource: match.teamASource,
          teamBSource: match.teamBSource,
          status: match.status,
          teamAGroupId: sql<number>`coalesce(${teamAGroup.id}, 0)`,
          teamAGroupName: sql<string>`coalesce(${teamAGroup.name}, 'A definir')`,
          teamAName: sql<string>`coalesce(${teamA.name}, ${match.teamASource}, 'A definir')`,
          teamAFlag: sql<string>`coalesce(${teamA.flag}, '')`,
          teamBGroupId: sql<number>`coalesce(${teamBGroup.id}, 0)`,
          teamBName: sql<string>`coalesce(${teamB.name}, ${match.teamBSource}, 'A definir')`,
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
        .orderBy(asc(match.matchNumber), asc(match.id));
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
          .select({
            id: match.id,
            matchNumber: match.matchNumber,
            teamAId: match.teamAId,
            teamBId: match.teamBId,
            status: match.status,
            scoreA: match.scoreA,
            scoreB: match.scoreB,
            expectedWinnerId: match.expectedWinnerId,
            roundNumber: round.number,
          })
          .from(match)
          .innerJoin(round, eq(match.roundId, round.id))
          .where(eq(match.id, input.matchId))
          .limit(1);

        if (!matchRow) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Partida não encontrada",
          });
        }

        if (matchRow.status === "draft") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Publique a partida antes de concluí-la",
          });
        }

        if (matchRow.status === "complete") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A partida já foi concluída",
          });
        }

        if (matchRow.scoreA === null || matchRow.scoreB === null) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "A partida precisa ter placar antes de ser concluída",
          });
        }

        if (
          matchRow.roundNumber >= 4 &&
          matchRow.scoreA === matchRow.scoreB
        ) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Partidas eliminatórias precisam de um vencedor",
          });
        }

        const [updatedMatch] = await tx
          .update(match)
          .set({ status: "complete" })
          .where(and(eq(match.id, input.matchId), eq(match.status, "pending")))
          .returning({ id: match.id });

        if (!updatedMatch) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A partida não está mais pendente",
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

        let bracketUpdated = false;

        try {
          bracketUpdated =
            matchRow.roundNumber <= 3
              ? await tryGenerateRoundOf32(tx)
              : await advanceKnockoutMatch(tx, {
                  ...matchRow,
                  scoreA: matchRow.scoreA,
                  scoreB: matchRow.scoreB,
                });
        } catch (error) {
          throw toTrpcError(error);
        }

        return {
          awardedUsers: pointsByUserId.size,
          betsFound: bets.length,
          bracketUpdated,
        };
      });
    }),
});

function isId(value: number | null): value is number {
  return value !== null;
}

type TournamentTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function tryGenerateRoundOf32(tx: TournamentTx) {
  const groupMatches = await tx
    .select({
      status: match.status,
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      scoreA: match.scoreA,
      scoreB: match.scoreB,
    })
    .from(match)
    .innerJoin(round, eq(match.roundId, round.id))
    .where(sql`${round.number} <= 3`);

  const roundOf32MatchNumbers = Object.keys(roundOf32Assignments).map(Number);
  const existingRoundOf32Teams = await tx
    .select({
      teamAId: match.teamAId,
      teamBId: match.teamBId,
    })
    .from(match)
    .where(inArray(match.matchNumber, roundOf32MatchNumbers));

  const teamRows = await tx
    .select({
      id: team.id,
      name: team.name,
      groupName: teamGroup.name,
    })
    .from(team)
    .innerJoin(teamGroup, eq(team.teamGroupId, teamGroup.id))
    .where(isNull(team.deletedAt));

  const updates = getRoundOf32Updates({
    groupMatches,
    teams: teamRows,
    existingRoundOf32Matches: existingRoundOf32Teams,
  });

  if (!updates) return false;

  for (const update of updates) {
    await tx
      .update(match)
      .set({
        teamAId: update.teamAId,
        teamBId: update.teamBId,
        status: update.status,
      })
      .where(eq(match.matchNumber, update.matchNumber));
  }

  await tx.update(round).set({ status: "complete" }).where(sql`${round.number} <= 3`);
  await tx.update(round).set({ status: "pending" }).where(eq(round.number, 4));

  return true;
}

async function advanceKnockoutMatch(
  tx: TournamentTx,
  matchRow: {
    matchNumber: number | null;
    teamAId: number | null;
    teamBId: number | null;
    scoreA: number;
    scoreB: number;
    roundNumber: number;
  },
) {
  if (matchRow.matchNumber === null) return false;
  if (matchRow.teamAId === null || matchRow.teamBId === null) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "A partida precisa ter dois times definidos",
    });
  }

  const placements = getKnockoutPlacements(matchRow);

  if (placements.length === 0) {
    await completeRoundIfDone(tx, matchRow.roundNumber);
    return false;
  }

  for (const placement of placements) {
    await placeTeamInMatch(tx, placement);
  }

  await completeRoundIfDone(tx, matchRow.roundNumber);

  return true;
}

async function placeTeamInMatch(
  tx: TournamentTx,
  placement: ReturnType<typeof getKnockoutPlacements>[number],
) {
  const [targetMatch] = await tx
    .select({
      id: match.id,
      matchNumber: match.matchNumber,
      teamAId: match.teamAId,
      teamBId: match.teamBId,
    })
    .from(match)
    .where(eq(match.matchNumber, placement.matchNumber))
    .limit(1);

  const update = applyKnockoutPlacement(
    targetMatch
      ? {
          ...targetMatch,
          matchNumber: targetMatch.matchNumber ?? placement.matchNumber,
        }
      : undefined,
    placement,
  );

  await tx
    .update(match)
    .set({
      teamAId: update.teamAId,
      teamBId: update.teamBId,
      status: update.status,
    })
    .where(eq(match.id, update.id));
}

async function completeRoundIfDone(tx: TournamentTx, roundNumber: number) {
  const roundMatches = await tx
    .select({ status: match.status })
    .from(match)
    .innerJoin(round, eq(match.roundId, round.id))
    .where(eq(round.number, roundNumber));

  if (
    roundMatches.length > 0 &&
    roundMatches.every((roundMatch) => roundMatch.status === "complete")
  ) {
    await tx
      .update(round)
      .set({ status: "complete" })
      .where(eq(round.number, roundNumber));
  }
}

function toTrpcError(error: unknown) {
  if (!(error instanceof BracketRuleError)) return error;

  if (error.reason === "conflict") {
    return new TRPCError({ code: "CONFLICT", message: error.message });
  }

  if (error.reason === "not_found") {
    return new TRPCError({ code: "NOT_FOUND", message: error.message });
  }

  return new TRPCError({
    code: "PRECONDITION_FAILED",
    message: error.message,
  });
}
