"use client";

import { Button } from "@codecon/ui/components/button";
import { TableCell, TableRow } from "@codecon/ui/components/table";
import { CheckCircle2, FileText, GitBranch } from "lucide-react";

import type { Match } from "./types";

export function MatchRow({
  match,
  roundComplete,
  onEdit,
}: {
  match: Match;
  roundComplete: boolean;
  onEdit: () => void;
}) {
  const isComplete = match.status === "complete";
  const isDraft = match.status === "draft";
  const teamALabel = `${match.teamAFlag ?? ""} ${
    match.teamAName ?? match.teamASource ?? "A definir"
  }`.trim();
  const teamBLabel = `${match.teamBName ?? match.teamBSource ?? "A definir"} ${
    match.teamBFlag ?? ""
  }`.trim();

  const scoreLabel =
    match.scoreA !== null && match.scoreB !== null
      ? `${match.scoreA} - ${match.scoreB}`
      : "-";

  const expectedWinnerLabel = match.expectedWinnerName
    ? match.expectedWinnerName === match.teamAName
      ? `${match.teamAFlag ?? ""} ${match.teamAName ?? "A definir"}`.trim()
      : `${match.teamBFlag ?? ""} ${match.teamBName ?? "A definir"}`.trim()
    : "-";

  return (
    <TableRow
      className={
        isComplete
          ? "block p-3 opacity-60 sm:table-row sm:p-0"
          : isDraft
            ? "block bg-muted/40 p-3 sm:table-row sm:p-0"
          : "block p-3 sm:table-row sm:p-0"
      }
    >
      <TableCell className="block whitespace-normal p-0 font-medium sm:table-cell sm:p-2">
        <div className="mb-1 flex min-w-0 flex-wrap items-center gap-1.5">
          {match.matchNumber !== null && (
            <span className="inline-flex items-center gap-1 border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              <GitBranch className="size-3" />
              Jogo {match.matchNumber}
            </span>
          )}
        </div>
        <span className="break-words">{teamALabel}</span>
        <span className="mx-1.5 text-muted-foreground">x</span>
        <span className="break-words">{teamBLabel}</span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2">
        <span className="text-muted-foreground sm:hidden">
          Vencedor esperado
        </span>
        <span className="text-right sm:text-left">{expectedWinnerLabel}</span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2 sm:text-sm">
        <span className="text-muted-foreground sm:hidden">Placar</span>
        <span>{scoreLabel}</span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2">
        <span className="text-muted-foreground sm:hidden">Apostas</span>
        <span className="text-muted-foreground">{match.totalBets ?? 0}</span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2">
        <span className="text-muted-foreground sm:hidden">Status</span>
        {isDraft ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
            <FileText className="size-3.5" />
            Rascunho
          </span>
        ) : isComplete ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
            <CheckCircle2 className="size-3.5" />
            Concluída
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Pendente</span>
        )}
      </TableCell>
      <TableCell className="block p-0 pt-3 text-right sm:table-cell sm:p-2">
        <div className="flex justify-stretch gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onEdit}
            disabled={isComplete || roundComplete}
          >
            Editar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
