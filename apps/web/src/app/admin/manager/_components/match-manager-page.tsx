"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { TableSelectRound } from "@/components/tables/table-select-round";
import { getUserErrorMessage } from "@/lib/error-message";
import { trpc } from "@/utils/trpc";

import { RoundMatches } from "./round-matches";

export function MatchManagerPage() {
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);

  const rounds = useQuery(trpc.round.getAll.queryOptions());
  const teams = useQuery(trpc.team.getAll.queryOptions());
  const stadiums = useQuery(trpc.stadium.getAll.queryOptions());

  useEffect(() => {
    if (rounds.data?.length && selectedRoundId === null) {
      setSelectedRoundId(rounds.data[0].id);
    }
  }, [rounds.data, selectedRoundId]);

  const selectedRound = rounds.data?.find((r) => r.id === selectedRoundId);

  if (rounds.isLoading || teams.isLoading || stadiums.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (rounds.isError) {
    return <div>Erro: {getUserErrorMessage(rounds.error)}</div>;
  }

  if (teams.isError) {
    return <div>Erro: {getUserErrorMessage(teams.error)}</div>;
  }

  if (stadiums.isError) {
    return <div>Erro: {getUserErrorMessage(stadiums.error)}</div>;
  }

  if (!rounds.data?.length) {
    return (
      <div className="min-h-[calc(100vh-2.5rem)] p-2 sm:p-3">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Partidas</CardTitle>
            <CardDescription>
              Cadastre rodadas antes de gerenciar partidas.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-2.5rem)] min-w-0 flex-col gap-3 p-2 sm:p-3 lg:flex-row">
      <TableSelectRound
        rounds={rounds as never}
        selectedRoundId={selectedRoundId ?? undefined}
        onSelectRound={(round) => setSelectedRoundId(round.id)}
      />

      <div className="min-w-0 w-full flex-1">
        {selectedRound ? (
          <RoundMatches
            key={selectedRound.id}
            round={selectedRound}
            teams={teams.data ?? []}
            stadiums={stadiums.data ?? []}
          />
        ) : (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            Selecione uma rodada para gerenciar as partidas.
          </div>
        )}
      </div>
    </div>
  );
}
