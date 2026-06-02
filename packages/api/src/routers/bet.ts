import { db } from "@codecon/db";
import { user } from "@codecon/db/schema/auth";
import { bet } from "@codecon/db/schema/bet.schema";
import { match } from "@codecon/db/schema/match.schema";
import { rankingLog } from "@codecon/db/schema/ranking_log.schema";
import { round } from "@codecon/db/schema/round.schema";
import { team } from "@codecon/db/schema/team.schema";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ne, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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
const teamA = alias(team, "teamA");
const teamB = alias(team, "teamB");
const pageSize = 10;

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
        createdAt: bet.createdAt,
      })
      .from(bet)
      .orderBy(desc(bet.createdAt), desc(bet.id));
  }),

  getLogs: adminProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).optional(),
          userId: z.string().optional(),
          modifier: z.enum(["all", ...betModifiers]).optional(),
          matchStatus: z.enum(["all", "complete", "not_complete"]).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const page = input?.page ?? 1;
      const offset = (page - 1) * pageSize;
      const whereConditions: SQL[] = [];

      if (input?.userId) {
        whereConditions.push(eq(bet.userId, input.userId));
      }

      if (input?.modifier && input.modifier !== "all") {
        whereConditions.push(eq(bet.modifier, input.modifier));
      }

      if (input?.matchStatus === "complete") {
        whereConditions.push(eq(match.status, "complete"));
      }

      if (input?.matchStatus === "not_complete") {
        whereConditions.push(ne(match.status, "complete"));
      }

      const where = whereConditions.length
        ? and(...whereConditions)
        : undefined;

      const [totalResult, rows] = await Promise.all([
        db
          .select({ total: count() })
          .from(bet)
          .innerJoin(match, eq(bet.matchId, match.id))
          .where(where),

        db
          .select({
            id: bet.id,
            userId: bet.userId,
            userName: user.name,
            userEmail: user.email,
            matchId: bet.matchId,
            matchDate: match.date,
            matchStatus: match.status,
            roundTitle: round.title,
            teamAName: sql<string>`coalesce(${teamA.name}, ${match.teamASource}, 'A definir')`,
            teamAFlag: sql<string>`coalesce(${teamA.flag}, '')`,
            teamBName: sql<string>`coalesce(${teamB.name}, ${match.teamBSource}, 'A definir')`,
            teamBFlag: sql<string>`coalesce(${teamB.flag}, '')`,
            scoreA: bet.scoreA,
            scoreB: bet.scoreB,
            modifier: bet.modifier,
            createdAt: bet.createdAt,
            totalPoints: rankingLog.totalPoints,
          })
          .from(bet)
          .innerJoin(user, eq(bet.userId, user.id))
          .innerJoin(match, eq(bet.matchId, match.id))
          .innerJoin(round, eq(match.roundId, round.id))
          .leftJoin(teamA, eq(match.teamAId, teamA.id))
          .leftJoin(teamB, eq(match.teamBId, teamB.id))
          .leftJoin(
            rankingLog,
            and(
              eq(rankingLog.userId, bet.userId),
              eq(rankingLog.matchId, bet.matchId),
            ),
          )
          .where(where)
          .orderBy(desc(bet.createdAt), desc(bet.id))
          .limit(pageSize)
          .offset(offset),
      ]);

      const total = totalResult[0]?.total ?? 0;

      return {
        rows,
        page,
        pageSize,
        total,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
      };
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
