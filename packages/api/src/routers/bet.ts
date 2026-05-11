import { db } from "@codecon/db";
import { bet } from "@codecon/db/schema/bet.schema";
import { match } from "@codecon/db/schema/match.schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

const betModifierSchema = z.enum([
  "invert_bet",
  "double_points",
  "half_points",
  "invalid_bet",
  "lucky_duck",
  "normal",
]);

export const betRouter = router({
  // Debug: returns all bets in the DB so admin can verify match_ids are correct
  getAll: protectedProcedure.query(async () => {
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
        matchId: z.number(),
        scoreA: z.number().int().min(0),
        scoreB: z.number().int().min(0),
        modifier: betModifierSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const matchRows = await db
        .select({
          scoreA: match.scoreA,
          scoreB: match.scoreB,
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

      if (matchRow.scoreA !== null || matchRow.scoreB !== null) {
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

      const scoreA =
        input.modifier === "invert_bet" ? input.scoreB : input.scoreA;
      const scoreB =
        input.modifier === "invert_bet" ? input.scoreA : input.scoreB;

      const [inserted] = await db
        .insert(bet)
        .values({
          matchId: input.matchId,
          scoreA,
          scoreB,
          modifier: input.modifier,
          userId: ctx.session.user.id,
        })
        .returning({ id: bet.id, matchId: bet.matchId });

      console.log(
        `[bet.create] inserted bet id=${inserted?.id} matchId=${inserted?.matchId} (input matchId=${input.matchId})`,
      );

      return {
        matchId: input.matchId,
        scoreA,
        scoreB,
        modifier: input.modifier,
      };
    }),
});
