"use client";

import { TableCell, TableRow } from "@codecon/ui/components/table";

import type { RankingUser } from "./types";

export function RankingRow({
  row,
  position,
  onSelect,
}: {
  row: RankingUser;
  position: number;
  onSelect: () => void;
}) {
  return (
    <TableRow
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes da pontuação de ${row.userName}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className="block cursor-pointer p-3 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none sm:table-row sm:p-0"
    >
      <TableCell className="inline-block w-10 p-0 text-muted-foreground sm:table-cell sm:w-12 sm:p-2">
        {position}
      </TableCell>
      <TableCell className="inline-block max-w-[calc(100%-6rem)] whitespace-normal p-0 font-medium sm:table-cell sm:max-w-none sm:p-2">
        {row.userName}
      </TableCell>
      <TableCell className="block p-0 pt-2 text-right font-semibold sm:table-cell sm:p-2">
        {row.points} pts
      </TableCell>
    </TableRow>
  );
}
