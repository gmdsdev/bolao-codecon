"use client";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@codecon/ui/components/empty";
import { TableSelectRound } from "@/components/tables/table-select-round";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { AlertCircleIcon, CalendarXIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { MatchList } from "./matches/match-list";
import type { ProtectedHomePageData } from "./protected-home-page-data";

type ProtectedHomePageClientProps = {
  initialData: Pick<
    ProtectedHomePageData,
    "roundId" | "renderedAt" | "rounds" | "matches"
  >;
};

export function ProtectedHomePageClient({
  initialData,
}: ProtectedHomePageClientProps) {
  const [roundId, setRoundId] = useState<number>(initialData.roundId);
  const [hasHydrated, setHasHydrated] = useState(false);

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
  const visibleMatches =
    !hasHydrated && roundId === initialData.roundId
      ? initialData.matches
      : matches.data;

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return (
    <>
      <TableSelectRound
        rounds={rounds as never}
        onSelectRound={(round) => {
          setRoundId(round.id);
        }}
      />
      <main className="w-full flex-1">
        {hasHydrated && matches.isError ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <AlertCircleIcon className="size-10 text-destructive" />
              </EmptyMedia>
              <EmptyTitle>Erro ao carregar partidas</EmptyTitle>
              <EmptyDescription>
                Não foi possível buscar as partidas desta rodada. Tente novamente.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : visibleMatches?.length ? (
          <MatchList
            matches={visibleMatches}
            renderedAt={initialData.renderedAt}
            onBetCreated={matches.refetch}
          />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <CalendarXIcon className="size-10 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Nenhuma partida nesta rodada</EmptyTitle>
              <EmptyDescription>
                As partidas serão exibidas aqui assim que forem cadastradas.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>
    </>
  );
}
