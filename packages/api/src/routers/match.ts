import { db } from "@codecon/db";
import { bet } from "@codecon/db/schema/bet.schema";
import { match } from "@codecon/db/schema/match.schema";
import { round } from "@codecon/db/schema/round.schema";
import { team } from "@codecon/db/schema/team.schema";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { and, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const teamA = alias(team, "teamA");
const teamB = alias(team, "teamB");
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
          teamAName: teamA.name,
          teamBName: teamB.name,
          scoreA: match.scoreA,
          scoreB: match.scoreB,
          expectedWinnerName: expectedWinner.name,
          hasBet: sql<boolean>`${bet.id} is not null`,
          betScoreA: bet.scoreA,
          betScoreB: bet.scoreB,
          betModifier: bet.modifier,
        })
        .from(match)
        .innerJoin(teamA, eq(match.teamAId, teamA.id))
        .innerJoin(teamB, eq(match.teamBId, teamB.id))
        .leftJoin(expectedWinner, eq(match.expectedWinnerId, expectedWinner.id))
        .leftJoin(
          bet,
          and(eq(bet.matchId, match.id), eq(bet.userId, ctx.session.user.id)),
        )
        .where(eq(match.roundId, input.roundId));
    }),

  create: protectedProcedure
    .input(
      z.object({
        teamAId: z.number(),
        teamBId: z.number(),
        roundId: z.number(),
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

      return await db.insert(match).values({
        teamAId: input.teamAId,
        teamBId: input.teamBId,
        roundId: input.roundId,
      });
    }),

  updateResult: protectedProcedure
    .input(
      z.object({
        matchId: z.number(),
        scoreA: z.number().int().min(0),
        scoreB: z.number().int().min(0),
        expectedWinner: z.enum(["teamA", "teamB"]),
      }),
    )
    .mutation(async ({ input }) => {
      const matchRows = await db
        .select({
          teamAId: match.teamAId,
          teamBId: match.teamBId,
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

      const expectedWinnerId =
        input.expectedWinner === "teamA" ? matchRow.teamAId : matchRow.teamBId;

      return await db
        .update(match)
        .set({
          scoreA: input.scoreA,
          scoreB: input.scoreB,
          expectedWinnerId,
        })
        .where(eq(match.id, input.matchId));
    }),
});
