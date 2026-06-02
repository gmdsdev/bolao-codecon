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

import { BetLogRow } from "./bet-log-row";
import type { BetLogsData } from "./types";

export function BetLogsTable({
  data,
  isLoading,
  errorMessage,
}: {
  data: BetLogsData | undefined;
  isLoading: boolean;
  errorMessage?: string;
}) {
  if (isLoading) {
    return <TableLoadingState />;
  }

  if (errorMessage) {
    return <TableErrorState message={errorMessage} />;
  }

  if (data?.rows.length === 0) {
    return <TableEmptyState>Nenhuma aposta encontrada.</TableEmptyState>;
  }

  if (data !== undefined && data.rows.length > 0) {
    return (
      <Table>
        <TableHeader className="hidden sm:table-header-group">
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Partida</TableHead>
            <TableHead>Data/hora</TableHead>
            <TableHead>Placar</TableHead>
            <TableHead>Consequência</TableHead>
            <TableHead>Pontos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.map((bet) => (
            <BetLogRow key={bet.id} bet={bet} />
          ))}
        </TableBody>
      </Table>
    );
  }

  return <TableLoadingState />;
}
