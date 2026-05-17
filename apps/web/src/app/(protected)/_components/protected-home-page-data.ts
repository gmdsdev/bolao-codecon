import "server-only";

import type { AppRouter } from "@codecon/api/routers/index";
import { getRequestOrigin } from "@/lib/request-origin";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { headers } from "next/headers";

const DEFAULT_ROUND_ID = 1;

export async function getProtectedHomePageData(roundId = DEFAULT_ROUND_ID) {
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

  const [rounds, ranking, matches] = await Promise.all([
    client.round.getAll.query(),
    client.ranking.getAll.query({ limit: 10 }),
    client.match.getByRound.query({ roundId }),
  ]);

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
