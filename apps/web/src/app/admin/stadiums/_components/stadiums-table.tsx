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
import { StadiumRow } from "./stadium-row";
import type { Stadium } from "./types";

export function StadiumsTable({
  stadiums,
  isLoading,
  errorMessage,
  onEdit,
  onDelete,
}: {
  stadiums: Stadium[] | undefined;
  isLoading: boolean;
  errorMessage?: string;
  onEdit: (stadium: Stadium) => void;
  onDelete: (stadium: Stadium) => void;
}) {
  if (isLoading) {
    return <TableLoadingState />;
  }

  if (errorMessage) {
    return <TableErrorState message={errorMessage} />;
  }

  if (stadiums?.length === 0) {
    return <TableEmptyState>Nenhum estádio cadastrado.</TableEmptyState>;
  }

  if (stadiums !== undefined && stadiums.length > 0) {
    return (
      <Table>
        <TableHeader className="hidden sm:table-header-group">
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stadiums.map((stadium) => (
            <StadiumRow
              key={stadium.id}
              stadium={stadium}
              onEdit={() => onEdit(stadium)}
              onDelete={() => onDelete(stadium)}
            />
          ))}
        </TableBody>
      </Table>
    );
  }

  return <TableLoadingState />;
}
