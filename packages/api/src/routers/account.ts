import { db } from "@codecon/db";
import { user } from "@codecon/db/schema/auth";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

export const accountRouter = router({
  delete: protectedProcedure
    .input(
      z.object({
        email: z.email("Endereço de email inválido"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const confirmationEmail = input.email.trim().toLowerCase();
      const sessionEmail = ctx.session.user.email.trim().toLowerCase();

      if (confirmationEmail !== sessionEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "O email digitado não confere",
        });
      }

      const [deletedUser] = await db
        .delete(user)
        .where(eq(user.id, ctx.session.user.id))
        .returning({ id: user.id });

      if (!deletedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      return { success: true };
    }),
});
