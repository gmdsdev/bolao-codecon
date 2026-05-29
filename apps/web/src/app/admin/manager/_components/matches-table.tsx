"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";

import {
  TableEmptyState,
  TableErrorState,
  TableLoadingState,
} from "@/components/tables/table-state";
import { MatchRow } from "./match-row";
import type { Match } from "./types";

export function MatchesTable({
  matches,
  isLoading,
  errorMessage,
  roundComplete,
  onEditMatch,
}: {
  matches: Match[] | undefined;
  isLoading: boolean;
  errorMessage?: string;
  roundComplete: boolean;
  onEditMatch: (match: Match) => void;
}) {
  if (isLoading) {
    return <TableLoadingState />;
  }

  if (errorMessage) {
    return <TableErrorState message={errorMessage} />;
  }

  if (matches?.length === 0) {
    return <TableEmptyState>Nenhuma partida nesta rodada.</TableEmptyState>;
  }

  if (matches !== undefined && matches.length > 0) {
    return (
      <Table>
        <TableHeader className="hidden sm:table-header-group">
          <TableRow>
            <TableHead>Partida</TableHead>
            <TableHead>Vencedor esperado</TableHead>
            <TableHead>Placar</TableHead>
            <TableHead>Apostas</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              roundComplete={roundComplete}
              onEdit={() => onEditMatch(match)}
            />
          ))}
        </TableBody>
      </Table>
    );
  }

  return <TableLoadingState />;
}
