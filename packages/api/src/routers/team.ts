import { db } from "@codecon/db";
import { team } from "@codecon/db/schema/team.schema";
import { teamGroup } from "@codecon/db/schema/teamGroup.schema";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import z from "zod";

import { adminProcedure, protectedProcedure, router } from "../index";

const idSchema = z.number().int().positive();
const teamPayloadSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do time").max(120),
  flag: z.string().trim().min(1, "Informe a bandeira do time").max(20),
  teamGroupId: idSchema,
});

export const teamRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db
      .select({
        id: team.id,
        name: team.name,
        flag: team.flag,
        teamGroupId: team.teamGroupId,
        teamGroupName: teamGroup.name,
      })
      .from(team)
      .innerJoin(teamGroup, eq(team.teamGroupId, teamGroup.id))
      .where(isNull(team.deletedAt))
      .orderBy(asc(team.name));
  }),

  getGroups: protectedProcedure.query(async () => {
    return await db.select().from(teamGroup).orderBy(asc(teamGroup.name));
  }),

  create: adminProcedure.input(teamPayloadSchema).mutation(async ({ input }) => {
    await assertTeamGroupExists(input.teamGroupId);

    const [createdTeam] = await db.insert(team).values(input).returning();

    return createdTeam;
  }),

  update: adminProcedure
    .input(
      teamPayloadSchema.extend({
        teamId: idSchema,
      }),
    )
    .mutation(async ({ input }) => {
      await assertTeamGroupExists(input.teamGroupId);

      const [updatedTeam] = await db
        .update(team)
        .set({
          name: input.name,
          flag: input.flag,
          teamGroupId: input.teamGroupId,
        })
        .where(and(eq(team.id, input.teamId), isNull(team.deletedAt)))
        .returning();

      if (!updatedTeam) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Time não encontrado",
        });
      }

      return updatedTeam;
    }),

  delete: adminProcedure
    .input(
      z.object({
        teamId: idSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const [deletedTeam] = await db
        .update(team)
        .set({ deletedAt: new Date() })
        .where(and(eq(team.id, input.teamId), isNull(team.deletedAt)))
        .returning();

      if (!deletedTeam) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Time não encontrado",
        });
      }

      return deletedTeam;
    }),
});

async function assertTeamGroupExists(teamGroupId: number) {
  const [group] = await db
    .select({ id: teamGroup.id })
    .from(teamGroup)
    .where(eq(teamGroup.id, teamGroupId))
    .limit(1);

  if (!group) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Grupo não encontrado",
    });
  }
}
