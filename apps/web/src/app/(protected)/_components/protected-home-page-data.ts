import "server-only";

import type { AppRouter } from "@codecon/api/routers/index";
import { getRequestOrigin } from "@/lib/request-origin";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { headers } from "next/headers";

export async function getProtectedHomePageData() {
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

  const [rounds, ranking] = await Promise.all([
    client.round.getAll.query(),
    client.ranking.getAll.query({ limit: 10 }),
  ]);
  const roundsWithMatches = await Promise.all(
    rounds.map(async (round) => ({
      round,
      matches: await client.match.getByRound.query({ roundId: round.id }),
    })),
  );
  const nextMatch = roundsWithMatches
    .flatMap(({ round, matches }) =>
      matches
        .filter((match) => match.status === "pending")
        .map((match) => ({ match, round })),
    )
    .sort((a, b) => {
      const dateDiff =
        new Date(a.match.date).getTime() - new Date(b.match.date).getTime();

      return dateDiff || a.match.id - b.match.id;
    })[0];
  const selectedRound = nextMatch?.round ?? rounds[0];
  const roundId = selectedRound?.id ?? 1;
  const matches =
    roundsWithMatches.find(({ round }) => round.id === roundId)?.matches ?? [];

  return {
    roundId,
    renderedAt: new Date().toISOString(),
    rounds,
    ranking,
    matches,
  };
}

export type ProtectedHomePageData = Awaited<
  ReturnType<typeof getProtectedHomePageData>
>;

function getForwardedHeaders(requestHeaders: Headers) {
  const cookie = requestHeaders.get("cookie");

  if (!cookie) {
    return {};
  }

  return {
    cookie,
  };
}
