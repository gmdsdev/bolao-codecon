import { protectedProcedure, publicProcedure, router } from "../index";
import { accountRouter } from "./account";
import { betRouter } from "./bet";
import { matchRouter } from "./match";
import { rankingRouter } from "./ranking";
import { roundRouter } from "./round";
import { stadiumRouter } from "./stadium";
import { teamRouter } from "./team";
import { userRouter } from "./user";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "Este conteúdo é privado",
      user: ctx.session.user,
    };
  }),
  account: accountRouter,
  bet: betRouter,
  match: matchRouter,
  ranking: rankingRouter,
  round: roundRouter,
  stadium: stadiumRouter,
  team: teamRouter,
  user: userRouter,
});
export type AppRouter = typeof appRouter;
