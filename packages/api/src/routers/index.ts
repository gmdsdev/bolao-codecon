import { protectedProcedure, publicProcedure, router } from "../index";
import { betRouter } from "./bet";
import { matchRouter } from "./match";
import { rankingRouter } from "./ranking";
import { roundRouter } from "./round";
import { stadiumRouter } from "./stadium";
import { teamRouter } from "./team";

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
  bet: betRouter,
  match: matchRouter,
  ranking: rankingRouter,
  round: roundRouter,
  stadium: stadiumRouter,
  team: teamRouter,
});
export type AppRouter = typeof appRouter;
