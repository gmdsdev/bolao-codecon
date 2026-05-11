"use client";

import { TableSelectRound } from "@/components/tables/table-select-round";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { MatchList } from "./matches/match-list";
import type { ProtectedHomePageData } from "./protected-home-page-data";

type ProtectedHomePageClientProps = {
  initialData: Pick<ProtectedHomePageData, "roundId" | "rounds" | "matches">;
};

export function ProtectedHomePageClient({
  initialData,
}: ProtectedHomePageClientProps) {
  const [roundId, setRoundId] = useState<number>(initialData.roundId);

  const rounds = useQuery({
    ...trpc.round.getAll.queryOptions(),
    initialData: initialData.rounds,
  });
  const matches = useQuery({
    ...trpc.match.getByRound.queryOptions({
      roundId,
    }),
    initialData:
      roundId === initialData.roundId ? initialData.matches : undefined,
  });

  return (
    <>
      <TableSelectRound
        rounds={rounds as never}
        onSelectRound={(round) => {
          setRoundId(round.id);
        }}
      />
      <main className="w-full flex-1">
        {matches.isError ? (
          <div>Erro</div>
        ) : matches.data?.length ? (
          <MatchList matches={matches.data} onBetCreated={matches.refetch} />
        ) : (
          <div>Nenhum dado</div>
        )}
      </main>
    </>
  );
}
