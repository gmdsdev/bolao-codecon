import { db } from "@codecon/db";
import { stadium } from "@codecon/db/schema/stadium.schema";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import z from "zod";

import { adminProcedure, protectedProcedure, router } from "../index";

const idSchema = z.number().int().positive();
const stadiumPayloadSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do estádio").max(120),
  city: z.string().trim().min(1, "Informe a cidade do estádio").max(120),
});

export const stadiumRouter = router({
  getAll: protectedProcedure.query(async () => {
    return await db
      .select()
      .from(stadium)
      .where(isNull(stadium.deletedAt))
      .orderBy(asc(stadium.name));
  }),

  create: adminProcedure
    .input(stadiumPayloadSchema)
    .mutation(async ({ input }) => {
      const [createdStadium] = await db
        .insert(stadium)
        .values(input)
        .returning();

      return createdStadium;
    }),

  update: adminProcedure
    .input(
      stadiumPayloadSchema.extend({
        stadiumId: idSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const [updatedStadium] = await db
        .update(stadium)
        .set({
          name: input.name,
          city: input.city,
        })
        .where(and(eq(stadium.id, input.stadiumId), isNull(stadium.deletedAt)))
        .returning();

      if (!updatedStadium) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Estádio não encontrado",
        });
      }

      return updatedStadium;
    }),

  delete: adminProcedure
    .input(
      z.object({
        stadiumId: idSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const [deletedStadium] = await db
        .update(stadium)
        .set({ deletedAt: new Date() })
        .where(and(eq(stadium.id, input.stadiumId), isNull(stadium.deletedAt)))
        .returning();

      if (!deletedStadium) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Estádio não encontrado",
        });
      }

      return deletedStadium;
    }),
});
