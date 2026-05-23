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
} from "../../_components/table-state";
import { RankingRow } from "./ranking-row";
import type { RankingUser } from "./types";

export function RankingTable({
  ranking,
  isLoading,
  errorMessage,
  onSelectUser,
}: {
  ranking: RankingUser[] | undefined;
  isLoading: boolean;
  errorMessage?: string;
  onSelectUser: (user: RankingUser) => void;
}) {
  if (isLoading) {
    return <TableLoadingState />;
  }

  if (errorMessage) {
    return <TableErrorState message={errorMessage} />;
  }

  if (ranking?.length === 0) {
    return <TableEmptyState>Ainda não há classificação.</TableEmptyState>;
  }

  if (ranking !== undefined && ranking.length > 0) {
    return (
      <Table>
        <TableHeader className="hidden sm:table-header-group">
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Participante</TableHead>
            <TableHead className="text-right">Pontos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ranking.map((row, index) => (
            <RankingRow
              key={row.id}
              row={row}
              position={index + 1}
              onSelect={() => onSelectUser(row)}
            />
          ))}
        </TableBody>
      </Table>
    );
  }

  return <TableLoadingState />;
}
