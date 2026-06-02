import { db } from "@codecon/db";
import { auth } from "@codecon/auth";
import { user } from "@codecon/db/schema/auth";
import { TRPCError } from "@trpc/server";
import { asc, desc } from "drizzle-orm";
import z from "zod";

import { adminProcedure, router } from "../index";

const userIdSchema = z.string().trim().min(1, "Usuário inválido");
const userPayloadSchema = z.object({
  userId: userIdSchema,
  name: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(120, "O nome deve ter no máximo 120 caracteres"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .max(128, "A senha deve ter no máximo 128 caracteres")
    .optional(),
});

export const userRouter = router({
  getAll: adminProcedure.query(async () => {
    return await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .orderBy(desc(user.isAdmin), asc(user.name), asc(user.email));
  }),

  update: adminProcedure.input(userPayloadSchema).mutation(async ({ input }) => {
    const authContext = await auth.$context;
    const existingUser = await authContext.internalAdapter.findUserById(
      input.userId,
    );

    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Usuário não encontrado",
      });
    }

    const updatedUser = await authContext.internalAdapter.updateUser(
      input.userId,
      {
        name: input.name,
      },
    );

    if (input.password !== undefined) {
      const hashedPassword = await authContext.password.hash(input.password);
      const accounts = await authContext.internalAdapter.findAccounts(
        input.userId,
      );
      const hasCredentialAccount = accounts.some(
        (account) => account.providerId === "credential",
      );

      if (hasCredentialAccount) {
        await authContext.internalAdapter.updatePassword(
          input.userId,
          hashedPassword,
        );
      } else {
        await authContext.internalAdapter.createAccount({
          accountId: input.userId,
          providerId: "credential",
          userId: input.userId,
          password: hashedPassword,
        });
      }
    }

    return updatedUser;
  }),

  delete: adminProcedure
    .input(
      z.object({
        userId: userIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Você não pode excluir a própria conta por esta tela",
        });
      }

      const authContext = await auth.$context;
      const existingUser = await authContext.internalAdapter.findUserById(
        input.userId,
      );

      if (!existingUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuário não encontrado",
        });
      }

      await authContext.internalAdapter.deleteUser(input.userId);

      return { id: input.userId };
    }),
});
