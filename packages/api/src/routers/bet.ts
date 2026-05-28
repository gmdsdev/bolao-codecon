import { db } from "@codecon/db";
import { bet } from "@codecon/db/schema/bet.schema";
import { match } from "@codecon/db/schema/match.schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { randomInt } from "node:crypto";
import z from "zod";

import { adminProcedure, protectedProcedure, router } from "../index";
import { isBetClosed } from "../lib/bet-rules";
import { applyBetScoreModifier } from "../lib/bet-scoring";

const betModifiers = [
  "invert_bet",
  "double_points",
  "half_points",
  "invalid_bet",
  "lucky_duck",
  "normal",
] as const;
const idSchema = z.number().int().positive();
const scoreSchema = z.number().int().min(0).max(99);

export const betRouter = router({
  getAll: adminProcedure.query(async () => {
    return await db
      .select({
        id: bet.id,
        matchId: bet.matchId,
        userId: bet.userId,
        scoreA: bet.scoreA,
        scoreB: bet.scoreB,
        modifier: bet.modifier,
      })
      .from(bet)
      .orderBy(bet.matchId);
  }),

  create: protectedProcedure
    .input(
      z.object({
        matchId: idSchema,
        scoreA: scoreSchema,
        scoreB: scoreSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const matchRows = await db
        .select({
          scoreA: match.scoreA,
          scoreB: match.scoreB,
          date: match.date,
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

      if (isBetClosed(matchRow)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "As apostas estão encerradas para esta partida",
        });
      }

      const existingBet = await db
        .select({ id: bet.id })
        .from(bet)
        .where(
          and(
            eq(bet.matchId, input.matchId),
            eq(bet.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (existingBet.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Você já fez uma aposta para esta partida",
        });
      }

      const modifier = getRandomBetModifier();
      const { scoreA, scoreB } = applyBetScoreModifier(input, modifier);

      try {
        await db.insert(bet).values({
          matchId: input.matchId,
          scoreA,
          scoreB,
          modifier,
          userId: ctx.session.user.id,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Você já fez uma aposta para esta partida",
          });
        }

        throw error;
      }

      return {
        matchId: input.matchId,
        scoreA,
        scoreB,
        modifier,
      };
    }),
});

function getRandomBetModifier() {
  return betModifiers[randomInt(betModifiers.length)] ?? "normal";
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
