import "server-only";

import type { AppRouter } from "@codecon/api/routers/index";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { headers } from "next/headers";

import { getRequestOrigin } from "@/lib/request-origin";

const KNOCKOUT_ROUNDS = new Set([4, 5, 6, 7, 8, 9]);

export async function getBracketPageData() {
  const requestHeaders = await headers();
  const client = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${getRequestOrigin(requestHeaders)}/trpc`,
        headers() {
          return getForwardedHeaders(requestHeaders);
        },
      }),
    ],
  });

  const rounds = await client.round.getAll.query();
  const knockoutRounds = rounds.filter((round) =>
    KNOCKOUT_ROUNDS.has(round.number),
  );
  const roundsWithMatches = await Promise.all(
    knockoutRounds.map(async (round) => ({
      round,
      matches: await client.match.getByRound.query({ roundId: round.id }),
    })),
  );

  return {
    renderedAt: new Date().toISOString(),
    rounds: roundsWithMatches.sort(
      (roundA, roundB) => roundA.round.number - roundB.round.number,
    ),
  };
}

export type BracketPageData = Awaited<ReturnType<typeof getBracketPageData>>;

function getForwardedHeaders(requestHeaders: Headers) {
  const cookie = requestHeaders.get("cookie");

  if (!cookie) {
    return {};
  }

  return {
    cookie,
  };
}
