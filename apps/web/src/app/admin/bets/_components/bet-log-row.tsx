"use client";

import { TableCell, TableRow } from "@codecon/ui/components/table";

import {
  formatDateTime,
  formatTeam,
  getBetModifierLabel,
} from "./bet-utils";
import type { BetLog } from "./types";

export function BetLogRow({ bet }: { bet: BetLog }) {
  const pointsLabel =
    bet.totalPoints === null ? "Não distribuído" : `${bet.totalPoints} pts`;

  return (
    <TableRow className="block p-3 sm:table-row sm:p-0">
      <TableCell className="block whitespace-normal p-0 font-medium sm:table-cell sm:p-2">
        <span className="break-words">{bet.userName}</span>
        <span className="mt-1 block break-all text-xs font-normal text-muted-foreground">
          {bet.userEmail}
        </span>
      </TableCell>
      <TableCell className="mt-2 block whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2 sm:text-sm">
        <span className="text-muted-foreground sm:hidden">Partida</span>
        <span className="mt-1 block break-words sm:mt-0">
          {formatTeam(bet.teamAFlag, bet.teamAName)}
          <span className="mx-1.5 text-muted-foreground">x</span>
          {formatTeam(bet.teamBFlag, bet.teamBName)}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {bet.roundTitle}
        </span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2">
        <span className="text-muted-foreground sm:hidden">Data/hora</span>
        <span className="text-right sm:text-left">
          {formatDateTime(bet.createdAt)}
        </span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2 sm:text-sm">
        <span className="text-muted-foreground sm:hidden">Placar</span>
        <span>
          {bet.scoreA} - {bet.scoreB}
          {bet.penaltyScoreA !== null && bet.penaltyScoreB !== null
            ? ` (Pênaltis: ${bet.penaltyScoreA} - ${bet.penaltyScoreB})`
            : ""}
        </span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2">
        <span className="text-muted-foreground sm:hidden">Consequência</span>
        <span className="text-right sm:text-left">
          {getBetModifierLabel(bet.modifier)}
        </span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2">
        <span className="text-muted-foreground sm:hidden">Pontos</span>
        <span
          className={
            bet.totalPoints === null
              ? "text-muted-foreground"
              : "font-medium text-foreground"
          }
        >
          {pointsLabel}
        </span>
      </TableCell>
    </TableRow>
  );
}
